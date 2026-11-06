import pg from "pg";
import type { PoolClient } from "pg";
export const shopPool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 5, connectionTimeoutMillis: 10000 });
export async function withOrderLock<T>(id: string, action: (client: PoolClient, order: any) => Promise<T>): Promise<T | undefined> {
  const client = await shopPool.connect();
  try {
    // Session advisory locks survive commits, release on connection loss, and work across instances.
    const locked = await client.query("SELECT pg_try_advisory_lock(hashtextextended($1, 0)) AS locked", [id]);
    if (!locked.rows[0].locked) return;
    const result = await client.query("SELECT * FROM shop_orders WHERE id = $1", [id]);
    if (!result.rows[0]) throw new Error("Order not found");
    return await action(client, result.rows[0]);
  } finally {
    await client.query("SELECT pg_advisory_unlock(hashtextextended($1, 0))", [id]).catch(() => {});
    client.release();
  }
}
