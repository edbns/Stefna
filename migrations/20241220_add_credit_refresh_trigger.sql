-- ============================================================================
-- CREDIT REFRESH EMAIL TRIGGER
-- ============================================================================
-- Creates automatic system to send credit refresh emails every 24 hours
-- Uses existing email_queue system for distributed sending
-- ============================================================================

-- Function to check and queue credit refresh emails
CREATE OR REPLACE FUNCTION queue_credit_refresh_emails()
RETURNS void AS $$
DECLARE
    user_record RECORD;
    daily_credits INTEGER := 14;
BEGIN
    -- Find users who need credit refresh (24+ hours since last update)
    FOR user_record IN
        SELECT 
            u.id as user_id,
            u.email,
            uc.updated_at,
            u.created_at
        FROM users u
        LEFT JOIN user_credits uc ON u.id = uc.user_id
        WHERE 
            u.email IS NOT NULL 
            AND u.email != ''
            AND u.email != 'user-placeholder@example.com'
            AND (
                uc.updated_at IS NULL 
                OR uc.updated_at < NOW() - INTERVAL '24 hours'
            )
        ORDER BY u.created_at ASC
    LOOP
        -- Reset user credits
        INSERT INTO user_credits (user_id, credits, balance, updated_at)
        VALUES (
            user_record.user_id, 
            daily_credits, 
            COALESCE((SELECT balance FROM user_credits WHERE user_id = user_record.user_id), 0),
            NOW()
        )
        ON CONFLICT (user_id) 
        DO UPDATE SET 
            credits = daily_credits,
            updated_at = NOW();

        -- Queue email for sending
        INSERT INTO email_queue (
            email,
            subject,
            email_type,
            data,
            status,
            created_at
        ) VALUES (
            user_record.email,
            'Credits refreshed — let''s create.',
            'daily_credits_refresh',
            jsonb_build_object(
                'userId', user_record.user_id,
                'resetTime', NOW()::text,
                'newBalance', daily_credits
            ),
            'pending',
            NOW()
        );

        -- Log the action
        RAISE NOTICE 'Queued credit refresh email for user % (%)', user_record.user_id, user_record.email;
    END LOOP;

    -- Update global last reset time
    INSERT INTO app_config (key, value, updated_at)
    VALUES ('last_credit_reset', NOW()::text, NOW())
    ON CONFLICT (key) 
    DO UPDATE SET value = NOW()::text, updated_at = NOW();

    RAISE NOTICE 'Credit refresh email queue process completed';
END;
$$ LANGUAGE plpgsql;

-- Create a function that can be called by external cron services
CREATE OR REPLACE FUNCTION trigger_credit_refresh_check()
RETURNS json AS $$
DECLARE
    result json;
    user_count INTEGER;
BEGIN
    -- Count users who need refresh
    SELECT COUNT(*) INTO user_count
    FROM users u
    LEFT JOIN user_credits uc ON u.id = uc.user_id
    WHERE 
        u.email IS NOT NULL 
        AND u.email != ''
        AND u.email != 'user-placeholder@example.com'
        AND (
            uc.updated_at IS NULL 
            OR uc.updated_at < NOW() - INTERVAL '24 hours'
        );

    -- Queue emails for users needing refresh
    PERFORM queue_credit_refresh_emails();

    -- Return result
    SELECT json_build_object(
        'success', true,
        'message', 'Credit refresh check completed',
        'users_processed', user_count,
        'timestamp', NOW()::text
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION queue_credit_refresh_emails() TO PUBLIC;
GRANT EXECUTE ON FUNCTION trigger_credit_refresh_check() TO PUBLIC;

-- Add comment
COMMENT ON FUNCTION queue_credit_refresh_emails() IS 'Finds users needing credit refresh and queues emails in email_queue table';
COMMENT ON FUNCTION trigger_credit_refresh_check() IS 'External function to trigger credit refresh check - can be called by cron services';
