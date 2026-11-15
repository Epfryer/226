ALTER TABLE shop_orders ADD COLUMN marketing_consent_recorded boolean NOT NULL DEFAULT false;

CREATE TABLE shop_subscribers (
  email text PRIMARY KEY,
  consent_text text NOT NULL,
  consented_at timestamptz NOT NULL DEFAULT now(),
  unsubscribed_at timestamptz,
  unsubscribe_token text NOT NULL UNIQUE
);

CREATE TABLE shop_receipts (
  order_id text PRIMARY KEY REFERENCES shop_orders(id) ON DELETE CASCADE,
  data jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);
