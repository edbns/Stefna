-- Complete Credits System Fix
-- Run this script to fix all missing pieces

-- 1. Create missing user_credits table
CREATE TABLE IF NOT EXISTS user_credits (
  user_id    uuid PRIMARY KEY,
  balance    int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Create missing app.finalize_credits function
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

    UPDATE user_credits
    SET balance = balance + (-res.amount), updated_at = now()
    WHERE user_id = p_user;
  ELSE
    RAISE EXCEPTION 'INVALID_FINALIZE_STATUS %', p_status;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 3. Grant permissions to authenticated users
GRANT USAGE ON SCHEMA app TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA app TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA app TO authenticated;

-- 4. Grant permissions to public schema tables
GRANT SELECT, INSERT, UPDATE ON credits_ledger TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_credits TO authenticated;
GRANT SELECT ON app_config TO authenticated;

-- 5. Create RLS policies for security
ALTER TABLE credits_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own credits
CREATE POLICY "Users can view own credits" ON user_credits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own credits" ON user_credits
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can only see their own ledger entries
CREATE POLICY "Users can view own ledger" ON credits_ledger
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ledger entries" ON credits_ledger
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ledger entries" ON credits_ledger
  FOR UPDATE USING (auth.uid() = user_id);

-- 6. Insert some test data for the current user (optional)
-- Replace 'YOUR_USER_ID_HERE' with the actual user ID from the logs
-- INSERT INTO user_credits (user_id, balance) VALUES ('YOUR_USER_ID_HERE', 100)
-- ON CONFLICT (user_id) DO UPDATE SET balance = 100;

-- 7. Verify everything is working
SELECT 'Tables' as check_type, table_name, 'exists' as status
FROM information_schema.tables 
WHERE table_name IN ('credits_ledger', 'user_credits', 'app_config')
  AND table_schema IN ('public', 'app')
UNION ALL
SELECT 'Functions' as check_type, proname as table_name, 'exists' as status
FROM pg_proc p 
JOIN pg_namespace n ON n.oid = p.pronamespace 
WHERE p.proname IN ('reserve_credits', 'finalize_credits', 'allow_today_simple', 'cfg_int')
  AND n.nspname = 'app'
UNION ALL
SELECT 'Views' as check_type, viewname as table_name, 'exists' as status
FROM pg_views 
WHERE viewname = 'v_user_daily_usage';

-- 8. Test the functions
SELECT 'Testing app.allow_today_simple' as test_name, 
       app.allow_today_simple('00000000-0000-0000-0000-000000000000'::uuid, 1) as result;
