import express from "express";
import cors from "cors";
import { Client } from "@replit/object-storage";
import { PdfFileCache, parseRange } from "./pdf-delivery";

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
  credentials: true,
  allowedHeaders: ['Content-Type', 'Range'],
  exposedHeaders: ['Accept-Ranges', 'Content-Range', 'Content-Length']
}));

const rangeCache = new PdfFileCache(name => storage.downloadAsStream(name));

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
    const nameRaw = req.params.filename || "";
    if (!nameRaw) {
      console.error("[PDF] Missing filename param");
      return res.status(400).json({ error: "Missing filename param" });
    }

    let name = /\.pdf$/i.test(nameRaw) ? nameRaw : `${nameRaw}.pdf`;
    if (/[\\/\r\n"]/.test(name) || name.includes("..")) {
      return res.status(400).json({ error: "Invalid PDF filename" });
    }
    
    // Optional: Check for iOS user agent or ?mobile=1 flag to serve mobile-optimized PDF
    const userAgent = req.headers['user-agent'] || '';
    const isMobileRequest = req.query.mobile === '1' || /iPad|iPhone|iPod/i.test(userAgent);
    const enableMobileVariant = process.env.ENABLE_MOBILE_PDF_VARIANT === 'true';
    
    if (enableMobileVariant && isMobileRequest) {
      // Try to serve mobile-optimized variant if it exists
      const mobileVariantName = name.replace(/\.pdf$/i, '_mobile_flat.pdf');
      const existsResult = await storage.exists(mobileVariantName);
      
      if (existsResult.ok && existsResult.value) {
        console.log(`[PDF] Serving mobile variant: ${mobileVariantName} for iOS/mobile device`);
        name = mobileVariantName;
      } else {
        console.log(`[PDF] Mobile variant not found: ${mobileVariantName}, serving original`);
      }
    }
    
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

      let file;
      try {
        file = await rangeCache.acquire(name);
      } catch (error) {
        // HTTP permits ignoring Range and sending 200. Preserve access to large
        // books or during cache saturation without growing the disk/RAM cache.
        const message = error instanceof Error ? error.message : "";
        if (!message.includes("exceeds supported size") && !message.includes("service busy")) throw error;
        if (res.destroyed) return;
        res.status(200).set({
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${name}"`,
          "Cache-Control": "public, max-age=3600",
        });
        const fallback = storage.downloadAsStream(name);
        res.on("close", () => fallback.destroy());
        fallback.on("error", () => res.destroy());
        fallback.pipe(res);
        return;
      }
      if (res.destroyed) { file.release(); return; }
      const parsed = parseRange(range, file.size);
      if (!parsed) {
        file.release();
        return res.status(416).set("Content-Range", `bytes */${file.size}`).send("Range Not Satisfiable");
      }
      res.status(206).set({
        "Content-Range": `bytes ${parsed.start}-${parsed.end}/${file.size}`,
        "Accept-Ranges": "bytes",
        "Content-Length": String(parsed.end - parsed.start + 1),
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${name}"`,
        "Cache-Control": "public, max-age=3600",
      });
      const stream = file.stream(parsed);
      res.on("close", () => { stream.destroy(); file.release(); });
      stream.on("error", () => { file.release(); res.destroy(); });
      stream.pipe(res);
      return;
    }

    // For full file requests (desktop), use streaming
    console.log(`[PDF] Streaming full file: ${name}`);
    const exists = await storage.exists(name);
    if (!exists.ok) return res.status(503).json({ error: "PDF storage unavailable" });
    if (!exists.value) return res.status(404).json({ error: "PDF not found" });
    if (res.destroyed) return;
    const stream = storage.downloadAsStream(name);
    
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${name}"`);
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cache-Control", "public, max-age=3600");

    stream.pipe(res);
    res.on("close", () => stream.destroy());
    
    stream.on('error', (err: any) => {
      console.error("[PDF] Stream error:", err);
      if (!res.headersSent) {
        res.status(500).json({
          error: "Stream error",
          details: err?.message || String(err)
        });
      } else res.destroy();
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