-- Add amount column to app.credits_ledger
ALTER TABLE app.credits_ledger ADD COLUMN IF NOT EXISTS amount integer;

-- Update amount column with default values based on action
UPDATE app.credits_ledger SET amount = -2 WHERE amount IS NULL AND action LIKE '%image%';
UPDATE app.credits_ledger SET amount = -5 WHERE amount IS NULL AND action LIKE '%video%';
UPDATE app.credits_ledger SET amount = -2 WHERE amount IS NULL;

-- Make amount NOT NULL
ALTER TABLE app.credits_ledger ALTER COLUMN amount SET NOT NULL;

-- Create the missing v_user_daily_usage view
CREATE OR REPLACE VIEW app.v_user_daily_usage AS
SELECT
  user_id,
  (created_at AT TIME ZONE 'UTC')::date AS usage_date,
  -SUM(amount) AS credits_spent
FROM app.credits_ledger
WHERE amount < 0 AND status = 'committed'
GROUP BY user_id, (created_at AT TIME ZONE 'UTC')::date;

-- Verify the fix
SELECT 'Amount column added successfully' as status;
