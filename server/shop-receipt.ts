import { ReplitConnectors } from "@replit/connectors-sdk";
import { shopPool } from "./shop-store";
import type { ShopItem, Recipient } from "./shop-domain";
import { isSender, SUPPORT_EMAIL } from "./email-settings";
import { z } from "zod";
import { SITE_ORIGIN } from "../client/src/lib/site-metadata";

const trackingSchema = z.object({
  number: z.string().trim().min(1),
  carrier: z.string().nullish(),
  url: z.string().nullish(),
});

export interface ShopReceipt {
  orderId: string;
  recipient: Pick<Recipient, "name" | "email">;
  items: ShopItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  testMode: boolean;
  templateVersion?: 2 | 3;
  statusToken?: string;
  delivery?: { name: string; minDeliveryDays?: number; maxDeliveryDays?: number } | null;
  tracking?: z.infer<typeof trackingSchema> | null;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]!);
}

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function renderLegacyShopReceipt(receipt: ShopReceipt) {
  const rows = receipt.items.map(item => `<tr><td style="padding:8px 0">${escapeHtml(item.name)}<br /><span style="color:#666">${escapeHtml(item.color)} / ${escapeHtml(item.size)} · Qty ${item.quantity}</span></td><td align="right" style="padding:8px 0">${money(Math.round(item.price * 100) * item.quantity)}</td></tr>`).join("");
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"><meta name="x-apple-disable-message-reformatting"><title>D.EF order receipt</title></head>
<body style="background:#f0efeb;margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;color:#222"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f0efeb"><tr><td align="center" style="padding:32px 12px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff">
<tr><td style="padding:24px 28px;background:#171717;color:#fff;font-size:24px;font-weight:bold;letter-spacing:2px">D.EF</td></tr>
<tr><td style="padding:32px 28px;font-size:16px;line-height:1.6"><p style="font-size:12px;font-weight:bold;letter-spacing:2px;color:#555">ORDER RECEIPT${receipt.testMode ? " · TEST" : ""}</p><h1 style="font-size:30px;line-height:1.2">Thank you for your order.</h1>
<p>Hi ${escapeHtml(receipt.recipient.name.trim().split(/\s+/)[0])},</p><p>${receipt.testMode ? "This is a test payment. No physical order was placed." : "Your payment has been received. Your order is being processed; this receipt does not confirm shipment."}</p>
<p style="background:#f5f4f0;padding:18px 20px;overflow-wrap:anywhere"><strong>Order reference</strong><br />${escapeHtml(receipt.orderId)}</p>
<h2 style="font-size:18px">Your order</h2><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:14px">${rows}
<tr><td style="padding-top:16px">Subtotal</td><td align="right" style="padding-top:16px">${money(receipt.subtotal)}</td></tr><tr><td>Shipping</td><td align="right">${money(receipt.shipping)}</td></tr><tr><td>Tax</td><td align="right">${money(receipt.tax)}</td></tr><tr><td><strong>Total paid</strong></td><td align="right"><strong>${money(receipt.total)}</strong></td></tr></table>
<p style="margin-top:24px">Questions about your order? Reply to this email and include your order reference.</p><p>Thank you,<br /><strong>Ethan<br />D.EF</strong></p><p><a href="https://ethanfryer.com" style="color:#171717">ethanfryer.com</a></p></td></tr></table></td></tr></table></body></html>`;
}

function deliveryEstimate(delivery: ShopReceipt["delivery"]) {
  const valid = (value: unknown): value is number =>
    typeof value === "number" && Number.isInteger(value) && value > 0 && value <= 365;
  const min = delivery?.minDeliveryDays;
  const max = delivery?.maxDeliveryDays;
  const days = (value: number) => `${value} business ${value === 1 ? "day" : "days"}`;
  if (valid(min) && valid(max) && min <= max) return min === max ? days(min) : `${min}–${max} business days`;
  if (valid(min) && max == null) return `At least ${days(min)}`;
  if (valid(max) && min == null) return `Up to ${days(max)}`;
  return null;
}

function trackingUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

export function renderShopReceipt(receipt: ShopReceipt) {
  if (receipt.templateVersion !== 2 && receipt.templateVersion !== 3) return renderLegacyShopReceipt(receipt);
  if (receipt.templateVersion === 3 && !/^[a-f0-9]{64}$/.test(receipt.statusToken || "")) {
    throw new Error("Order status link is unavailable");
  }
  const rows = receipt.items.map(item => `<tr><td style="padding:12px 0;border-bottom:1px solid #292926;vertical-align:top"><strong style="font-size:12px;color:#f1f1ee">${escapeHtml(item.name)}</strong><br><span style="font-size:11px;color:#a6a6a0">${escapeHtml(item.color)} / ${escapeHtml(item.size)} &nbsp;·&nbsp; Qty ${item.quantity}</span></td><td align="right" style="padding:12px 0;border-bottom:1px solid #292926;vertical-align:top;white-space:nowrap;font-size:12px;color:#f1f1ee">${money(Math.round(item.price * 100) * item.quantity)}</td></tr>`).join("");
  const estimate = deliveryEstimate(receipt.delivery);
  const tracking = receipt.tracking;
  const link = trackingUrl(tracking?.url);
  const trackingDetails = tracking
    ? `<strong style="color:#f1f1ee">Tracking number</strong><br>${escapeHtml(tracking.number)}${tracking.carrier ? `<br>${escapeHtml(tracking.carrier)}` : ""}${link ? `<br><a href="${escapeHtml(link)}" style="color:#f1f1ee;text-decoration:underline">Track your shipment</a>` : ""}`
    : receipt.templateVersion === 3
      ? `Tracking is not available yet. Use the private link below to check for updates after this email is sent.`
      : `Tracking is not available yet. Revisit your order status page in the same browser and tab used for checkout, or reply to this email for help.`;
  const statusLink = receipt.templateVersion === 3
    ? `<p style="margin:22px 0 0"><a href="${SITE_ORIGIN}/order-status#${receipt.statusToken}" style="display:inline-block;border:1px solid #e8e8e4;color:#f1f1ee;text-decoration:none;padding:12px 20px;font-size:12px;font-weight:bold;letter-spacing:1px">CHECK LIVE ORDER STATUS</a></p><p style="margin:10px 0 0;font-size:12px;color:#a6a6a0">This private page refreshes tracking when you open it. Anyone with this link can view the order status.</p>`
    : "";
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"><meta name="x-apple-disable-message-reformatting"><title>D.EF order receipt</title></head>
<body style="margin:0;padding:0;background:#111;font-family:Arial,Helvetica,sans-serif;color:#f1f1ee">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">Your D.EF order receipt and delivery details.</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#111"><tr><td align="center" style="padding:15px 12px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#000">
<tr><td style="padding:14px 18px;background:#ededed;color:#171717"><span style="font-size:18px;font-weight:bold;letter-spacing:3px">D.EF</span><br><span style="font-size:7px;letter-spacing:2px;color:#333">STUDIO SHOP</span></td></tr>
<tr><td style="padding:34px 28px;font-size:15px;line-height:1.65">
<p style="margin:0 0 10px;font-size:9px;font-weight:bold;letter-spacing:2px;color:#a6a6a0">ORDER RECEIPT${receipt.testMode ? " · TEST" : ""}</p>
<h1 style="margin:0 0 10px;font-family:Georgia,serif;font-size:24px;font-weight:normal;line-height:1.2;color:#f1f1ee">Thank you for your order.</h1>
<p style="margin:0 0 12px">Hi ${escapeHtml(receipt.recipient.name.trim().split(/\s+/)[0])},</p>
<p style="margin:0 0 20px;color:#a6a6a0;font-size:13px">${receipt.testMode ? "This is a test payment. No physical order was placed." : "Your payment has been received. Your order is being processed; this receipt does not confirm shipment."}</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#11110e"><tr><td style="padding:14px 16px;overflow-wrap:anywhere"><span style="font-size:8px;font-weight:bold;letter-spacing:1.5px;color:#a6a6a0">ORDER REFERENCE</span><br><strong style="font-size:12px">${escapeHtml(receipt.orderId)}</strong></td></tr></table>
<h2 style="margin:24px 0 0;font-family:Georgia,serif;font-weight:normal;font-size:18px;color:#f1f1ee">Order summary</h2>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">${rows}
<tr><td style="padding-top:14px;color:#a6a6a0;font-size:13px">Subtotal</td><td align="right" style="padding-top:14px;font-size:13px">${money(receipt.subtotal)}</td></tr>
<tr><td style="color:#a6a6a0;font-size:13px">Shipping</td><td align="right" style="font-size:13px">${money(receipt.shipping)}</td></tr>
<tr><td style="color:#a6a6a0;font-size:13px">Tax</td><td align="right" style="font-size:13px">${money(receipt.tax)}</td></tr>
<tr><td style="padding-top:10px;font-size:14px"><strong>Total paid</strong></td><td align="right" style="padding-top:10px;font-size:14px"><strong>${money(receipt.total)}</strong></td></tr></table>
<h2 style="margin:24px 0 14px;font-family:Georgia,serif;font-weight:normal;font-size:18px;color:#f1f1ee">Delivery details</h2>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#11110e"><tr><td style="padding:14px 16px;font-size:12px;line-height:1.7;overflow-wrap:anywhere">
${receipt.delivery?.name ? `<strong style="color:#f1f1ee">Shipping method</strong><br>${escapeHtml(receipt.delivery.name)}<br><br>` : ""}
<strong style="color:#f1f1ee">Estimated shipping time</strong><br>${estimate ? `${escapeHtml(estimate)} (estimate only; production and delivery times can vary).` : "An estimate was not available at checkout."}<br><br>
${trackingDetails}</td></tr></table>${statusLink ? `\n${statusLink}` : ""}
<p style="margin:22px 0 16px;color:#a6a6a0;font-size:12px">Questions about your order? Reply to this email and include your order reference.</p>
<p style="margin:0 0 26px">Thank you,<br><strong>Ethan<br>D.EF</strong></p>
<p style="margin:0;border-top:1px solid #292926;padding-top:14px;font-size:10px;color:#a6a6a0"><a href="https://ethanfryer.com" style="color:#f1f1ee;text-decoration:underline">ethanfryer.com</a> &nbsp; / &nbsp; Studio shop</p>
</td></tr></table></td></tr></table></body></html>`;
}

