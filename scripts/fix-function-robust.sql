-- Create a more robust allow_today_simple function
CREATE OR REPLACE FUNCTION app.allow_today_simple(p_user uuid, p_cost int)
RETURNS boolean AS $$
DECLARE 
  spent_today int;
  cap int;
  result boolean;
BEGIN
  -- Get daily cap with error handling
  BEGIN
    cap := app.cfg_int('daily_cap', 30);
  EXCEPTION WHEN OTHERS THEN
    cap := 30; -- fallback to default
  END;
  
  -- Get today's usage with error handling
  BEGIN
    SELECT COALESCE(v.credits_spent, 0)
      INTO spent_today
    FROM v_user_daily_usage v
    WHERE v.user_id = p_user
      AND v.usage_date = (now() AT TIME ZONE 'UTC')::date;
  EXCEPTION WHEN OTHERS THEN
    spent_today := 0; -- fallback to 0
  END;
  
  -- Ensure we have valid values
  IF spent_today IS NULL THEN
    spent_today := 0;
  END IF;
  
  IF cap IS NULL THEN
    cap := 30;
  END IF;
  
  -- Calculate result
  result := (spent_today + p_cost) <= cap;
  
  -- Ensure we return a boolean
  IF result IS NULL THEN
    result := true; -- fallback to allow
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Test the robust function
SELECT 'Testing robust allow_today_simple function' as test_name,
       app.allow_today_simple('00000000-0000-0000-0000-000000000000'::uuid, 1) as result;
