import { after, test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { getTableConfig, PgDialect } from "drizzle-orm/pg-core";
import { shopOrders } from "../db/schema";
import { reconcileOrders } from "../server/shop-fulfillment";
import { shopPool } from "../server/shop-store";

after(async () => { await shopPool.end(); });

const indexName = "shop_orders_reconciliation_due_idx";
const migration = await readFile(new URL("../migrations/0001_shop_reconciliation.sql", import.meta.url), "utf8");
const ddl = migration.replace(/--[^\n]*/g, "").trim();
const normalize = (value: string) => value.replaceAll('"shop_orders".', "").replaceAll('"', "").replace(/\s+/g, "").toLowerCase();

test("schema and additive migration define the same static covering partial index", () => {
  const indexes = getTableConfig(shopOrders).indexes;
  assert.equal(indexes.length, 1, "do not add competing pending-work indexes");
  const { config } = indexes[0];
  assert.equal(config.name, indexName);
  assert.equal(config.unique, false);
  const columns = config.columns.map(column => "name" in column ? column.name : undefined);
  assert.deepEqual(columns, ["next_attempt_at", "created_at", "id"]);
  assert.ok(config.where);
  const predicate = new PgDialect().sqlToQuery(config.where);
  assert.deepEqual(predicate.params, [], "static predicates must not use runtime parameters");
  const normalizedDdl = normalize(ddl);
  assert.equal(normalizedDdl, normalize(`CREATE INDEX ${indexName} ON shop_orders USING btree
    (next_attempt_at, created_at, id) WHERE ${predicate.sql};`));
  assert.doesNotMatch(predicate.sql, /now\s*\(/i);
  assert.doesNotMatch(ddl, /\b(?:drop|delete|update|alter)\b/i);
});

test("actual checker query keeps eligibility, due-time priority, fairness tie-break and cap", async (t) => {
  // Capture the production SELECT without running fulfillment or contacting providers.
  let query = "";
  const stub = t.mock.method(shopPool, "query", async (text: string) => {
    query = text;
    return { rows: [] };
  });
  try { await reconcileOrders(); } finally { stub.mock.restore(); }
  assert.match(query, /ORDER BY next_attempt_at, created_at LIMIT 10/);
  assert.match(query, /next_attempt_at <= now\(\)/);

  const client = await shopPool.connect();
  try {
    await client.query("BEGIN");
    // Shadow the real table only on this connection. Rollback removes all fixtures.
    await client.query(`CREATE TEMP TABLE shop_orders (
      id text PRIMARY KEY, stripe_session_id text, status text NOT NULL,
      attempts integer NOT NULL, next_attempt_at timestamp NOT NULL,
      created_at timestamp NOT NULL
    ) ON COMMIT DROP`);
    const insert = async (id: string, status: string, attempts = 0, session: string | null = id, dueMinutes = -1, ageDays = 0) => {
      await client.query(`INSERT INTO shop_orders VALUES ($1,$2,$3,$4,
        now()+$5*interval '1 minute', now()-$6*interval '1 day')`,
      [id, session, status, attempts, dueMinutes, ageDays]);
    };
    const eligible = ["awaiting_payment", "paid", "processing", "needs_attention", "fulfilled"];
    for (const status of eligible) await insert(status, status, 7);
    for (const status of ["quote", "canceled", "shipped", "test_paid"]) await insert(status, status);
    await insert("missing-session", "paid", 0, null);
    await insert("exhausted", "paid", 8);
    await insert("future", "paid", 0, "future", 1);
    await insert("due-now", "paid", 0, "due-now", 0);
    assert.deepEqual((await client.query(query)).rows.map(row => row.id).sort(), [...eligible, "due-now"].sort());

    await client.query(ddl);
    assert.deepEqual((await client.query(query)).rows.map(row => row.id).sort(), [...eligible, "due-now"].sort());
    // Newer orders may be more overdue; creation time only breaks due-time ties.
    await insert("older-less-overdue", "paid", 0, "older", -10, 10);
    await insert("newer-more-overdue", "paid", 0, "newer", -20, 0);
    await insert("tie-older", "paid", 0, "tie-older", -20, 5);
    for (let i = 0; i < 15; i++) await insert(`extra-${i}`, "paid");
    const selected = (await client.query(query)).rows;
    assert.equal(selected.length, 10);
    assert.deepEqual(selected.slice(0, 3).map(row => row.id), ["tie-older", "newer-more-overdue", "older-less-overdue"]);

    // Synthetic retained history plus scheduled and overdue work. No real orders touched.
    await client.query("TRUNCATE pg_temp.shop_orders");
    await client.query(`INSERT INTO shop_orders
      SELECT 'history-'||n, CASE WHEN n%2=0 THEN NULL ELSE 'session-'||n END,
        CASE WHEN n%2=0 THEN 'quote' ELSE 'shipped' END, 0,
        now()-interval '1 day', now()-n*interval '1 minute'
      FROM generate_series(1,60000) n`);
    await client.query(`INSERT INTO shop_orders
      SELECT 'future-'||n, 'future-session-'||n, 'paid', 0,
        now()+n*interval '1 minute', now()-n*interval '1 minute'
      FROM generate_series(1,30000) n`);
    await client.query(`INSERT INTO shop_orders
      SELECT 'due-'||n, 'due-session-'||n, 'paid', 7,
        now()-n*interval '1 minute', now()-n*interval '1 day'
      FROM generate_series(1,100) n`);

    const explain = async () => (await client.query(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`)).rows[0]["QUERY PLAN"][0];
    const nodes = (plan: any): any[] => [plan, ...(plan.Plans || []).flatMap(nodes)];
    // Baseline on identical fixtures without the new index.
    await client.query(`DROP INDEX pg_temp.${indexName}`);
    await client.query("ANALYZE pg_temp.shop_orders");
    const before = await explain();
    await client.query(ddl);
    await client.query("ANALYZE pg_temp.shop_orders");
    const sparse = await explain();
    assert.ok(nodes(before.Plan).some(node => node["Node Type"] === "Sort"));
    const assertIndexed = (plan: any) => {
      assert.equal(plan.Plan["Actual Rows"], 10);
      assert.ok(nodes(plan.Plan).some(node => node["Index Name"] === indexName));
      assert.ok(!nodes(plan.Plan).some(node => node["Node Type"] === "Sort"));
      assert.ok(nodes(plan.Plan).some(node => /next_attempt_at/.test(node["Index Cond"] || "")));
    };
    assertIndexed(sparse);
    await client.query(`INSERT INTO shop_orders
      SELECT 'dense-'||n, 'dense-session-'||n, 'processing', 0,
        now()-n*interval '1 minute', now()-n*interval '1 day'
      FROM generate_series(1,12000) n`);
    await client.query("ANALYZE pg_temp.shop_orders");
    const dense = await explain();
    assertIndexed(dense);
    for (const [distribution, plan] of Object.entries({ before, sparse, dense })) {
      t.diagnostic(JSON.stringify({
        distribution, executionMs: plan["Execution Time"],
        localBlocks: (plan.Plan["Local Hit Blocks"] || 0) + (plan.Plan["Local Read Blocks"] || 0),
        nodes: nodes(plan.Plan).map(node => node["Node Type"]),
      }));
    }
  } finally {
    await client.query("ROLLBACK");
    client.release();
  }
});
