-- Add launch configuration to app_config table
-- This allows admin to control when the site launches

-- Insert launch configuration (default: not launched)
INSERT INTO app_config (key, value) VALUES 
    ('is_launched', 'false'),
    ('launch_date', 'null'),
    ('waitlist_count', '0')
ON CONFLICT (key) DO NOTHING;

-- Create function to get launch status
CREATE OR REPLACE FUNCTION get_launch_status()
RETURNS TABLE(is_launched BOOLEAN, launch_date TIMESTAMPTZ, waitlist_count INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (ac1.value::text = 'true') as is_launched,
        CASE 
            WHEN ac2.value::text = 'null' THEN NULL 
            ELSE ac2.value::text::timestamptz 
        END as launch_date,
        COALESCE(ac3.value::text::integer, 0) as waitlist_count
    FROM app_config ac1
    LEFT JOIN app_config ac2 ON ac2.key = 'launch_date'
    LEFT JOIN app_config ac3 ON ac3.key = 'waitlist_count'
    WHERE ac1.key = 'is_launched';
END;
$$ LANGUAGE plpgsql;

-- Create function to update launch status
CREATE OR REPLACE FUNCTION update_launch_status(p_is_launched BOOLEAN, p_launch_date TIMESTAMPTZ DEFAULT NULL)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
    v_waitlist_count INTEGER;
BEGIN
    -- Get current waitlist count
    SELECT COUNT(*) INTO v_waitlist_count FROM waitlist;
    
    -- Update launch status
    INSERT INTO app_config (key, value) 
    VALUES ('is_launched', p_is_launched::text)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
    
    -- Update launch date if provided
    IF p_launch_date IS NOT NULL THEN
        INSERT INTO app_config (key, value) 
        VALUES ('launch_date', p_launch_date::text)
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
    END IF;
    
    -- Update waitlist count
    INSERT INTO app_config (key, value) 
    VALUES ('waitlist_count', v_waitlist_count::text)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
    
    RETURN QUERY SELECT true as success, 'Launch status updated successfully' as message;
END;
$$ LANGUAGE plpgsql;
