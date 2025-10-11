import express from "express";
import cors from "cors";
import axios from "axios";
import { Client } from "@replit/object-storage";

const router = express.Router();
const storage = new Client();

router.use(cors({ 
  origin: ["https://ethanfryer.com", "http://localhost:5173", "http://localhost:5000"],
  credentials: true
}));

router.get("/:filename", async (req, res) => {
  try {
    const nameRaw = decodeURIComponent(req.params.filename || "");
    if (!nameRaw) {
      return res.status(400).json({ error: "Missing filename param" });
    }

    const name = /\.pdf$/i.test(nameRaw) ? nameRaw : `${nameRaw}.pdf`;

    // Verify exact key exists
    const hit = await storage.list({ prefix: name, limit: 1 });
    if (!hit.ok || !hit.value.length || hit.value[0].name !== name) {
      console.error(`PDF not found: ${name}`);
      return res.status(404).json({ error: "Not found", key: name });
    }

    // Get signed URL
    const urlResult = await storage.getSignedDownloadUrl(name, { expiresInSeconds: 600 });
    if (!urlResult.ok) {
      console.error("Failed to get signed URL:", urlResult.error);
      return res.status(500).json({ error: "Failed to get signed URL" });
    }

    const url = urlResult.value;

    // Stream using axios (works on Node 16/18)
    const axiosResponse = await axios({
      method: "GET",
      url: url,
      responseType: "stream",
      headers: req.headers.range ? { Range: req.headers.range } : {}
    });

    // Set status and headers
    res.status(axiosResponse.status);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${name}"`);

    if (axiosResponse.headers["content-length"]) {
      res.setHeader("Content-Length", axiosResponse.headers["content-length"]);
    }
    if (axiosResponse.headers["accept-ranges"]) {
      res.setHeader("Accept-Ranges", axiosResponse.headers["accept-ranges"]);
    }
    if (axiosResponse.headers["content-range"]) {
      res.setHeader("Content-Range", axiosResponse.headers["content-range"]);
    }

    // Pipe the stream
    axiosResponse.data.pipe(res);

  } catch (err: any) {
    console.error("PDF proxy error:", err?.message || err);
    res.status(500).json({ 
      error: "PDF proxy failed", 
      message: err?.message || String(err) 
    });
  }
});

export default router;