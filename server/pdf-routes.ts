
import express from "express";
import { Client } from "@replit/object-storage";
import { Readable } from "stream";

const router = express.Router();
const storage = new Client();

// Proxy a single file: /api/publications/<filename>.pdf
router.get("/:filename", async (req, res) => {
  try {
    const file = decodeURIComponent(req.params.filename);
    const key = file; // The key is just the filename since we store without 'publications/' prefix
    
    console.log(`Attempting to fetch PDF: ${key}`);
    
    // Check if file exists
    const list = await storage.list();
    if (!list.ok) {
      console.error("Failed to list objects:", list.error);
      return res.status(500).json({ error: "Storage error", message: list.error });
    }
    
    const exists = list.value.some(obj => obj.name === key);
    if (!exists) {
      console.error(`PDF not found: ${key}`);
      return res.status(404).json({ error: "Not found", key });
    }
    
    // Get a short-lived signed URL
    const urlResult = await storage.getSignedDownloadUrl(key, { expiresInSeconds: 600 });
    if (!urlResult.ok) {
      console.error("Failed to get signed URL:", urlResult.error);
      return res.status(500).json({ error: "Failed to get signed URL", message: urlResult.error });
    }
    
    const url = urlResult.value;

    // Support Range requests (PDF.js needs this for seeking)
    const headers: Record<string, string> = {};
    if (req.headers.range) {
      headers.Range = req.headers.range;
    }

    const upstream = await fetch(url, { headers });

    if (!(upstream.ok || upstream.status === 206)) {
      const text = await upstream.text().catch(() => "");
      console.error("Upstream error", upstream.status, text);
      return res.status(upstream.status).send(text || "Upstream error");
    }

    // Pass through important headers
    res.status(upstream.status);
    const passHeader = (h: string) => {
      const v = upstream.headers.get(h);
      if (v) res.setHeader(h, v);
    };
    
    passHeader("content-type");
    passHeader("content-length");
    passHeader("accept-ranges");
    passHeader("content-range");
    passHeader("last-modified");
    passHeader("etag");
    passHeader("cache-control");

    // Inline display in browser
    res.setHeader("Content-Disposition", `inline; filename="${file}"`);

    if (upstream.body) {
      // Convert Web ReadableStream to Node stream and pipe
      Readable.fromWeb(upstream.body as any).pipe(res);
    } else {
      console.error("Upstream had no body");
      res.status(502).end("Upstream had no body");
    }
    
  } catch (err: any) {
    console.error("PDF proxy error:", err?.message || err);
    res.status(500).json({ error: "PDF proxy failed", message: err?.message || String(err) });
  }
});

export default router;
