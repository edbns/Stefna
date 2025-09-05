-- ============================================================================
-- DAILY CREDIT RESET AUTOMATION
-- ============================================================================
-- This migration sets up automatic daily credit reset using PostgreSQL
-- No dependency on Netlify scheduled functions
-- ============================================================================

-- Enable pg_cron extension if available (requires superuser privileges)
-- If pg_cron is not available, we'll use a different approach
DO $$
BEGIN
    -- Try to create the extension
    BEGIN
        CREATE EXTENSION IF NOT EXISTS pg_cron;
        RAISE NOTICE 'pg_cron extension enabled successfully';
    EXCEPTION
        WHEN insufficient_privilege THEN
            RAISE NOTICE 'pg_cron extension not available - using alternative approach';
        WHEN OTHERS THEN
            RAISE NOTICE 'pg_cron extension not available - using alternative approach';
    END;
END $$;

-- Create a function to reset daily credits
CREATE OR REPLACE FUNCTION reset_daily_credits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    daily_cap INTEGER;
    reset_count INTEGER;
BEGIN
    -- Get the daily cap from app_config
    SELECT COALESCE(CAST(value AS INTEGER), 30) INTO daily_cap
    FROM app_config 
    WHERE key = 'daily_cap';
    
    -- Reset all user credits to the daily cap
    UPDATE user_credits 
    SET credits = daily_cap, updated_at = NOW()
    WHERE user_id IS NOT NULL;
    
    GET DIAGNOSTICS reset_count = ROW_COUNT;
    
    -- Log the reset
    RAISE NOTICE 'Daily credit reset completed: % users reset to % credits', reset_count, daily_cap;
    
    -- Insert a log entry
    INSERT INTO app_config (key, value, updated_at)
    VALUES ('last_credit_reset', NOW()::text, NOW())
    ON CONFLICT (key) DO UPDATE SET 
        value = NOW()::text,
        updated_at = NOW();
END;
$$;

-- Schedule the daily reset using pg_cron (if available)
DO $$
BEGIN
    -- Try to schedule the job
    BEGIN
        -- Remove existing job if it exists
        PERFORM cron.unschedule('daily-credit-reset');
        
        -- Schedule daily reset at midnight UTC
        PERFORM cron.schedule(
            'daily-credit-reset',
            '0 0 * * *',  -- Daily at midnight UTC
            'SELECT reset_daily_credits();'
        );
        
        RAISE NOTICE 'Daily credit reset scheduled successfully with pg_cron';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'pg_cron scheduling failed - using alternative approach';
    END;
END $$;

-- Alternative approach: Create a trigger-based system
-- This will reset credits when users log in if it's a new day
CREATE OR REPLACE FUNCTION check_and_reset_daily_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    last_reset_date DATE;
    current_date DATE;
    daily_cap INTEGER;
BEGIN
    -- Get current date in UTC
    current_date := CURRENT_DATE;
    
    -- Get last reset date
    SELECT COALESCE(CAST(value AS DATE), current_date - INTERVAL '1 day') INTO last_reset_date
    FROM app_config 
    WHERE key = 'last_credit_reset';
    
    -- If it's a new day, reset credits
    IF current_date > last_reset_date THEN
        -- Get daily cap
        SELECT COALESCE(CAST(value AS INTEGER), 30) INTO daily_cap
        FROM app_config 
        WHERE key = 'daily_cap';
        
        -- Reset all user credits
        UPDATE user_credits 
        SET credits = daily_cap, updated_at = NOW()
        WHERE user_id IS NOT NULL;
        
        -- Update last reset date
        INSERT INTO app_config (key, value, updated_at)
        VALUES ('last_credit_reset', current_date::text, NOW())
        ON CONFLICT (key) DO UPDATE SET 
            value = current_date::text,
            updated_at = NOW();
        
        RAISE NOTICE 'Daily credit reset triggered by user activity';
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger on user_credits table to check for daily reset
-- This ensures credits are reset when any user activity happens
CREATE OR REPLACE FUNCTION trigger_daily_credit_check()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only check once per day to avoid performance issues
    PERFORM check_and_reset_daily_credits();
    RETURN NEW;
END;
$$;

-- Create trigger on user_credits table
DROP TRIGGER IF EXISTS daily_credit_reset_trigger ON user_credits;
CREATE TRIGGER daily_credit_reset_trigger
    AFTER UPDATE ON user_credits
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_daily_credit_check();

-- Also create a trigger on users table for login activity
DROP TRIGGER IF EXISTS user_login_credit_reset_trigger ON users;
CREATE TRIGGER user_login_credit_reset_trigger
    AFTER UPDATE OF last_login ON users
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_daily_credit_check();

-- Create a manual reset function for admin use
CREATE OR REPLACE FUNCTION manual_reset_credits(target_user_id UUID DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    daily_cap INTEGER;
    reset_count INTEGER;
    result JSON;
BEGIN
    -- Get daily cap
    SELECT COALESCE(CAST(value AS INTEGER), 30) INTO daily_cap
    FROM app_config 
    WHERE key = 'daily_cap';
    
    IF target_user_id IS NOT NULL THEN
        -- Reset specific user
        UPDATE user_credits 
        SET credits = daily_cap, updated_at = NOW()
        WHERE user_id = target_user_id;
        
        GET DIAGNOSTICS reset_count = ROW_COUNT;
        
        result := json_build_object(
            'success', true,
            'message', 'User credits reset successfully',
            'user_id', target_user_id,
            'credits', daily_cap,
            'timestamp', NOW()
        );
    ELSE
        -- Reset all users
        UPDATE user_credits 
        SET credits = daily_cap, updated_at = NOW()
        WHERE user_id IS NOT NULL;
        
        GET DIAGNOSTICS reset_count = ROW_COUNT;
        
        result := json_build_object(
            'success', true,
            'message', 'All user credits reset successfully',
            'reset_count', reset_count,
            'credits', daily_cap,
            'timestamp', NOW()
        );
    END IF;
    
    RETURN result;
END;
$$;

-- Add initial app_config entries if they don't exist
INSERT INTO app_config (key, value, updated_at) VALUES 
    ('daily_cap', '30', NOW()),
    ('last_credit_reset', CURRENT_DATE::text, NOW())
ON CONFLICT (key) DO NOTHING;

-- Test the reset function
SELECT reset_daily_credits();

COMMENT ON FUNCTION reset_daily_credits() IS 'Resets all user credits to daily cap';
COMMENT ON FUNCTION check_and_reset_daily_credits() IS 'Checks if daily reset is needed and performs it';
COMMENT ON FUNCTION manual_reset_credits(UUID) IS 'Manually reset credits for specific user or all users';
