import { ReplitConnectors } from "@replit/connectors-sdk";
import { shopPool } from "./shop-store";
import type { ShopItem, Recipient } from "./shop-domain";

export interface ShopReceipt {
  orderId: string;
  recipient: Pick<Recipient, "name" | "email">;
  items: ShopItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  testMode: boolean;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]!);
}

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function renderShopReceipt(receipt: ShopReceipt) {
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

type Proxy = (path: string, options: { method: string; body: unknown; headers: Record<string, string>; signal: AbortSignal }) => Promise<Response>;
const resend: Proxy = (path, options) => new ReplitConnectors().proxy("resend", path, options);

export async function sendShopReceipt(receipt: ShopReceipt, from = process.env.INQUIRY_FROM_EMAIL, proxy: Proxy = resend) {
  if (!from) throw new Error("Receipt sender is not configured");
  const response = await proxy("/emails", {
    method: "POST",
    headers: { "Idempotency-Key": `shop-receipt/${receipt.orderId}` },
    signal: AbortSignal.timeout(15000),
    body: {
      from, to: [receipt.recipient.email], reply_to: "Epfryer@me.com",
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
