-- Fix the allow_today_simple function to properly handle new users
CREATE OR REPLACE FUNCTION app.allow_today_simple(p_user uuid, p_cost int)
RETURNS boolean AS $$
DECLARE 
  spent_today int := 0;
  cap int := app.cfg_int('daily_cap', 30);
BEGIN
  -- Get today's usage, defaulting to 0 if no usage exists
  SELECT COALESCE(v.credits_spent, 0)
    INTO spent_today
  FROM v_user_daily_usage v
  WHERE v.user_id = p_user
    AND v.usage_date = (now() AT TIME ZONE 'UTC')::date;

  -- If no daily usage found, spent_today will be 0
  -- Return true if the cost fits within the daily cap
  RETURN (spent_today + p_cost) <= cap;
END;
$$ LANGUAGE plpgsql;

-- Test the function
SELECT 'Testing fixed allow_today_simple function' as test_name,
       app.allow_today_simple('00000000-0000-0000-0000-000000000000'::uuid, 1) as result;
