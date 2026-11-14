// Development-only, additive setup run after task merges. Never run at app
// startup or in the deployment build; production schema belongs to Publish.
import pg from "pg";
import { readFile } from "node:fs/promises";

if (process.env.REPLIT_DEPLOYMENT === "1" || process.env.NODE_ENV === "production") {
  throw new Error("Shop checkpoint setup is development-only");
}
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
const client = await pool.connect();
try {
  await client.query("BEGIN");
  await client.query("SELECT pg_advisory_xact_lock(hashtextextended('shop-sync-progress-schema',0))");
  const exists = await client.query("SELECT to_regclass('public.shop_sync_progress') AS name");
  if (!exists.rows[0].name) {
    await client.query(await readFile(new URL("../migrations/0002_shop_sync_progress.sql", import.meta.url), "utf8"));
  }
  const columns = await client.query(`SELECT column_name,data_type,is_nullable FROM information_schema.columns
    WHERE table_schema='public' AND table_name='shop_sync_progress' ORDER BY column_name`);
  const expected = [
    { column_name: "account_key", data_type: "text", is_nullable: "NO" },
    { column_name: "completed_at", data_type: "timestamp with time zone", is_nullable: "NO" },
    { column_name: "object_type", data_type: "text", is_nullable: "NO" },
  ];
  if (JSON.stringify(columns.rows) !== JSON.stringify(expected)) throw new Error("Unexpected shop checkpoint schema; manual review required");
  const index = await client.query(`SELECT indexdef FROM pg_indexes WHERE schemaname='public'
    AND tablename='shop_sync_progress' AND indexname='shop_sync_progress_account_object_idx'`);
  if (!/^CREATE UNIQUE INDEX .* USING btree \(account_key, object_type\)$/.test(index.rows[0]?.indexdef || "")) {
    throw new Error("Unexpected shop checkpoint index; manual review required");
  }
  await client.query("COMMIT");
  console.log("Shop synchronization checkpoint schema is ready");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}
