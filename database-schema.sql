-- 🗄️ Complete Database Schema for Stefna - Raw SQL (No Prisma)
-- This replaces Prisma completely with all tables your functions need

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- CORE USER MANAGEMENT
-- ========================================

-- Users table (simplified - only what we actually use)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email TEXT UNIQUE,
    name TEXT,
    created_at TIMESTAMPTZ(6) DEFAULT NOW(),
    updated_at TIMESTAMPTZ(6) DEFAULT NOW(),
    avatar_url TEXT
);

-- User settings table (simplified - only what we actually use)
CREATE TABLE IF NOT EXISTS user_settings (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    media_upload_agreed BOOLEAN DEFAULT FALSE,
    share_to_feed BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ(6) DEFAULT NOW()
);

-- User credits table
CREATE TABLE IF NOT EXISTS user_credits (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    balance INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ(6) DEFAULT NOW(),
    credits INTEGER DEFAULT 30
);

-- ========================================
-- AUTHENTICATION
-- ========================================

-- OTP authentication table
CREATE TABLE IF NOT EXISTS auth_otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    created_at TIMESTAMPTZ(6) DEFAULT NOW(),
    expires_at TIMESTAMPTZ(6) NOT NULL,
    used BOOLEAN DEFAULT FALSE
);

-- ========================================
-- CREDIT SYSTEM
-- ========================================

-- Credit transactions table
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

-- ========================================
-- MEDIA TABLES
-- ========================================

-- Custom prompt media table
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

-- Emotion mask media table
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

-- Ghibli reaction media table
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

-- Neo glitch media table
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

-- Presets media table
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

-- ========================================
-- STORY TIME TABLES (MISSING FROM PRISMA)
-- ========================================

-- Story table
CREATE TABLE IF NOT EXISTS story (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    preset TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    story_text TEXT,
    created_at TIMESTAMPTZ(6) DEFAULT NOW(),
    updated_at TIMESTAMPTZ(6) DEFAULT NOW(),
    completed_at TIMESTAMPTZ(6),
    metadata JSONB DEFAULT '{}'
);

-- Story photo table
CREATE TABLE IF NOT EXISTS story_photo (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    story_id TEXT NOT NULL REFERENCES story(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    description TEXT,
    video_url TEXT,
    status TEXT DEFAULT 'pending',
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ(6) DEFAULT NOW(),
    updated_at TIMESTAMPTZ(6) DEFAULT NOW()
);

-- ========================================
-- VIDEO GENERATION TABLES (MISSING FROM PRISMA)
-- ========================================

-- Video jobs table
CREATE TABLE IF NOT EXISTS video_jobs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'story',
    status TEXT DEFAULT 'pending',
    input_data JSONB NOT NULL,
    output_data JSONB,
    progress INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ(6) DEFAULT NOW(),
    updated_at TIMESTAMPTZ(6) DEFAULT NOW(),
    started_at TIMESTAMPTZ(6),
    completed_at TIMESTAMPTZ(6)
);

-- AI generations table
CREATE TABLE IF NOT EXISTS ai_generations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    input_data JSONB NOT NULL,
    output_data JSONB,
    progress INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ(6) DEFAULT NOW(),
    updated_at TIMESTAMPTZ(6) DEFAULT NOW(),
    started_at TIMESTAMPTZ(6),
    completed_at TIMESTAMPTZ(6)
);

-- ========================================
-- SUPPORTING TABLES
-- ========================================



-- Assets table
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

-- Presets configuration table
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

-- Referral signups table
CREATE TABLE IF NOT EXISTS referral_signups (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    referrer_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    new_user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referrer_email TEXT,
    new_user_email TEXT,
    created_at TIMESTAMPTZ(6) DEFAULT NOW()
);

-- App configuration table
CREATE TABLE IF NOT EXISTS app_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL
);

-- Extensions table
CREATE TABLE IF NOT EXISTS _extensions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT UNIQUE NOT NULL,
    enabled BOOLEAN DEFAULT TRUE
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_tier ON users(tier);

-- User settings indexes
CREATE INDEX IF NOT EXISTS idx_user_settings_updated_at ON user_settings(updated_at DESC);

