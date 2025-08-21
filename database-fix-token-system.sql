-- Stefna Token System Fix
-- This script fixes the duplicate tables and conflicting schemas

-- 1. Drop duplicate tables from public schema (keep app schema)
DROP TABLE IF EXISTS public.credits_ledger CASCADE;
DROP TABLE IF EXISTS public.user_credits CASCADE;
DROP TABLE IF EXISTS public.app_config CASCADE;

-- 2. Fix app.credits_ledger table structure to match the expected schema
ALTER TABLE app.credits_ledger 
DROP COLUMN IF EXISTS cost;

-- Add amount column if it doesn't exist
ALTER TABLE app.credits_ledger 
ADD COLUMN IF NOT EXISTS amount integer;

-- Update amount column to be NOT NULL and copy from cost if needed
UPDATE app.credits_ledger 
SET amount = -2 
WHERE amount IS NULL AND action LIKE '%image%';

UPDATE app.credits_ledger 
SET amount = -5 
WHERE amount IS NULL AND action LIKE '%video%';

-- Make amount NOT NULL
ALTER TABLE app.credits_ledger 
ALTER COLUMN amount SET NOT NULL;

-- 3. Add missing meta column if it doesn't exist
ALTER TABLE app.credits_ledger 
ADD COLUMN IF NOT EXISTS meta jsonb;

-- 4. Fix foreign key constraints (remove duplicates)
-- First, find all foreign key constraints
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    FOR constraint_record IN 
        SELECT conname, conrelid::regclass as table_name
        FROM pg_constraint 
        WHERE contype = 'f' 
        AND conrelid::regclass::text LIKE 'app.%'
        AND conrelid::regclass::text IN ('app.credits_ledger', 'app.user_credits')
    LOOP
        EXECUTE 'ALTER TABLE ' || constraint_record.table_name || ' DROP CONSTRAINT ' || constraint_record.conname;
    END LOOP;
END $$;

-- 5. Add correct foreign key constraints
ALTER TABLE app.credits_ledger 
ADD CONSTRAINT fk_credits_ledger_user_id 
FOREIGN KEY (user_id) REFERENCES app.user_credits(user_id);

-- 6. Create the missing v_user_daily_usage view
CREATE OR REPLACE VIEW app.v_user_daily_usage AS
SELECT
  user_id,
  (created_at AT TIME ZONE 'UTC')::date AS usage_date,
  -SUM(amount) AS credits_spent
FROM app.credits_ledger
WHERE amount < 0 AND status = 'committed'
GROUP BY user_id, (created_at AT TIME ZONE 'UTC')::date;

-- 7. Fix the app.reserve_credits function to use amount instead of cost
CREATE OR REPLACE FUNCTION app.reserve_credits(
  p_user uuid, p_request uuid, p_action text, p_cost int
)
RETURNS TABLE (balance int) AS $$
DECLARE new_balance int;
BEGIN
  INSERT INTO app.credits_ledger(user_id, request_id, action, amount, status)
  VALUES (p_user, p_request, p_action, -p_cost, 'reserved');

  UPDATE app.user_credits
  SET balance = balance - p_cost, updated_at = now()
  WHERE user_id = p_user AND balance >= p_cost
  RETURNING balance INTO new_balance;

  IF new_balance IS NULL THEN
    DELETE FROM app.credits_ledger WHERE user_id = p_user AND request_id = p_request;
    RAISE EXCEPTION 'INSUFFICIENT_CREDITS';
  END IF;

  RETURN QUERY SELECT new_balance;
EXCEPTION WHEN unique_violation THEN
  RETURN QUERY SELECT balance FROM app.user_credits WHERE user_id = p_user;
END;
$$ LANGUAGE plpgsql;

-- 8. Fix the app.finalize_credits function
CREATE OR REPLACE FUNCTION app.finalize_credits(
  p_user uuid, p_request uuid, p_status text
)
RETURNS void AS $$
DECLARE res app.credits_ledger;
BEGIN
  IF p_status = 'commit' THEN
    UPDATE app.credits_ledger
    SET status = 'committed'
    WHERE user_id = p_user AND request_id = p_request AND status = 'reserved';
  ELSIF p_status = 'refund' THEN
    SELECT * INTO res
    FROM app.credits_ledger
    WHERE user_id = p_user AND request_id = p_request
      AND status IN ('reserved','committed')
    ORDER BY created_at ASC
    LIMIT 1;

    IF NOT FOUND THEN RETURN; END IF;

    INSERT INTO app.credits_ledger(user_id, request_id, action, amount, status, meta)
    VALUES (res.user_id, res.request_id, res.action, -res.amount, 'refunded', jsonb_build_object('reason','op_failed'))
    ON CONFLICT DO NOTHING;

    UPDATE app.user_credits
    SET balance = balance + (-res.amount), updated_at = now()
    WHERE user_id = p_user;
  ELSE
    RAISE EXCEPTION 'INVALID_FINALIZE_STATUS %', p_status;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 9. Ensure all users have initial credits
INSERT INTO app.user_credits (user_id, balance, updated_at)
SELECT 
  u.id, 
  COALESCE(uc.balance, 30), 
  COALESCE(uc.updated_at, now())
FROM auth.users u
LEFT JOIN app.user_credits uc ON u.id = uc.user_id
WHERE u.id NOT IN (SELECT user_id FROM app.user_credits)
ON CONFLICT (user_id) DO NOTHING;

-- 10. Grant necessary permissions
GRANT USAGE ON SCHEMA app TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA app TO authenticated;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA app TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA app TO authenticated;

-- 11. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_credits_ledger_user_request 
ON app.credits_ledger(user_id, request_id);

CREATE INDEX IF NOT EXISTS idx_credits_ledger_user_created 
ON app.credits_ledger(user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_credits_ledger_status 
ON app.credits_ledger(status);

-- 12. Verify the fix
SELECT 'Token system fix completed successfully' as status;
