-- Create Missing Credits System Tables
-- This script adds the missing tables needed for the credits system to work properly

-- 1. Create app_config table for global configuration
CREATE TABLE IF NOT EXISTS app_config (
  key   text PRIMARY KEY,
  value jsonb NOT NULL
);

-- Insert default configuration values
INSERT INTO app_config(key,value) VALUES
 ('daily_cap',               '30'),
 ('starter_grant',           '30'),
 ('image_cost',              '2'),
 ('video_cost',              '5'),
 ('video_enabled',           'false'),
 ('referral_referrer_bonus', '50'),
 ('referral_new_bonus',      '25')
ON CONFLICT (key) DO NOTHING;

-- 2. Create user_credits table for current balance tracking
CREATE TABLE IF NOT EXISTS user_credits (
  user_id    uuid PRIMARY KEY,
  balance    int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Create proper credits_ledger table if it doesn't exist with correct structure
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

-- Create indexes for performance
CREATE UNIQUE INDEX IF NOT EXISTS ux_ledger_user_request ON credits_ledger(user_id, request_id);
CREATE INDEX IF NOT EXISTS ix_ledger_user_created ON credits_ledger(user_id, created_at);

-- 4. Create daily usage view for daily cap enforcement
CREATE OR REPLACE VIEW v_user_daily_usage AS
SELECT
  user_id,
  (created_at AT TIME ZONE 'UTC')::date AS usage_date,
  -SUM(amount) AS credits_spent
FROM credits_ledger
WHERE amount < 0 AND status = 'committed'
GROUP BY user_id, (created_at AT TIME ZONE 'UTC')::date;

-- 5. Create helper functions for credit operations
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

-- 6. Create credit reservation function
CREATE OR REPLACE FUNCTION app.reserve_credits(
  p_user uuid, p_request uuid, p_action text, p_cost int
)
RETURNS TABLE (balance int) AS $$
DECLARE new_balance int;
BEGIN
  -- Insert reservation into ledger
  INSERT INTO credits_ledger(user_id, request_id, action, amount, status)
  VALUES (p_user, p_request, p_action, -p_cost, 'reserved');

  -- Update user balance
  UPDATE user_credits
  SET balance = balance - p_cost, updated_at = now()
  WHERE user_id = p_user AND balance >= p_cost
  RETURNING balance INTO new_balance;

  -- If insufficient credits, rollback and raise error
  IF new_balance IS NULL THEN
    DELETE FROM credits_ledger WHERE user_id = p_user AND request_id = p_request;
    RAISE EXCEPTION 'INSUFFICIENT_CREDITS';
  END IF;

  RETURN QUERY SELECT new_balance;
EXCEPTION WHEN unique_violation THEN
  -- If request_id already exists, return current balance
  RETURN QUERY SELECT balance FROM user_credits WHERE user_id = p_user;
END;
$$ LANGUAGE plpgsql;

-- 7. Create credit finalization function
CREATE OR REPLACE FUNCTION app.finalize_credits(
  p_user uuid, p_request uuid, p_status text
)
RETURNS void AS $$
BEGIN
  IF p_status = 'commit' THEN
    UPDATE credits_ledger
    SET status = 'committed'
    WHERE user_id = p_user AND request_id = p_request AND status = 'reserved';
  ELSIF p_status = 'refund' THEN
    -- Refund the credits back to user
    UPDATE user_credits
    SET balance = balance + ABS(amount), updated_at = now()
    FROM credits_ledger
    WHERE user_credits.user_id = p_user 
      AND credits_ledger.user_id = p_user 
      AND credits_ledger.request_id = p_request
      AND credits_ledger.status = 'reserved';
    
    UPDATE credits_ledger
    SET status = 'refunded'
    WHERE user_id = p_user AND request_id = p_request AND status = 'reserved';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 8. Grant permissions to public (adjust as needed for your auth system)
GRANT SELECT, INSERT, UPDATE ON app_config TO public;
GRANT SELECT, INSERT, UPDATE ON user_credits TO public;
GRANT SELECT, INSERT, UPDATE ON credits_ledger TO public;
GRANT SELECT ON v_user_daily_usage TO public;

-- Note: Row Level Security and policies are commented out since 'authenticated' role doesn't exist
-- If you have a different authentication system, you can uncomment and modify these lines:
-- ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE credits_ledger ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY "Users can read app config" ON app_config FOR SELECT TO public USING (true);
-- CREATE POLICY "Users can manage own credits" ON user_credits FOR ALL TO public USING (true);
-- CREATE POLICY "Users can manage own ledger" ON credits_ledger FOR ALL TO public USING (true);

-- Verify tables were created
SELECT 
  'Tables created successfully' as status,
  (SELECT COUNT(*) FROM app_config) as config_count,
  (SELECT COUNT(*) FROM user_credits) as user_credits_count,
  (SELECT COUNT(*) FROM credits_ledger) as ledger_count;
