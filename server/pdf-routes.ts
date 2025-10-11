import express from "express";
import cors from "cors";
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

    console.log(`Attempting to fetch PDF: ${name}`);

    // Check if file exists
    const existsResult = await storage.exists(name);
    if (!existsResult.ok || !existsResult.value) {
      console.error(`PDF not found: ${name}`);
      return res.status(404).json({ error: "Not found", key: name });
    }
    
    console.log(`PDF exists, proceeding with download: ${name}`);

    // Download the PDF as bytes with timeout
    console.log(`Starting download for: ${name}`);
    
    const downloadPromise = storage.downloadAsBytes(name);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Download timeout after 30s')), 30000)
    );
    
    const downloadResult = await Promise.race([downloadPromise, timeoutPromise])
      .catch(err => {
        console.error("Download error:", err);
        throw err;
      });
    
    if (!downloadResult.ok) {
      console.error("Failed to download PDF:", downloadResult.error);
      return res.status(500).json({ error: "Failed to download PDF", details: downloadResult.error });
    }

    const pdfBuffer = downloadResult.value;
    console.log(`Successfully downloaded ${name}, size: ${pdfBuffer.length} bytes`);

    // Set headers for PDF display
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${name}"`);
    res.setHeader("Content-Length", pdfBuffer.length.toString());
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cache-Control", "public, max-age=3600");

    // Send the buffer
    res.send(pdfBuffer);

  } catch (err: any) {
    console.error("PDF proxy error:", err?.message || err);
    console.error("Full error details:", err);
    res.status(500).json({ 
      error: "PDF proxy failed", 
      message: err?.message || String(err),
      stack: err?.stack
    });
  }
});

export default router;