import express from "express";
import type { Express } from "express";
import { WebhookHandlers } from "./webhookHandlers";
import { getStripeSync, getUncachableStripeClient } from "./stripeClient";
import { fulfillOrder } from "./shop-fulfillment";
import { shopPool } from "./shop-store";

export function registerPaymentWebhooks(app: Express, services = {
  getSync: getStripeSync, getStripe: getUncachableStripeClient, fulfill: fulfillOrder,
}) {
  app.post("/api/stripe/webhook/:uuid", express.raw({ type: "application/json", limit: "1mb" }), async (req, res) => {
    const signature = req.get("stripe-signature");
    if (!signature) { res.status(400).json({ error: "Missing signature" }); return; }
    try {
      await WebhookHandlers.processWebhook(req.body, signature, req.params.uuid);
      res.json({ received: true });
    } catch { res.status(400).json({ error: "Webhook verification or synchronization failed" }); }
  });
  // Separate business webhook: Stripe retries failed fulfillment even if the customer never returns.
  app.post("/api/shop/payment-events/:uuid", express.raw({ type: "application/json", limit: "1mb" }), async (req, res) => {
    const signature = req.get("stripe-signature");
    if (!signature || !Buffer.isBuffer(req.body)) { res.status(400).json({ error: "Missing signature" }); return; }
    let event;
    try {
      const sync = await services.getSync();
      const record = await sync.postgresClient.query('SELECT secret, url FROM stripe._managed_webhooks WHERE uuid=$1', [req.params.uuid]);
      if (!record.rows[0]?.url.includes("/api/shop/payment-events/")) throw new Error("Invalid endpoint");
      const stripe = await services.getStripe();
      event = await stripe.webhooks.constructEventAsync(req.body, signature, record.rows[0].secret);
    } catch { res.status(400).json({ error: "Invalid webhook signature" }); return; }
    if (!["checkout.session.completed", "checkout.session.async_payment_succeeded", "checkout.session.expired", "checkout.session.async_payment_failed"].includes(event.type)) {
      res.json({ received: true }); return;
    }
    const session = event.data.object as any;
    const id = session.metadata?.shop_order_id;
    if (!id) { res.json({ received: true }); return; }
    try {
      const result = await shopPool.query("SELECT id FROM shop_orders WHERE id=$1 AND stripe_session_id=$2", [id, session.id]);
      if (!result.rows[0]) throw new Error("Checkout has not been linked to its order");
      await services.fulfill(id);
      res.json({ received: true });
    } catch { res.status(503).json({ error: "Order processing deferred. Please retry this event." }); }
  });
}
