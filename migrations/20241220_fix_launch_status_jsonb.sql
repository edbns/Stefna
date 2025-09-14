-- Fix update_launch_status function to handle JSONB properly
-- The app_config.value column is JSONB, so we need to cast text values properly

CREATE OR REPLACE FUNCTION update_launch_status(p_is_launched BOOLEAN, p_launch_date TIMESTAMPTZ DEFAULT NULL)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
    v_waitlist_count INTEGER;
BEGIN
    -- Get current waitlist count
    SELECT COUNT(*) INTO v_waitlist_count FROM waitlist;
    
    -- Update launch status (cast to JSONB)
    INSERT INTO app_config (key, value) 
    VALUES ('is_launched', p_is_launched::text::jsonb)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
    
    -- Update launch date if provided (cast to JSONB)
    IF p_launch_date IS NOT NULL THEN
        INSERT INTO app_config (key, value) 
        VALUES ('launch_date', p_launch_date::text::jsonb)
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
    END IF;
    
    -- Update waitlist count (cast to JSONB)
    INSERT INTO app_config (key, value) 
    VALUES ('waitlist_count', v_waitlist_count::text::jsonb)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
    
    RETURN QUERY SELECT true as success, 'Launch status updated successfully' as message;
END;
$$ LANGUAGE plpgsql;
