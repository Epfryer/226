
import express from "express";
import { Client } from "@replit/object-storage";
import { Writable } from "stream";

const router = express.Router();
const storage = new Client();

// Proxy a single file: /api/publications/<filename>.pdf
router.get("/:filename", async (req, res) => {
  try {
    const file = decodeURIComponent(req.params.filename);
    const key = file; // The key is just the filename since we store without 'publications/' prefix
    
    console.log(`Attempting to fetch PDF: ${key}`);
    
    // Get a short-lived signed URL
    const url = await storage.getSignedDownloadUrl(key, { expiresInSeconds: 600 });

    // Support Range requests (PDF.js needs this for seeking)
    const range = req.headers.range;
    const headers: HeadersInit = {};
    if (range) {
      headers.Range = range;
    }

    const r = await fetch(url, { headers });

    // Pass through important headers
    res.status(r.status);
    const headersToPass = [
      "content-type",
      "content-length",
      "accept-ranges",
      "content-range",
      "last-modified",
      "etag",
      "cache-control"
    ];
    
    headersToPass.forEach(h => {
      const v = r.headers.get(h);
      if (v) res.setHeader(h, v);
    });

    // Inline display in browser
    res.setHeader("Content-Disposition", `inline; filename="${file}"`);

    if (!r.body) {
      console.error("Upstream had no body");
      return res.status(502).end("Upstream had no body");
    }

    // Stream the response
    const reader = r.body.getReader();
    const pump = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            res.end();
            break;
          }
          if (!res.write(value)) {
            await new Promise(resolve => res.once('drain', resolve));
          }
        }
      } catch (err) {
        console.error("Stream error:", err);
        res.end();
      }
    };
    
    pump();
    
  } catch (err: any) {
    console.error("PDF proxy error:", err?.message || err);
    res.status(500).json({ error: "PDF proxy failed", message: err?.message });
  }
});

export default router;
