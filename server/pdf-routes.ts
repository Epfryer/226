import express from "express";
import cors from "cors";
import { Client } from "@replit/object-storage";

const router = express.Router();
// Use the bucket ID from environment or config
const BUCKET_ID = process.env.REPL_OBJSTORE_BUCKET_ID || 'replit-objstore-a538e3dd-048a-46be-b441-abad6fd99c02';

console.log('[PDF Routes] Initializing Object Storage client');
console.log('[PDF Routes] Bucket ID:', BUCKET_ID);
console.log('[PDF Routes] NODE_ENV:', process.env.NODE_ENV);

let storage: Client;
try {
  storage = new Client({ bucketId: BUCKET_ID });
  console.log('[PDF Routes] Object Storage client initialized successfully');
} catch (error: any) {
  console.error('[PDF Routes] Failed to initialize Object Storage client:', error);
  console.error('[PDF Routes] Error details:', error?.message, error?.stack);
  throw error;
}

// Allow CORS from all origins for development and deployment
router.use(cors({ 
  origin: true,  // Allow all origins
  credentials: true
}));

// Simple in-memory cache for PDF buffers (helps with range requests)
const pdfCache = new Map<string, { buffer: Buffer; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 5; // Maximum number of PDFs to cache

// Clean up expired cache entries
function cleanupCache() {
  const now = Date.now();
  for (const [key, value] of Array.from(pdfCache.entries())) {
    if (now - value.timestamp >= CACHE_TTL) {
      pdfCache.delete(key);
      console.log(`Removed expired cache entry: ${key}`);
    }
  }
  
  // If still over size limit, remove oldest entries
  if (pdfCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(pdfCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toRemove = entries.slice(0, pdfCache.size - MAX_CACHE_SIZE);
    toRemove.forEach(([key]) => {
      pdfCache.delete(key);
      console.log(`Removed old cache entry due to size limit: ${key}`);
    });
  }
}

// Health check endpoint to verify storage connection
router.get("/health", async (req, res) => {
  try {
    console.log('[PDF Health] Testing Object Storage connection...');
    const listResult = await storage.list();
    
    if (!listResult.ok) {
      console.error('[PDF Health] Storage list failed:', listResult.error);
      return res.status(500).json({
        status: 'error',
        message: 'Object Storage connection failed',
        error: listResult.error?.message
      });
    }
    
    console.log('[PDF Health] Storage connection OK, found', listResult.value?.length || 0, 'objects');
    res.json({
      status: 'ok',
      bucketId: BUCKET_ID,
      objectCount: listResult.value?.length || 0,
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error: any) {
    console.error('[PDF Health] Exception:', error);
    res.status(500).json({
      status: 'error',
      message: 'Exception during health check',
      error: error?.message || String(error)
    });
  }
});

router.get("/:filename", async (req, res) => {
  try {
    const nameRaw = decodeURIComponent(req.params.filename || "");
    if (!nameRaw) {
      console.error("[PDF] Missing filename param");
      return res.status(400).json({ error: "Missing filename param" });
    }

    const name = /\.pdf$/i.test(nameRaw) ? nameRaw : `${nameRaw}.pdf`;
    const range = req.headers.range;

    console.log(`[PDF] Request for: ${name} ${range ? `(range: ${range})` : '(full file)'}`);
    console.log(`[PDF] Environment: ${process.env.NODE_ENV || 'development'}`);

    // For range requests (mobile browsers), we need to download the specific range
    if (range) {
      console.log(`[PDF] Handling range request for ${name}`);
      
      // First, get the file size by downloading metadata
      const existsResult = await storage.exists(name);
      if (!existsResult.ok || !existsResult.value) {
        console.error("[PDF] File not found:", name);
        return res.status(404).json({ error: "PDF not found", filename: name });
      }

      // For range requests, we need to download the full file to get the size
      // This is a limitation - we'll cache it for subsequent range requests
      let pdfBuffer: Buffer;
      const cached = pdfCache.get(name);
      
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log(`[PDF] Using cached for range request: ${name}`);
        pdfBuffer = cached.buffer;
      } else {
        console.log(`[PDF] Downloading for range request: ${name}`);
        const downloadResult = await storage.downloadAsBytes(name);
        
        if (!downloadResult.ok) {
          console.error("[PDF] Download failed:", downloadResult.error);
          return res.status(500).json({ 
            error: "Failed to download PDF",
            details: downloadResult.error?.message,
            filename: name
          });
        }
        
        pdfBuffer = downloadResult.value[0];
        pdfCache.set(name, { buffer: pdfBuffer, timestamp: Date.now() });
        console.log(`[PDF] Cached for ranges: ${name} (${(pdfBuffer.length / (1024 * 1024)).toFixed(2)} MB)`);
      }

      const fileSize = pdfBuffer.length;
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
        res.status(416).setHeader("Content-Range", `bytes */${fileSize}`);
        return res.send("Range Not Satisfiable");
      }

      const chunk = pdfBuffer.slice(start, end + 1);
      const chunkSize = end - start + 1;

      res.status(206);
      res.setHeader("Content-Range", `bytes ${start}-${end}/${fileSize}`);
      res.setHeader("Accept-Ranges", "bytes");
      res.setHeader("Content-Length", chunkSize.toString());
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${name}"`);
      res.setHeader("Cache-Control", "public, max-age=3600");
      
      console.log(`[PDF] Serving range: ${start}-${end}/${fileSize} for ${name}`);
      return res.send(chunk);
    }

    // For full file requests (desktop), use streaming
    console.log(`[PDF] Streaming full file: ${name}`);
    const stream = storage.downloadAsStream(name);
    
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${name}"`);
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cache-Control", "public, max-age=3600");

    stream.pipe(res);
    
    stream.on('error', (err: any) => {
      console.error("[PDF] Stream error:", err);
      if (!res.headersSent) {
        res.status(500).json({
          error: "Stream error",
          details: err?.message || String(err)
        });
      }
    });

    stream.on('end', () => {
      console.log(`[PDF] Completed streaming: ${name}`);
    });

  } catch (err: any) {
    console.error("[PDF] Error:", err?.message || err);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: "PDF proxy failed", 
        message: err?.message || String(err) 
      });
    }
  }
});

export default router;