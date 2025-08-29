-- 🗄️ Complete Database Schema for Stefna
-- Run this script in your Neon PostgreSQL database to create all required tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create users table (core user management)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email TEXT UNIQUE,
    name TEXT,
    tier TEXT DEFAULT 'registered',
    created_at TIMESTAMPTZ(6) DEFAULT NOW(),
    updated_at TIMESTAMPTZ(6) DEFAULT NOW(),
    avatar_url TEXT
);

-- Create index on email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Create auth_otps table (OTP authentication)
CREATE TABLE IF NOT EXISTS auth_otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    created_at TIMESTAMPTZ(6) DEFAULT NOW(),
    expires_at TIMESTAMPTZ(6) NOT NULL,
    used BOOLEAN DEFAULT FALSE
);

-- Create indexes for auth_otps
CREATE INDEX IF NOT EXISTS idx_auth_otps_expires_at ON auth_otps(expires_at);
CREATE INDEX IF NOT EXISTS idx_auth_otps_code ON auth_otps(code);
CREATE INDEX IF NOT EXISTS idx_auth_otps_email ON auth_otps(email);

-- 3. Create user_credits table (credit management)
CREATE TABLE IF NOT EXISTS user_credits (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    balance INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ(6) DEFAULT NOW(),
    credits INTEGER DEFAULT 30
);

-- Create index for user_credits
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);

-- 4. Create user_settings table (user preferences)
CREATE TABLE IF NOT EXISTS user_settings (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    share_to_feed BOOLEAN DEFAULT TRUE,
    allow_remix BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ(6) DEFAULT NOW()
);

-- 5. Create credits_ledger table (credit transactions)
CREATE TABLE IF NOT EXISTS credits_ledger (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_id TEXT UNIQUE,
    action TEXT NOT NULL,
    amount INTEGER NOT NULL,
    status TEXT NOT NULL,
    meta JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ(6) DEFAULT NOW(),
    reason TEXT,
    env TEXT DEFAULT 'production'
);

