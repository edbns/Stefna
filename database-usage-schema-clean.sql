-- Stefna Credits v2 — Simple & Referral-First
-- Clean version without references to non-existent tables
-- Replaces the old usage tracking with a clean credits system

-- Global config (single source of truth)
CREATE TABLE IF NOT EXISTS app_config (
  key   text PRIMARY KEY,
  value jsonb NOT NULL
);

-- Defaults (edit any number to tune)
INSERT INTO app_config(key,value) VALUES
 ('daily_cap',               '30'),
 ('starter_grant',           '30'),
 ('image_cost',              '2'),
 ('video_cost',              '5'),
 ('video_enabled',           'false'),
 ('referral_referrer_bonus', '50'),
 ('referral_new_bonus',      '25')
ON CONFLICT (key) DO NOTHING;

-- Current balance
CREATE TABLE IF NOT EXISTS user_credits (
  user_id    uuid PRIMARY KEY,
  balance    int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ledger (idempotent, auditable)
CREATE TABLE IF NOT EXISTS credits_ledger (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL,
  request_id  uuid NOT NULL,            -- idempotency key for a generation/job
  action      text NOT NULL,            -- 'image.gen'|'video.gen'|'grant'|'referral.*' etc.
  amount      int  NOT NULL,            -- negative=spend, positive=grant/refund
  status      text NOT NULL CHECK (status IN ('reserved','committed','refunded','granted')),
  meta        jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_ledger_user_request
  ON credits_ledger(user_id, request_id);

CREATE INDEX IF NOT EXISTS ix_ledger_user_created
  ON credits_ledger(user_id, created_at);

-- Referrals (one row per new user so rewards are idempotent)
CREATE TABLE IF NOT EXISTS referral_signups (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id uuid NOT NULL,
  new_user_id      uuid NOT NULL,
  referrer_email   text,
  new_user_email   text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (new_user_id)
);

-- Daily usage view (UTC), includes only committed spends
CREATE OR REPLACE VIEW v_user_daily_usage AS
SELECT
  user_id,
  (created_at AT TIME ZONE 'UTC')::date AS usage_date,
  -SUM(amount) AS credits_spent
FROM credits_ledger
WHERE amount < 0 AND status = 'committed'
GROUP BY user_id, (created_at AT TIME ZONE 'UTC')::date;

-- Helper: read int config with fallback
CREATE OR REPLACE FUNCTION app.cfg_int(p_key text, p_default int)
RETURNS int AS $$
DECLARE v jsonb; n int;
BEGIN
  SELECT value INTO v FROM app_config WHERE key = p_key;
  IF v IS NULL THEN RETURN p_default; END IF;
  -- numeric JSONB prints as unquoted text
  SELECT (v::text)::int INTO n;
  RETURN n;
END;
$$ LANGUAGE plpgsql;

-- Helper: read bool config with fallback
CREATE OR REPLACE FUNCTION app.cfg_bool(p_key text, p_default boolean)
RETURNS boolean AS $$
DECLARE v jsonb; b boolean;
BEGIN
  SELECT value INTO v FROM app_config WHERE key = p_key;
  IF v IS NULL THEN RETURN p_default; END IF;
  SELECT (v::text)::boolean INTO b;
  RETURN b;
END;
$$ LANGUAGE plpgsql;

-- Check daily cap with flat config (no tiers)
CREATE OR REPLACE FUNCTION app.allow_today_simple(p_user uuid, p_cost int)
RETURNS boolean AS $$
DECLARE spent_today int := 0;
DECLARE cap int := app.cfg_int('daily_cap', 30);
BEGIN
  SELECT coalesce(v.credits_spent,0)
    INTO spent_today
  FROM v_user_daily_usage v
  WHERE v.user_id = p_user
    AND v.usage_date = (now() AT TIME ZONE 'UTC')::date;

  RETURN (spent_today + p_cost) <= cap;
END;
$$ LANGUAGE plpgsql;

-- Atomic reserve with idempotency
CREATE OR REPLACE FUNCTION app.reserve_credits(
  p_user uuid, p_request uuid, p_action text, p_cost int
)
RETURNS TABLE (balance int) AS $$
DECLARE new_balance int;
BEGIN
  INSERT INTO credits_ledger(user_id, request_id, action, amount, status)
  VALUES (p_user, p_request, p_action, -p_cost, 'reserved');

  UPDATE user_credits uc
  SET balance = uc.balance - p_cost, updated_at = now()
  WHERE uc.user_id = p_user AND uc.balance >= p_cost
  RETURNING uc.balance INTO new_balance;

  IF new_balance IS NULL THEN
    DELETE FROM credits_ledger WHERE user_id = p_user AND request_id = p_request;
    RAISE EXCEPTION 'INSUFFICIENT_CREDITS';
  END IF;

  RETURN QUERY SELECT new_balance;
EXCEPTION WHEN unique_violation THEN
  RETURN QUERY SELECT uc.balance FROM user_credits uc WHERE uc.user_id = p_user;
END;
$$ LANGUAGE plpgsql;

-- Finalize (commit or refund)
CREATE OR REPLACE FUNCTION app.finalize_credits(
  p_user uuid, p_request uuid, p_status text
)
RETURNS void AS $$
DECLARE res credits_ledger;
BEGIN
  IF p_status = 'commit' THEN
    UPDATE credits_ledger
    SET status = 'committed'
    WHERE user_id = p_user AND request_id = p_request AND status = 'reserved';
  ELSIF p_status = 'refund' THEN
    SELECT * INTO res
    FROM credits_ledger
    WHERE user_id = p_user AND request_id = p_request
      AND status IN ('reserved','committed')
    ORDER BY created_at ASC
    LIMIT 1;

    IF NOT FOUND THEN RETURN; END IF;

    INSERT INTO credits_ledger(user_id, request_id, action, amount, status, meta)
    VALUES (res.user_id, res.request_id, res.action, -res.amount, 'refunded', jsonb_build_object('reason','op_failed'))
    ON CONFLICT DO NOTHING;

    UPDATE user_credits uc
    SET balance = uc.balance + (-res.amount), updated_at = now()
    WHERE uc.user_id = p_user;
  ELSE
    RAISE EXCEPTION 'INVALID_FINALIZE_STATUS %', p_status;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Centralized grant helper (starter/referral/etc.)
CREATE OR REPLACE FUNCTION app.grant_credits(
  p_user uuid, p_amount int, p_reason text, p_meta jsonb DEFAULT '{}'::jsonb
)
RETURNS void AS $$
BEGIN
  UPDATE user_credits uc SET balance = uc.balance + p_amount, updated_at = now()
  WHERE uc.user_id = p_user;
  IF NOT FOUND THEN
    INSERT INTO user_credits(user_id, balance) VALUES (p_user, p_amount);
  END IF;

  INSERT INTO credits_ledger(user_id, request_id, action, amount, status, meta)
  VALUES (p_user, gen_random_uuid(), p_reason, p_amount, 'granted', p_meta);
END;
$$ LANGUAGE plpgsql;

-- Add new columns to existing assets table for high-res tracking
ALTER TABLE public.assets 
ADD COLUMN IF NOT EXISTS proc_w int,
ADD COLUMN IF NOT EXISTS proc_h int,
ADD COLUMN IF NOT EXISTS fps int,
ADD COLUMN IF NOT EXISTS seconds numeric,
ADD COLUMN IF NOT EXISTS kind text,
ADD COLUMN IF NOT EXISTS request_key text;

-- Index for request deduplication
CREATE INDEX IF NOT EXISTS assets_user_request_key_idx 
ON public.assets(user_id, request_key) 
WHERE request_key IS NOT NULL;

-- Grant permissions to public (adjust as needed for your auth system)
GRANT SELECT, INSERT, UPDATE ON app_config TO public;
GRANT SELECT, INSERT, UPDATE ON user_credits TO public;
GRANT SELECT, INSERT, UPDATE ON credits_ledger TO public;
GRANT SELECT ON v_user_daily_usage TO public;

-- Verify tables were created
SELECT 
  'Credits system tables created successfully' as status,
  (SELECT COUNT(*) FROM app_config) as config_count,
  (SELECT COUNT(*) FROM user_credits) as user_credits_count,
  (SELECT COUNT(*) FROM credits_ledger) as ledger_count;
