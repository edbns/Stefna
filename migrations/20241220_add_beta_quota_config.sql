-- Add beta quota configuration to app_config table
-- This controls when the beta quota system is active

-- Insert quota configuration (default: 45 users)
INSERT INTO app_config (key, value) VALUES 
    ('beta_quota_limit', '45'),
    ('beta_quota_enabled', 'true')
ON CONFLICT (key) DO NOTHING;

-- Create function to check if quota is reached
CREATE OR REPLACE FUNCTION is_quota_reached()
RETURNS BOOLEAN AS $$
DECLARE
    quota_limit INTEGER;
    current_count INTEGER;
    quota_enabled BOOLEAN;
BEGIN
    -- Get quota configuration
    SELECT value::integer INTO quota_limit FROM app_config WHERE key = 'beta_quota_limit';
    SELECT value::boolean INTO quota_enabled FROM app_config WHERE key = 'beta_quota_enabled';
    
    -- If quota system is disabled, always allow
    IF NOT quota_enabled THEN
        RETURN FALSE;
    END IF;
    
    -- Get current user count
    SELECT COUNT(*) INTO current_count FROM users;
    
    -- Return true if current count >= quota limit
    RETURN current_count >= quota_limit;
END;
$$ LANGUAGE plpgsql;

-- Create function to get quota status
CREATE OR REPLACE FUNCTION get_quota_status()
RETURNS TABLE(
    quota_enabled BOOLEAN,
    quota_limit INTEGER,
    current_count INTEGER,
    quota_reached BOOLEAN,
    remaining_slots INTEGER
) AS $$
DECLARE
    v_quota_limit INTEGER;
    v_current_count INTEGER;
    v_quota_enabled BOOLEAN;
BEGIN
    -- Get quota configuration
    SELECT value::integer INTO v_quota_limit FROM app_config WHERE key = 'beta_quota_limit';
    SELECT value::boolean INTO v_quota_enabled FROM app_config WHERE key = 'beta_quota_enabled';
    
    -- Get current user count
    SELECT COUNT(*) INTO v_current_count FROM users;
    
    RETURN QUERY SELECT 
        v_quota_enabled as quota_enabled,
        v_quota_limit as quota_limit,
        v_current_count as current_count,
        (v_current_count >= v_quota_limit) as quota_reached,
        GREATEST(0, v_quota_limit - v_current_count) as remaining_slots;
END;
$$ LANGUAGE plpgsql;

-- Create function to update quota settings
CREATE OR REPLACE FUNCTION update_quota_settings(
    p_quota_limit INTEGER DEFAULT NULL,
    p_quota_enabled BOOLEAN DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
BEGIN
    -- Update quota limit if provided
    IF p_quota_limit IS NOT NULL THEN
        INSERT INTO app_config (key, value) 
        VALUES ('beta_quota_limit', p_quota_limit::text)
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
    END IF;
    
    -- Update quota enabled if provided
    IF p_quota_enabled IS NOT NULL THEN
        INSERT INTO app_config (key, value) 
        VALUES ('beta_quota_enabled', p_quota_enabled::text)
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
    END IF;
    
    RETURN QUERY SELECT true as success, 'Quota settings updated successfully' as message;
END;
$$ LANGUAGE plpgsql;