type Proxy = (path: string, options: { method: string; body: unknown; headers: Record<string, string>; signal: AbortSignal }) => Promise<Response>;
const resend: Proxy = (path, options) => new ReplitConnectors().proxy("resend", path, options);

export async function sendShopReceipt(receipt: ShopReceipt, from = process.env.SHOP_FROM_EMAIL, proxy: Proxy = resend) {
  if (!isSender(from, SUPPORT_EMAIL)) throw new Error("Receipt sender must be configured as support@ethanfryer.com");
  const response = await proxy("/emails", {
    method: "POST",
    headers: { "Idempotency-Key": `shop-receipt/${receipt.orderId}` },
    signal: AbortSignal.timeout(15000),
    body: {
      from, to: [receipt.recipient.email], reply_to: SUPPORT_EMAIL,
      subject: receipt.testMode ? "Test receipt for your D.EF order" : "Your D.EF order receipt",
      html: renderShopReceipt(receipt),
    },
  });
  if (!response.ok) throw new Error(`Receipt provider returned ${response.status}`);
}

export async function deliverShopReceipt(id: string, send = sendShopReceipt) {
    const client = await shopPool.connect();
    let locked = false;
    try {
      locked = (await client.query("SELECT pg_try_advisory_lock(hashtextextended($1, 0)) AS locked", [`receipt:${id}`])).rows[0].locked;
      if (!locked) return;
      const row = (await client.query("SELECT * FROM shop_receipts WHERE order_id=$1 AND status='pending' AND next_attempt_at <= now()", [id])).rows[0];
      if (!row) return;
      if (Date.now() - new Date(row.created_at).getTime() >= 23 * 60 * 60 * 1000) {
        await client.query("UPDATE shop_receipts SET status='needs_attention' WHERE order_id=$1", [id]);
        console.error("[Shop] Receipt needs manual attention", id);
        return;
      }
      if ((row.data.templateVersion === 2 || row.data.templateVersion === 3) && !Object.hasOwn(row.data, "tracking") && row.attempts === 0) {
        const order = (await client.query("SELECT tracking FROM shop_orders WHERE id=$1", [id])).rows[0];
        if (!order) throw new Error("Receipt order not found");
        const tracking = order.tracking == null ? null : trackingSchema.safeParse(order.tracking);
        if (tracking && !tracking.success) console.error("[Shop] Receipt tracking details invalid", id);
        row.data.tracking = tracking?.success ? tracking.data : null;
        await client.query("UPDATE shop_receipts SET data=$2::jsonb WHERE order_id=$1", [id, JSON.stringify(row.data)]);
      }
      try {
        await send(row.data);
        await client.query("UPDATE shop_receipts SET status='sent',sent_at=now(),attempts=attempts+1 WHERE order_id=$1", [id]);
      } catch {
        await client.query("UPDATE shop_receipts SET attempts=attempts+1,next_attempt_at=now()+interval '5 minutes' WHERE order_id=$1", [id]);
        console.error("[Shop] Receipt delivery deferred", id);
      }
    } finally {
      try {
        if (locked) await client.query("SELECT pg_advisory_unlock(hashtextextended($1, 0))", [`receipt:${id}`]);
      } finally { client.release(); }
    }
}

export async function deliverPendingReceipts() {
  const pending = await shopPool.query(`SELECT order_id FROM shop_receipts
    WHERE status='pending' AND next_attempt_at <= now() ORDER BY next_attempt_at, created_at LIMIT 10`);
  for (const { order_id: id } of pending.rows) {
    await deliverShopReceipt(id);
  }
}
