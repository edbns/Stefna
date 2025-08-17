-- Stefna Database Cleanup Migration
-- Run this to clean up the unused tier system and simplify the database

-- 1. Remove tier column from users table (if it exists)
ALTER TABLE users DROP COLUMN IF EXISTS tier;

-- 2. Update daily_limit to 30 for all users (simplified approach)
UPDATE users SET daily_limit = 30 WHERE daily_limit != 30;

-- 3. Drop unused functions that reference tiers
DROP FUNCTION IF EXISTS public.get_limits(text);
DROP FUNCTION IF EXISTS public.get_quota(uuid);

-- 4. Create simplified functions (photos only for now)
CREATE OR REPLACE FUNCTION public.get_limits()
RETURNS TABLE(daily_limit int, weekly_limit int)
LANGUAGE sql AS $$
  SELECT 30 as daily_limit, 150 as weekly_limit;
$$;

CREATE OR REPLACE FUNCTION public.get_quota(p_user_id uuid)
RETURNS TABLE(daily_used int, daily_limit int, weekly_used int, weekly_limit int)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  WITH d AS (
    SELECT tokens FROM public.usage WHERE user_id = p_user_id AND day = current_date
  ),
  w AS (
    SELECT COALESCE(SUM(tokens),0) as tokens
    FROM public.usage 
    WHERE user_id = p_user_id 
      AND day >= current_date - INTERVAL '6 days'
  ),
  l AS (
    SELECT * FROM public.get_limits()
  )
  SELECT 
    COALESCE((SELECT tokens FROM d), 0) as daily_used,
    l.daily_limit,
    (SELECT tokens FROM w) as weekly_used,
    l.weekly_limit
  FROM l;
END $$;

-- 5. Drop unused tables (if they exist)
DROP TABLE IF EXISTS promotions;
DROP TABLE IF EXISTS user_referrals;

-- 6. Clean up video-related columns (disabled until AIML supports video)
-- Note: We're commenting these out instead of dropping them to preserve future video support
-- ALTER TABLE public.usage DROP COLUMN IF EXISTS vid_count;

-- 7. Verify the cleanup
SELECT 
  'Database cleanup completed' as status,
  COUNT(*) as total_users,
  AVG(daily_limit) as avg_daily_limit
FROM users;

-- 8. Show current user structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 9. Show current usage table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'usage' 
ORDER BY ordinal_position;