-- User credits indexes
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_credits_updated_at ON user_credits(updated_at DESC);

-- Auth OTPs indexes
CREATE INDEX IF NOT EXISTS idx_auth_otps_expires_at ON auth_otps(expires_at);
CREATE INDEX IF NOT EXISTS idx_auth_otps_code ON auth_otps(code);
CREATE INDEX IF NOT EXISTS idx_auth_otps_email ON auth_otps(email);
CREATE INDEX IF NOT EXISTS idx_auth_otps_created_at ON auth_otps(created_at DESC);

-- Credits ledger indexes
CREATE INDEX IF NOT EXISTS idx_credits_ledger_user_id_created_at ON credits_ledger(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credits_ledger_user_id_status_created_at ON credits_ledger(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credits_ledger_request_id ON credits_ledger(request_id);

-- Media tables indexes
CREATE INDEX IF NOT EXISTS idx_custom_prompt_media_status ON custom_prompt_media(status);
CREATE INDEX IF NOT EXISTS idx_custom_prompt_media_user_id_created_at ON custom_prompt_media(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_custom_prompt_media_aiml_job_id ON custom_prompt_media(aiml_job_id);
CREATE INDEX IF NOT EXISTS idx_custom_prompt_media_preset ON custom_prompt_media(preset);

CREATE INDEX IF NOT EXISTS idx_emotion_mask_media_status ON emotion_mask_media(status);
CREATE INDEX IF NOT EXISTS idx_emotion_mask_media_user_id_created_at ON emotion_mask_media(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emotion_mask_media_aiml_job_id ON emotion_mask_media(aiml_job_id);
CREATE INDEX IF NOT EXISTS idx_emotion_mask_media_preset ON emotion_mask_media(preset);

CREATE INDEX IF NOT EXISTS idx_ghibli_reaction_media_status ON ghibli_reaction_media(status);
CREATE INDEX IF NOT EXISTS idx_ghibli_reaction_media_user_id_created_at ON ghibli_reaction_media(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ghibli_reaction_media_aiml_job_id ON ghibli_reaction_media(aiml_job_id);
CREATE INDEX IF NOT EXISTS idx_ghibli_reaction_media_preset ON ghibli_reaction_media(preset);

CREATE INDEX IF NOT EXISTS idx_neo_glitch_media_stability_job_id ON neo_glitch_media(stability_job_id);
CREATE INDEX IF NOT EXISTS idx_neo_glitch_media_status ON neo_glitch_media(status);
CREATE INDEX IF NOT EXISTS idx_neo_glitch_media_user_id_created_at ON neo_glitch_media(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_neo_glitch_media_preset ON neo_glitch_media(preset);

CREATE INDEX IF NOT EXISTS idx_presets_media_status ON presets_media(status);
CREATE INDEX IF NOT EXISTS idx_presets_media_user_id_created_at ON presets_media(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_presets_media_aiml_job_id ON presets_media(aiml_job_id);
CREATE INDEX IF NOT EXISTS idx_presets_media_preset ON presets_media(preset);

-- Story tables indexes
CREATE INDEX IF NOT EXISTS idx_story_user_id ON story(user_id);
CREATE INDEX IF NOT EXISTS idx_story_status ON story(status);
CREATE INDEX IF NOT EXISTS idx_story_created_at ON story(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_story_photo_story_id ON story_photo(story_id);
CREATE INDEX IF NOT EXISTS idx_story_photo_status ON story_photo(status);
CREATE INDEX IF NOT EXISTS idx_story_photo_order ON story_photo(story_id, order_index);

-- Video tables indexes
CREATE INDEX IF NOT EXISTS idx_video_jobs_user_id ON video_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_video_jobs_status ON video_jobs(status);
CREATE INDEX IF NOT EXISTS idx_video_jobs_type ON video_jobs(type);
CREATE INDEX IF NOT EXISTS idx_video_jobs_created_at ON video_jobs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_generations_user_id ON ai_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_generations_status ON ai_generations(status);
CREATE INDEX IF NOT EXISTS idx_ai_generations_type ON ai_generations(type);
CREATE INDEX IF NOT EXISTS idx_ai_generations_created_at ON ai_generations(created_at DESC);

-- Other tables indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read_created_at ON notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON assets(user_id);
CREATE INDEX IF NOT EXISTS presets_config_active_idx ON presets_config(is_active);
CREATE INDEX IF NOT EXISTS idx_presets_config_preset_key ON presets_config(preset_key);
CREATE INDEX IF NOT EXISTS presets_config_rotation_index_idx ON presets_config(preset_rotation_index);
CREATE INDEX IF NOT EXISTS presets_config_week_idx ON presets_config(preset_week);
CREATE INDEX IF NOT EXISTS idx_referral_signups_new_user ON referral_signups(new_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_signups_referrer ON referral_signups(referrer_user_id);

-- ========================================
-- TRIGGERS FOR UPDATED_AT COLUMNS
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_story_updated_at BEFORE UPDATE ON story FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_story_photo_updated_at BEFORE UPDATE ON story_photo FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_video_jobs_updated_at BEFORE UPDATE ON video_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_generations_updated_at BEFORE UPDATE ON ai_generations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- SAMPLE DATA
-- ========================================

-- Insert default app configuration
INSERT INTO app_config (key, value) VALUES 
    ('starter_grant', '30'),
    ('referral_referrer_bonus', '50'),
    ('referral_new_bonus', '25')
ON CONFLICT (key) DO NOTHING;

-- Insert default presets
INSERT INTO presets_config (id, preset_key, preset_name, preset_description, preset_category, preset_prompt, preset_negative_prompt, preset_strength, preset_rotation_index, preset_week, is_active) VALUES 
    ('preset-1', 'ghibli', 'Ghibli Style', 'Studio Ghibli inspired art style', 'anime', 'Studio Ghibli style, Miyazaki, soft lighting, detailed backgrounds', 'blurry, low quality, distorted', 0.8, 1, 1, true),
    ('preset-2', 'emotionmask', 'Emotion Mask', 'Emotional expression overlay', 'portrait', 'emotional expression, portrait, detailed face', 'blurry, low quality, distorted', 0.8, 2, 1, true),
    ('preset-3', 'neotokyoglitch', 'Neo Tokyo Glitch', 'Cyberpunk Tokyo with glitch effects', 'cyberpunk', 'cyberpunk Tokyo, neon lights, glitch effects, futuristic', 'blurry, low quality, distorted', 0.8, 3, 1, true)
ON CONFLICT (preset_key) DO NOTHING;

-- ========================================
-- PERMISSIONS
-- ========================================

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO current_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO current_user;

-- ========================================
-- VERIFICATION
-- ========================================

-- Show all created tables
SELECT 
    table_name,
    'CREATED' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Show table counts
SELECT 
    'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'user_settings', COUNT(*) FROM user_settings
UNION ALL
SELECT 'user_credits', COUNT(*) FROM user_credits
UNION ALL
SELECT 'auth_otps', COUNT(*) FROM auth_otps
UNION ALL
SELECT 'credits_ledger', COUNT(*) FROM credits_ledger
UNION ALL
SELECT 'custom_prompt_media', COUNT(*) FROM custom_prompt_media
UNION ALL
SELECT 'emotion_mask_media', COUNT(*) FROM emotion_mask_media
UNION ALL
SELECT 'ghibli_reaction_media', COUNT(*) FROM ghibli_reaction_media
UNION ALL
SELECT 'neo_glitch_media', COUNT(*) FROM neo_glitch_media
UNION ALL
SELECT 'presets_media', COUNT(*) FROM presets_media
UNION ALL
SELECT 'story', COUNT(*) FROM story
UNION ALL
SELECT 'story_photo', COUNT(*) FROM story_photo
UNION ALL
SELECT 'video_jobs', COUNT(*) FROM video_jobs
UNION ALL
SELECT 'ai_generations', COUNT(*) FROM ai_generations
UNION ALL

SELECT 'assets', COUNT(*) FROM assets
UNION ALL
SELECT 'presets_config', COUNT(*) FROM presets_config
UNION ALL
SELECT 'referral_signups', COUNT(*) FROM referral_signups
UNION ALL
SELECT 'app_config', COUNT(*) FROM app_config
UNION ALL
SELECT '_extensions', COUNT(*) FROM _extensions;
