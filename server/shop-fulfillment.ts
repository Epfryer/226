import type Stripe from "stripe";
import { getPrintfulClient } from "./printful";
import { getUncachableStripeClient } from "./stripeClient";
import { shopPool, withOrderLock } from "./shop-store";
import { cents, type ShopItem } from "./shop-domain";

// Deliberately no dependency on a browser visit. Both verified webhooks and reconciliation
// use the same durable lock and deterministic Printful external ID.
export async function fulfillOrder(id: string, services = {
  getStripe: getUncachableStripeClient, getPrintful: getPrintfulClient,
}) {
  return withOrderLock(id, async (client, order) => {
    if (!order.stripe_session_id || ["test_paid", "canceled", "shipped"].includes(order.status)) return;
    const stripe = await services.getStripe();
    const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id, {
      expand: ["payment_intent.latest_charge"],
    });
    if (session.metadata?.shop_order_id !== order.id || session.currency !== "usd" ||
      session.client_reference_id !== order.id) {
      await client.query("UPDATE shop_orders SET status='needs_attention',error_code='payment_mismatch',updated_at=now() WHERE id=$1", [id]);
      throw new Error("Payment order mismatch");
    }
    if (session.payment_status !== "paid") {
      if (session.status === "expired") {
        await client.query("UPDATE shop_orders SET status='canceled', updated_at=now() WHERE id=$1", [id]);
      }
      return;
    }
    if (session.amount_subtotal !== order.subtotal ||
      session.total_details?.amount_shipping !== order.shipping_amount ||
      (session.amount_total || 0) < order.expected_amount) {
      await client.query("UPDATE shop_orders SET status='needs_attention',paid=true,error_code='amount_mismatch',updated_at=now() WHERE id=$1", [id]);
      throw new Error("Payment amount mismatch");
    }
    const payment = session.payment_intent as Stripe.PaymentIntent;
    const charge = payment?.latest_charge as Stripe.Charge;
    if (charge?.refunded || charge?.amount_refunded > 0) {
      await client.query("UPDATE shop_orders SET status='canceled', paid=true, updated_at=now() WHERE id=$1", [id]);
      return;
    }
    await client.query("UPDATE shop_orders SET paid=true, test_mode=$2, updated_at=now() WHERE id=$1", [id, !session.livemode]);
    // Stripe test events must NEVER create, confirm, or charge a real Printful order.
    if (!session.livemode) {
      await client.query("UPDATE shop_orders SET status='test_paid' WHERE id=$1", [id]);
      return;
    }
    if (process.env.REPLIT_DEPLOYMENT !== "1") throw new Error("Live fulfillment is disabled in development");
    const printful = services.getPrintful();
    await client.query("UPDATE shop_orders SET status='processing', attempts=attempts+1, updated_at=now() WHERE id=$1", [id]);
    try {
      // Lookup first recovers an accepted request whose network response was lost.
      let remote = await printful.getOrderByExternalId(`web-${id}`);
      const data = {
        external_id: `web-${id}`,
        recipient: order.recipient,
        items: (order.items as ShopItem[]).map(i => ({ sync_variant_id: i.syncVariantId, quantity: i.quantity })),
        shipping: order.shipping_id,
        retail_costs: {
          currency: "USD", subtotal: (order.subtotal / 100).toFixed(2),
          shipping: (order.shipping_amount / 100).toFixed(2),
          tax: ((session.total_details?.amount_tax || 0) / 100).toFixed(2),
        },
      };
      if (!remote) remote = await printful.createOrder(data);
      if (!remote?.result?.id) throw new Error("Missing Printful order");
      const pfOrder = remote.result;
      await client.query("UPDATE shop_orders SET printful_order_id=$2 WHERE id=$1", [id, String(pfOrder.id)]);
      if (["canceled", "failed", "onhold"].includes(pfOrder.status)) throw new Error("Printful order needs attention");
      if (pfOrder.status === "draft") {
        // Stop rather than unexpectedly spending more than the customer's pre-tax payment.
        if (cents(pfOrder.costs?.total) > order.expected_amount) throw new Error("Fulfillment costs exceed payment");
        remote = await printful.confirmOrder(pfOrder.id);
      }
      if (!["pending", "inprocess", "partial", "fulfilled"].includes(remote.result?.status)) {
        throw new Error("Printful has not accepted production");
      }
      const shipment = remote.result.shipments?.find((s: any) => s.tracking_number);
      const tracking = shipment ? {
        number: shipment.tracking_number, url: shipment.tracking_url, carrier: shipment.carrier,
      } : null;
      await client.query(`UPDATE shop_orders SET status=$2, error_code=NULL, tracking=$3,
        next_attempt_at=now()+interval '30 minutes', updated_at=now() WHERE id=$1`,
      [id, remote.result.status === "fulfilled" ? "shipped" : "fulfilled", tracking]);
    } catch (error: any) {
      await client.query(`UPDATE shop_orders SET status='needs_attention', error_code=$2,
        next_attempt_at=now()+interval '5 minutes', updated_at=now() WHERE id=$1`,
      [id, error.response?.status ? `printful_${error.response.status}` : "fulfillment_unavailable"]);
      console.error("[Shop] Fulfillment needs attention for order", id);
      throw new Error("Fulfillment needs attention"); // Non-2xx webhook => Stripe retries.
    }
  });
}

export async function reconcileOrders() {
  const result = await shopPool.query(`SELECT id FROM shop_orders
    WHERE stripe_session_id IS NOT NULL AND status IN ('awaiting_payment','paid','processing','needs_attention','fulfilled')
    AND next_attempt_at <= now() AND attempts < 8 ORDER BY created_at LIMIT 10`);
  for (const { id } of result.rows) {
    await shopPool.query("UPDATE shop_orders SET next_attempt_at=now()+interval '1 minute' WHERE id=$1", [id]);
    await fulfillOrder(id).catch(() => console.error("[Shop] Scheduled reconciliation deferred", id));
  }
}