-- Create indexes for credits_ledger
CREATE INDEX IF NOT EXISTS idx_credits_ledger_user_id_created_at ON credits_ledger(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credits_ledger_user_id_status_created_at ON credits_ledger(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credits_ledger_request_id ON credits_ledger(request_id);

-- 6. Create custom_prompt_media table
CREATE TABLE IF NOT EXISTS custom_prompt_media (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    source_url TEXT NOT NULL,
    prompt TEXT NOT NULL,
    preset TEXT NOT NULL,
    run_id TEXT UNIQUE NOT NULL,
    aiml_job_id TEXT,
    created_at TIMESTAMPTZ(6) DEFAULT NOW(),
    status TEXT DEFAULT 'completed',
    metadata JSONB DEFAULT '{}'
);

-- Create indexes for custom_prompt_media
CREATE INDEX IF NOT EXISTS idx_custom_prompt_media_status ON custom_prompt_media(status);
CREATE INDEX IF NOT EXISTS idx_custom_prompt_media_user_id_created_at ON custom_prompt_media(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_custom_prompt_media_aiml_job_id ON custom_prompt_media(aiml_job_id);
CREATE INDEX IF NOT EXISTS idx_custom_prompt_media_preset ON custom_prompt_media(preset);

-- 7. Create emotion_mask_media table
CREATE TABLE IF NOT EXISTS emotion_mask_media (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    source_url TEXT NOT NULL,
    prompt TEXT NOT NULL,
    preset TEXT NOT NULL,
    run_id TEXT UNIQUE NOT NULL,
    aiml_job_id TEXT,
    created_at TIMESTAMPTZ(6) DEFAULT NOW(),
    status TEXT DEFAULT 'completed',
    metadata JSONB DEFAULT '{}'
);

-- Create indexes for emotion_mask_media
CREATE INDEX IF NOT EXISTS idx_emotion_mask_media_status ON emotion_mask_media(status);
CREATE INDEX IF NOT EXISTS idx_emotion_mask_media_user_id_created_at ON emotion_mask_media(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emotion_mask_media_aiml_job_id ON emotion_mask_media(aiml_job_id);
CREATE INDEX IF NOT EXISTS idx_emotion_mask_media_preset ON emotion_mask_media(preset);

-- 8. Create ghibli_reaction_media table
CREATE TABLE IF NOT EXISTS ghibli_reaction_media (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    source_url TEXT NOT NULL,
    prompt TEXT NOT NULL,
    preset TEXT NOT NULL,
    run_id TEXT UNIQUE NOT NULL,
    aiml_job_id TEXT,
    created_at TIMESTAMPTZ(6) DEFAULT NOW(),
    status TEXT DEFAULT 'completed',
    metadata JSONB DEFAULT '{}'
);

-- Create indexes for ghibli_reaction_media
CREATE INDEX IF NOT EXISTS idx_ghibli_reaction_media_status ON ghibli_reaction_media(status);
CREATE INDEX IF NOT EXISTS idx_ghibli_reaction_media_user_id_created_at ON ghibli_reaction_media(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ghibli_reaction_media_aiml_job_id ON ghibli_reaction_media(aiml_job_id);
CREATE INDEX IF NOT EXISTS idx_ghibli_reaction_media_preset ON ghibli_reaction_media(preset);

-- 9. Create neo_glitch_media table
CREATE TABLE IF NOT EXISTS neo_glitch_media (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    source_url TEXT NOT NULL,
    prompt TEXT NOT NULL,
    preset TEXT NOT NULL,
    run_id TEXT UNIQUE NOT NULL,
    stability_job_id TEXT,
    created_at TIMESTAMPTZ(6) DEFAULT NOW(),
    status TEXT DEFAULT 'completed',
    metadata JSONB DEFAULT '{}'
);

-- Create indexes for neo_glitch_media
CREATE INDEX IF NOT EXISTS idx_neo_glitch_media_stability_job_id ON neo_glitch_media(stability_job_id);
CREATE INDEX IF NOT EXISTS idx_neo_glitch_media_status ON neo_glitch_media(status);
CREATE INDEX IF NOT EXISTS idx_neo_glitch_media_user_id_created_at ON neo_glitch_media(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_neo_glitch_media_preset ON neo_glitch_media(preset);

-- 10. Create presets_media table
CREATE TABLE IF NOT EXISTS presets_media (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    source_url TEXT NOT NULL,
    prompt TEXT NOT NULL,
    preset TEXT NOT NULL,
    run_id TEXT UNIQUE NOT NULL,
    aiml_job_id TEXT,
    created_at TIMESTAMPTZ(6) DEFAULT NOW(),
    status TEXT DEFAULT 'completed',
    preset_week INTEGER,
    preset_rotation_index INTEGER,
    is_currently_available BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'
);

-- Create indexes for presets_media
CREATE INDEX IF NOT EXISTS idx_presets_media_status ON presets_media(status);
CREATE INDEX IF NOT EXISTS idx_presets_media_user_id_created_at ON presets_media(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_presets_media_aiml_job_id ON presets_media(aiml_job_id);
CREATE INDEX IF NOT EXISTS idx_presets_media_preset ON presets_media(preset);

-- 11. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ(6) DEFAULT NOW()
);

-- Create index for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read_created_at ON notifications(user_id, read, created_at DESC);

-- 12. Create assets table
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    public_id TEXT,
    resource_type VARCHAR(10) DEFAULT 'image',
    folder TEXT,
    bytes INTEGER,
    width INTEGER,
    height INTEGER,
    duration REAL,
    meta JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ(6) DEFAULT NOW()
);

-- Create index for assets
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON assets(user_id);

-- 13. Create presets_config table
CREATE TABLE IF NOT EXISTS presets_config (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    preset_key TEXT UNIQUE NOT NULL,
    preset_name TEXT NOT NULL,
    preset_description TEXT,
    preset_category TEXT,
    preset_prompt TEXT NOT NULL,
    preset_negative_prompt TEXT,
    preset_strength REAL DEFAULT 0.8,
    preset_rotation_index INTEGER NOT NULL,
    preset_week INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ(6) DEFAULT NOW(),
    updated_at TIMESTAMPTZ(6) DEFAULT NOW()
);

-- Create indexes for presets_config
CREATE INDEX IF NOT EXISTS presets_config_active_idx ON presets_config(is_active);
CREATE INDEX IF NOT EXISTS idx_presets_config_preset_key ON presets_config(preset_key);
CREATE INDEX IF NOT EXISTS presets_config_rotation_index_idx ON presets_config(preset_rotation_index);
CREATE INDEX IF NOT EXISTS presets_config_week_idx ON presets_config(preset_week);

-- 14. Create referral_signups table
CREATE TABLE IF NOT EXISTS referral_signups (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    referrer_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    new_user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referrer_email TEXT,
    new_user_email TEXT,
    created_at TIMESTAMPTZ(6) DEFAULT NOW()
);

-- Create indexes for referral_signups
CREATE INDEX IF NOT EXISTS idx_referral_signups_new_user ON referral_signups(new_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_signups_referrer ON referral_signups(referrer_user_id);

-- 15. Create app_config table
CREATE TABLE IF NOT EXISTS app_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL
);

-- 16. Create _extensions table
CREATE TABLE IF NOT EXISTS _extensions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT UNIQUE NOT NULL,
    enabled BOOLEAN DEFAULT TRUE
);

-- 17. Create missing_table (placeholder)
CREATE TABLE IF NOT EXISTS missing_table (
    id TEXT PRIMARY KEY,
    name TEXT,
    created_at TIMESTAMP(6) DEFAULT NOW()
);

-- Insert some default data
INSERT INTO app_config (key, value) VALUES 
    ('starter_grant', '30'),
    ('referral_referrer_bonus', '50'),
    ('referral_new_bonus', '25')
ON CONFLICT (key) DO NOTHING;

-- Insert some default presets
INSERT INTO presets_config (id, preset_key, preset_name, preset_description, preset_category, preset_prompt, preset_negative_prompt, preset_strength, preset_rotation_index, preset_week, is_active) VALUES 
    ('preset-1', 'ghibli', 'Ghibli Style', 'Studio Ghibli inspired art style', 'anime', 'Studio Ghibli style, Miyazaki, soft lighting, detailed backgrounds', 'blurry, low quality, distorted', 0.8, 1, 1, true),
    ('preset-2', 'emotionmask', 'Emotion Mask', 'Emotional expression overlay', 'portrait', 'emotional expression, portrait, detailed face', 'blurry, low quality, distorted', 0.8, 2, 1, true),
    ('preset-3', 'neotokyoglitch', 'Neo Tokyo Glitch', 'Cyberpunk Tokyo with glitch effects', 'cyberpunk', 'cyberpunk Tokyo, neon lights, glitch effects, futuristic', 'blurry, low quality, distorted', 0.8, 3, 1, true)
ON CONFLICT (preset_key) DO NOTHING;

-- Create a test user for development
INSERT INTO users (id, email, name, tier) VALUES 
    ('test-user-123', 'test@example.com', 'Test User', 'registered')
ON CONFLICT (id) DO NOTHING;

-- Create user credits for test user
INSERT INTO user_credits (user_id, balance, credits) VALUES 
    ('test-user-123', 30, 30)
ON CONFLICT (user_id) DO NOTHING;

-- Create user settings for test user
INSERT INTO user_settings (id, user_id, share_to_feed, allow_remix) VALUES 
    ('settings-test-123', 'test-user-123', true, true)
ON CONFLICT (user_id) DO NOTHING;

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO current_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO current_user;

-- Display created tables
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
