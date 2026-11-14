import express from "express";
import { Client } from "@replit/object-storage";
import { pipeline } from "node:stream/promises";
import { parseRange } from "./pdf-delivery";
import { createPdfStorage, type PdfStorage } from "./pdf-storage";

const BUCKET_ID = process.env.REPL_OBJSTORE_BUCKET_ID || "replit-objstore-a538e3dd-048a-46be-b441-abad6fd99c02";

export function createPdfRouter(files: PdfStorage, health = async () => {
  const result = await new Client({ bucketId: BUCKET_ID }).list();
  if (!result.ok) throw new Error("Storage unavailable");
  return result.value.length;
}) {
  const router = express.Router();
  router.get("/health", async (_req, res) => {
    try { res.json({ status: "ok", bucketId: BUCKET_ID, objectCount: await health(), environment: process.env.NODE_ENV || "development" }); }
    catch { res.status(503).json({ status: "error", message: "Object Storage connection failed" }); }
  });
  router.get("/:filename", async (req, res) => {
    const abort = new AbortController();
    const cancel = () => abort.abort();
    res.once("close", cancel);
    const timeout = setTimeout(() => { cancel(); res.destroy(); }, 120_000);
    timeout.unref();
    try {
      const raw = req.params.filename || "";
      let name = /\.pdf$/i.test(raw) ? raw : `${raw}.pdf`;
      if (!raw || /[\\/\r\n"]/.test(name) || name.includes("..")) {
        res.status(400).json({ error: "Invalid PDF filename" }); return;
      }
      const mobile = req.query.mobile === "1" || /iPad|iPhone|iPod/i.test(req.headers["user-agent"] || "");
      let metadata;
      // Selection depends on User-Agent only when mobile variants are enabled.
      if (process.env.ENABLE_MOBILE_PDF_VARIANT === "true") {
        res.vary("User-Agent");
        if (mobile) {
          const variant = name.replace(/\.pdf$/i, "_mobile_flat.pdf");
          try { metadata = await files.metadata(variant); name = variant; }
          catch (error: any) { if (Number(error.code) !== 404) throw error; }
        }
      }
      metadata ??= await files.metadata(name);
      if (abort.signal.aborted) return;
      const etag = `"${metadata.generation}"`;
      // A stale If-Range must receive the complete current representation.
      const range = req.headers.range && (!req.headers["if-range"] || req.headers["if-range"] === etag)
        ? req.headers.range : undefined;
      const parsed = range ? parseRange(range, metadata.size) : undefined;
      if (range && !parsed) {
        res.status(416).set({ "Content-Range": `bytes */${metadata.size}`, "Accept-Ranges": "bytes", "Cache-Control": "no-store" })
          .send("Range Not Satisfiable"); return;
      }
      res.status(parsed ? 206 : 200).set({
        ...(parsed ? { "Content-Range": `bytes ${parsed.start}-${parsed.end}/${metadata.size}` } : {}),
        "Accept-Ranges": "bytes",
        "Content-Length": String(parsed ? parsed.end - parsed.start + 1 : metadata.size),
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${name}"`,
        "Cache-Control": "public, max-age=60",
        "ETag": etag,
      });
      // HEAD and range requests never start an unneeded full-file download.
      if (req.method === "HEAD") { res.end(); return; }
      await pipeline(files.stream(name, metadata, parsed || undefined), res, { signal: abort.signal });
    } catch (error: any) {
      if (abort.signal.aborted) return;
      console.error("[PDF] Delivery failed", error.code || "storage_error");
      if (!res.headersSent && !res.destroyed) {
        // Do not leave PDF length/range headers on a JSON error.
        for (const name of ["Content-Length", "Content-Range", "Content-Disposition", "ETag"]) res.removeHeader(name);
        res.set("Cache-Control", "no-store").status(Number(error.code) === 404 ? 404 : 503).json({ error: "PDF unavailable" });
      } else res.destroy();
    } finally {
      clearTimeout(timeout);
      res.off("close", cancel);
    }
  });
  return router;
}

export default createPdfRouter(createPdfStorage(BUCKET_ID));
