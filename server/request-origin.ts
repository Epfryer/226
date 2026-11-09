import type { RequestHandler } from "express";
import { SITE_ORIGIN } from "../client/src/lib/site-metadata";
export function trustedOrigins() {
  const origins = new Set([SITE_ORIGIN]);
  for (const domain of [process.env.REPLIT_DEV_DOMAIN, ...(process.env.REPLIT_DOMAINS?.split(",") || [])]) {
    if (domain) origins.add(`https://${domain.trim()}`);
  }
  for (const origin of (process.env.AUTH_TRUSTED_ORIGINS || "").split(",")) {
    if (!origin.trim()) continue;
    try { const url = new URL(origin.trim()); if (url.protocol === "https:" || (process.env.NODE_ENV !== "production" && url.protocol === "http:")) origins.add(url.origin); } catch { /* invalid configuration grants no access */ }
  }
  return origins;
}
export const apiCors: RequestHandler = (req, res, next) => {
  const origin = req.get("Origin");
  if (origin) {
    if (!trustedOrigins().has(origin)) { res.status(403).json({ error: "This request must come from this website." }); return; }
    res.set("Access-Control-Allow-Origin", origin);
    res.vary("Origin");
    res.set("Access-Control-Allow-Credentials", "true");
  }
  res.set("Access-Control-Allow-Methods", "GET, HEAD, POST, DELETE, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Range, X-CSRF-Token, X-Shop-Token");
  res.set("Access-Control-Expose-Headers", "Accept-Ranges, Content-Range, Content-Length");
  if (req.method === "OPTIONS") { res.sendStatus(204); return; }
  next();
};
