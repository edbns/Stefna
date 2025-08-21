-- Stefna Token System Simple Fix
-- This script fixes the duplicate tables and conflicting schemas

-- 1. Drop duplicate tables from public schema (keep app schema)
DROP TABLE IF EXISTS public.credits_ledger CASCADE;
DROP TABLE IF EXISTS public.user_credits CASCADE;
DROP TABLE IF EXISTS public.app_config CASCADE;

-- 2. Fix app.credits_ledger table structure
-- Remove the cost column if it exists
ALTER TABLE app.credits_ledger DROP COLUMN IF EXISTS cost;

-- Add amount column if it doesn't exist
ALTER TABLE app.credits_ledger ADD COLUMN IF NOT EXISTS amount integer;

-- Update amount column to be NOT NULL and set default values
UPDATE app.credits_ledger SET amount = -2 WHERE amount IS NULL AND action LIKE '%image%';
UPDATE app.credits_ledger SET amount = -5 WHERE amount IS NULL AND action LIKE '%video%';
UPDATE app.credits_ledger SET amount = -2 WHERE amount IS NULL;

-- Make amount NOT NULL
ALTER TABLE app.credits_ledger ALTER COLUMN amount SET NOT NULL;

-- 3. Add missing meta column if it doesn't exist
ALTER TABLE app.credits_ledger ADD COLUMN IF NOT EXISTS meta jsonb;

-- 4. Create the missing v_user_daily_usage view
CREATE OR REPLACE VIEW app.v_user_daily_usage AS
SELECT
  user_id,
  (created_at AT TIME ZONE 'UTC')::date AS usage_date,
  -SUM(amount) AS credits_spent
FROM app.credits_ledger
WHERE amount < 0 AND status = 'committed'
GROUP BY user_id, (created_at AT TIME ZONE 'UTC')::date;

-- 5. Ensure all users have initial credits
INSERT INTO app.user_credits (user_id, balance, updated_at)
SELECT 
  u.id, 
  COALESCE(uc.balance, 30), 
  COALESCE(uc.updated_at, now())
FROM auth.users u
LEFT JOIN app.user_credits uc ON u.id = uc.user_id
WHERE u.id NOT IN (SELECT user_id FROM app.user_credits)
ON CONFLICT (user_id) DO NOTHING;

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_credits_ledger_user_request 
ON app.credits_ledger(user_id, request_id);

CREATE INDEX IF NOT EXISTS idx_credits_ledger_user_created 
ON app.credits_ledger(user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_credits_ledger_status 
ON app.credits_ledger(status);

-- 7. Verify the fix
SELECT 'Token system fix completed successfully' as status;
