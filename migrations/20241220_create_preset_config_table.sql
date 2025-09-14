-- Create preset_config table for admin preset management
-- This table stores preset configurations that can be managed through the admin dashboard

CREATE TABLE IF NOT EXISTS preset_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    preset_key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    strength DECIMAL(3,2) DEFAULT 1.0,
    category TEXT DEFAULT 'custom',
    is_enabled BOOLEAN DEFAULT TRUE,
    is_custom BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_preset_config_preset_key ON preset_config(preset_key);
CREATE INDEX IF NOT EXISTS idx_preset_config_category ON preset_config(category);
CREATE INDEX IF NOT EXISTS idx_preset_config_is_enabled ON preset_config(is_enabled);
CREATE INDEX IF NOT EXISTS idx_preset_config_is_custom ON preset_config(is_custom);

-- Add comments for documentation
COMMENT ON TABLE preset_config IS 'Stores preset configurations for AI generation modes';
COMMENT ON COLUMN preset_config.preset_key IS 'Unique identifier for the preset';
COMMENT ON COLUMN preset_config.name IS 'Display name for the preset';
COMMENT ON COLUMN preset_config.description IS 'Description of what the preset does';
COMMENT ON COLUMN preset_config.strength IS 'Strength/intensity of the preset effect (0.0 to 2.0)';
COMMENT ON COLUMN preset_config.category IS 'Category grouping for presets (e.g., anime, realism, glitch)';
COMMENT ON COLUMN preset_config.is_enabled IS 'Whether the preset is currently enabled';
COMMENT ON COLUMN preset_config.is_custom IS 'Whether this is a custom preset (vs built-in)';
COMMENT ON COLUMN preset_config.metadata IS 'Additional configuration data as JSON';
