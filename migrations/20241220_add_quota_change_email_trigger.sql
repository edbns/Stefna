-- Migration: Add database trigger to automatically send emails when quota limit changes
-- When you change beta_quota_limit in app_config, emails automatically send to waitlist users

-- Function to automatically send emails when quota increases
CREATE OR REPLACE FUNCTION auto_notify_waitlist_on_quota_increase()
RETURNS TRIGGER AS $$
DECLARE
    old_limit INTEGER;
    new_limit INTEGER;
    current_users INTEGER;
    new_spots INTEGER;
    waitlist_users RECORD;
    email_count INTEGER := 0;
BEGIN
    -- Get old and new quota limits
    old_limit := OLD.value::INTEGER;
    new_limit := NEW.value::INTEGER;
    
    -- Only proceed if quota limit increased
    IF new_limit <= old_limit THEN
        RETURN NEW;
    END IF;
    
    -- Get current user count
    SELECT COUNT(*) INTO current_users FROM users;
    
    -- Calculate how many new spots opened
    new_spots := new_limit - current_users;
    
    -- Only proceed if there are new spots
    IF new_spots <= 0 THEN
        RETURN NEW;
    END IF;
    
    -- Send emails to waitlist users (by created_at order, limit to new_spots)
    FOR waitlist_users IN 
        SELECT email, created_at 
        FROM waitlist 
        ORDER BY created_at ASC 
        LIMIT new_spots
    LOOP
        -- Call the email sending function directly
        PERFORM send_email_to_waitlist_user(waitlist_users.email);
        email_count := email_count + 1;
    END LOOP;
    
    -- Log the action
    INSERT INTO app_config (key, value) 
    VALUES ('last_quota_notification', json_build_object(
        'old_limit', old_limit,
        'new_limit', new_limit,
        'emails_sent', email_count,
        'timestamp', NOW()
    )::text)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to send email to individual waitlist user
CREATE OR REPLACE FUNCTION send_email_to_waitlist_user(user_email TEXT)
RETURNS VOID AS $$
BEGIN
    -- Insert email job into a queue table for processing
    INSERT INTO email_queue (email, type, subject, status, created_at)
    VALUES (user_email, 'waitlist_launch', 'Stefna is officially live!', 'pending', NOW());
END;
$$ LANGUAGE plpgsql;

-- Create email queue table
CREATE TABLE IF NOT EXISTS email_queue (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    type TEXT NOT NULL,
    subject TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- Create trigger on app_config table
CREATE OR REPLACE TRIGGER quota_increase_email_trigger
    AFTER UPDATE ON app_config
    FOR EACH ROW
    WHEN (OLD.key = 'beta_quota_limit' AND NEW.key = 'beta_quota_limit')
    EXECUTE FUNCTION auto_notify_waitlist_on_quota_increase();
