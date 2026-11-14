-- Additive development-schema migration; no order data is changed.
-- Inspect pg_indexes for equivalent indexes before applying.
-- Do not add now() to this predicate: due-time filtering belongs in the query.
CREATE INDEX "shop_orders_reconciliation_due_idx"
  ON "shop_orders" USING btree ("next_attempt_at", "created_at", "id")
  WHERE "stripe_session_id" IS NOT NULL
    AND "status" IN ('awaiting_payment','paid','processing','needs_attention','fulfilled')
    AND "attempts" < 8;
