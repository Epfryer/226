
import express from "express";
import { Client } from "@replit/object-storage";
import { Readable } from "stream";

const router = express.Router();
const storage = new Client();

function buildFilename(req: express.Request): string | null {
  // Accept either: /api/publications/<name>.pdf  OR  /api/publications?doc=<name>[.pdf]
  let name =
    (req.params.filename as string | undefined) ??
    (req.query.doc as string | undefined);

  if (!name) return null;

  name = decodeURIComponent(name.trim());
  if (!/\.(pdf)$/i.test(name)) name += ".pdf"; // add .pdf if missing
  return name;
}

async function streamObject(key: string, req: express.Request, res: express.Response) {
  try {
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
    res.setHeader("Content-Disposition", `inline; filename="${key.split("/").pop()}"`);

    if (upstream.body) {
      // Convert Web ReadableStream to Node stream and pipe
      Readable.fromWeb(upstream.body as any).pipe(res);
    } else {
      console.error("Upstream had no body");
      res.status(502).end("Upstream had no body");
    }
  } catch (err: any) {
    console.error("Stream error:", err?.message || err);
    res.status(500).json({ error: "Stream failed", message: err?.message || String(err) });
  }
}

// Primary route: supports /:filename
router.get("/:filename", async (req, res) => {
  try {
    const name = buildFilename(req);
    if (!name) {
      return res.status(400).json({ error: "Missing filename" });
    }
    // The key is just the filename since we store without 'publications/' prefix
    await streamObject(name, req, res);
  } catch (err: any) {
    console.error("PDF proxy error:", err?.message || err);
    res.status(500).json({ error: "PDF proxy failed", message: err?.message || String(err) });
  }
});

export default router;
