import pg from "pg";
import type { SyncObject } from "stripe-replit-sync";
import { getStripeSync, getUncachableStripeClient } from "./stripeClient";

// Dedicated maintenance connection: never occupy one of checkout's five slots.
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1, connectionTimeoutMillis: 10000 });
const objects: SyncObject[] = [
  "product", "price", "plan", "customer", "subscription", "subscription_schedules",
  "invoice", "charge", "setup_intent", "payment_method", "payment_intent", "tax_id",
  "credit_note", "dispute", "early_fraud_warning", "refund", "checkout_sessions",
];

/** One coordinated historical import per account/mode. Completed object types
 * survive restarts; interrupted types retry idempotently through StripeSync.
 * Webhooks and direct-payment reconciliation handle subsequent changes.
 */
export async function runShopBackfill(services = {
  pool, getSync: getStripeSync, getStripe: getUncachableStripeClient,
}) {
  const client = await services.pool.connect();
  let key: string | undefined;
  let locked = false;
  // A lost lock connection must stop the worker rather than continue uncoordinated.
  let lost = false;
  const onError = () => { lost = true; };
  client.on("error", onError);
  try {
    const stripe = await services.getStripe();
    const account = await stripe.accounts.retrieve();
    const balance = await stripe.balance.retrieve();
    key = `shop-history:${account.id}:${balance.livemode ? "live" : "test"}`;
    const result = await client.query("SELECT pg_try_advisory_lock(hashtextextended($1, 0)) AS locked", [key]);
    locked = result.rows[0].locked;
    if (!locked) return;
    const completed = await client.query("SELECT object_type FROM shop_sync_progress WHERE account_key=$1", [key]);
    const done = new Set(completed.rows.map(row => row.object_type));
    if (objects.every(object => done.has(object))) return;
    const sync = await services.getSync();
    for (const object of objects) {
      if (lost) throw new Error("Maintenance connection lost");
      if (done.has(object)) continue;
      await sync.syncBackfill({ object });
      if (lost) throw new Error("Maintenance connection lost");
      await client.query(`INSERT INTO shop_sync_progress (account_key,object_type,completed_at)
        VALUES ($1,$2,now()) ON CONFLICT (account_key,object_type) DO NOTHING`, [key, object]);
    }
    console.log("[Shop] Historical synchronization completed");
  } finally {
    if (locked && !lost) await client.query("SELECT pg_advisory_unlock(hashtextextended($1, 0))", [key]).catch(() => { lost = true; });
    client.off("error", onError);
    client.release(lost);
  }
}
