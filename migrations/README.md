# Order reconciliation index

`0001_shop_reconciliation.sql` is an additive, reviewed SQL change matching
`db/schema.ts`, not a baseline for recreating the database. This project does
not have a Drizzle migration journal. Do not generate or run a whole-schema
baseline against an existing database.

## Choice and behavior

The checker now selects the earliest `next_attempt_at`, then `created_at`,
still limited to ten orders. This prioritizes overdue checks rather than
strict order-creation fairness; the existing one-minute deferral, retry cap,
eligible statuses, locks, payment checks, and fulfillment behavior are unchanged.

The partial B-tree excludes quotes, terminal orders, missing payment sessions,
and exhausted retries. Future scheduled checks remain indexed, but the query's
`next_attempt_at <= now()` range skips them. `now()` is deliberately absent
from the index predicate. Only one new index is needed.

The installed Drizzle version cannot express `INCLUDE (id)`. Using `id` as the
third key instead makes the index covering while keeping SQL and schema
equivalent, without an ORM upgrade or an unsupported schema expression.
The first two keys provide the requested ordering.

## Application and safety

Before applying, inspect the target database:

```sql
SELECT indexname, indexdef FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'shop_orders';
```

Check for an equivalent index under **any** name and for an invalid/incomplete
index. Reuse an existing equivalent index by aligning its name with the schema
rather than creating a duplicate. Do not use `IF NOT EXISTS` to silently accept
a same-named index with a different definition.

Apply this SQL to the **development** database through the reviewed dev-schema
process. It takes the normal PostgreSQL index-build write lock; schedule the
development change accordingly. No startup DDL, deployment hook, or broad
`db:push` is required. For Replit-managed production, schema application belongs
to the platform's schema-diff flow, not this file or an application script.
This change does not itself alter production. Production index inspection was
unavailable during implementation because read-only access required
authentication; do not assume its indexes match development.

The development catalog initially contained only the primary key and unique
Stripe-session/Printful-order indexes. No equivalent pending-work index existed.

## Verification

`npm run test:shop` includes isolated temporary-table checks of the actual
reconciliation SELECT, the schema/migration agreement, eligibility boundaries,
ordering, and the ten-row cap. It compares `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)`
before and after the index on generated retained-history, future-work, sparse
due-work, and dense due-work distributions. Temporary data is never inserted
into real orders and no payment provider is contacted by those checks.

These are synthetic plans, not a claim about production latency. For a future
live comparison, capture that same EXPLAIN for the SELECT in
`reconcileOrders()` before and after the platform applies the schema change.
Record rows, buffers, sort operations, and timing under representative workload
distributions. A sequential scan on a tiny real table is not itself a failure.
