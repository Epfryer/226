import express from "express";
import cors from "cors";
import { Client } from "@replit/object-storage";

const router = express.Router();
// Use the bucket ID from environment or config
const BUCKET_ID = process.env.REPL_OBJSTORE_BUCKET_ID || 'replit-objstore-a538e3dd-048a-46be-b441-abad6fd99c02';
const storage = new Client({ bucketId: BUCKET_ID });

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

router.get("/:filename", async (req, res) => {
  try {
    const nameRaw = decodeURIComponent(req.params.filename || "");
    if (!nameRaw) {
      return res.status(400).json({ error: "Missing filename param" });
    }

    const name = /\.pdf$/i.test(nameRaw) ? nameRaw : `${nameRaw}.pdf`;

    console.log(`Attempting to fetch PDF: ${name}`);

    // Clean up expired entries periodically
    cleanupCache();

    // Check cache first
    let pdfBuffer: Buffer;
    const cached = pdfCache.get(name);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`Using cached PDF: ${name}`);
      pdfBuffer = cached.buffer;
    } else {
      // Download the PDF as bytes
      console.log(`Downloading PDF from storage: ${name}`);
      console.log(`Using bucket ID: ${BUCKET_ID}`);
      const downloadResult = await storage.downloadAsBytes(name);
      if (!downloadResult.ok) {
        console.error("Failed to download PDF:", downloadResult.error);
        console.error("Error details:", JSON.stringify(downloadResult.error, null, 2));
        return res.status(404).json({ 
          error: "PDF not found",
          details: downloadResult.error.message 
        });
      }

      // downloadAsBytes returns Result<[Buffer], Error> - the Buffer is in an array
      pdfBuffer = downloadResult.value[0];
      
      // Cache the PDF
      pdfCache.set(name, { buffer: pdfBuffer, timestamp: Date.now() });
      console.log(`PDF cached: ${name} (${(pdfBuffer.length / (1024 * 1024)).toFixed(2)} MB)`);
    }

    const fileSize = pdfBuffer.length;

    // Handle Range requests for streaming/chunked delivery
    const range = req.headers.range;
    
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      if (start >= fileSize || end >= fileSize) {
        res.status(416).setHeader("Content-Range", `bytes */${fileSize}`);
        return res.send("Range Not Satisfiable");
      }

      const chunk = pdfBuffer.slice(start, end + 1);

      res.status(206);
      res.setHeader("Content-Range", `bytes ${start}-${end}/${fileSize}`);
      res.setHeader("Accept-Ranges", "bytes");
      res.setHeader("Content-Length", chunkSize.toString());
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${name}"`);
      res.setHeader("Cache-Control", "public, max-age=3600");
      
      console.log(`Serving range: ${start}-${end}/${fileSize} for ${name}`);
      return res.send(chunk);
    }

    // Send full file if no range requested
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${name}"`);
    res.setHeader("Content-Length", fileSize.toString());
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cache-Control", "public, max-age=3600");

    console.log(`Serving full PDF: ${name} (${(fileSize / (1024 * 1024)).toFixed(2)} MB)`);
    res.send(pdfBuffer);

  } catch (err: any) {
    console.error("PDF proxy error:", err?.message || err);
    res.status(500).json({ 
      error: "PDF proxy failed", 
      message: err?.message || String(err) 
    });
  }
});

export default router;