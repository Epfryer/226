import { SITE_ORIGIN } from "../client/src/lib/site-metadata";

export function validateReceiptStatusOrigin(origin: string) {
  const url = new URL(origin);
  if (url.protocol !== "https:" || url.username || url.password || url.port ||
      url.pathname !== "/" || url.search || url.hash ||
      (url.origin !== SITE_ORIGIN && !url.hostname.endsWith(".replit.dev"))) {
    throw new Error("Order status origin is unavailable");
  }
  return url.origin;
}

// Snapshot the environment alongside the receipt so retries keep the same link.
// Orders and their private tokens are never copied between development and live.
export function receiptStatusOrigin(testMode: boolean, config = {
  deployment: process.env.REPLIT_DEPLOYMENT === "1",
  devDomain: process.env.REPLIT_DEV_DOMAIN,
}) {
  if (!testMode || config.deployment) return SITE_ORIGIN;
  if (!config.devDomain) throw new Error("Development order status domain is unavailable");
  return validateReceiptStatusOrigin(`https://${config.devDomain}`);
}
