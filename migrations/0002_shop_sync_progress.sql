-- Additive application job checkpoints, not Stripe mirror data.
-- Development schema only; managed production uses the platform schema diff.
CREATE TABLE shop_sync_progress (
  account_key text NOT NULL,
  object_type text NOT NULL,
  completed_at timestamp with time zone NOT NULL
);
CREATE UNIQUE INDEX shop_sync_progress_account_object_idx
  ON shop_sync_progress (account_key, object_type);
