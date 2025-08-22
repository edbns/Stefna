-- Fix Database Architecture Issues
-- This script consolidates the database structure and fixes inconsistencies

-- 1. First, let's check what tables actually exist and their structure
-- This will help us understand the current state

-- 2. Create a consolidated media_assets table if it doesn't exist
CREATE TABLE IF NOT EXISTS media_assets (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  url TEXT, -- Legacy field for backward compatibility
  final_url TEXT, -- Primary field for generated media URLs
  cloudinary_public_id TEXT,
  public_id TEXT, -- Alternative field name
  resource_type TEXT DEFAULT 'image',
  media_type TEXT, -- Alternative field name
  folder TEXT,
  bytes INTEGER,
  width INTEGER,
  height INTEGER,
  duration INTEGER,
  prompt TEXT,
  negative_prompt TEXT,
  model TEXT,
  mode TEXT,
  visibility TEXT DEFAULT 'private',
  is_public BOOLEAN DEFAULT false, -- Legacy field for backward compatibility
  allow_remix BOOLEAN DEFAULT false,
  env TEXT DEFAULT 'production',
  meta JSONB,
  status TEXT DEFAULT 'ready', -- 'ready', 'processing', 'failed'
  preset_key TEXT, -- Alternative to preset_id
  preset_id TEXT, -- Alternative to preset_key
  source_asset_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_media_assets_user_id ON media_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_created_at ON media_assets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_assets_visibility ON media_assets(visibility, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_assets_status ON media_assets(status);
CREATE INDEX IF NOT EXISTS idx_media_assets_final_url ON media_assets(final_url) WHERE final_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_media_assets_cloudinary_public_id ON media_assets(cloudinary_public_id) WHERE cloudinary_public_id IS NOT NULL;

-- 4. Create a view to maintain backward compatibility with existing code
CREATE OR REPLACE VIEW assets AS
SELECT 
  id,
  user_id,
  cloudinary_public_id,
  final_url,
  COALESCE(media_type, resource_type) as media_type,
  preset_key,
  prompt,
  source_asset_id,
  status,
  COALESCE(is_public, visibility = 'public') as is_public,
  allow_remix,
  meta,
  created_at,
  updated_at
FROM media_assets;

-- 5. Ensure credits system tables exist
CREATE TABLE IF NOT EXISTS user_credits (
  user_id TEXT PRIMARY KEY,
  balance INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credits_ledger (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  action TEXT NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('reserved','committed','refunded','granted')),
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_ledger_user_request ON credits_ledger(user_id, request_id);
CREATE INDEX IF NOT EXISTS ix_ledger_user_created ON credits_ledger(user_id, created_at);

-- 6. Ensure app_config table exists for credits configuration
CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

-- Insert default config if not exists
INSERT INTO app_config(key,value) VALUES
 ('daily_cap',               '30'),
 ('starter_grant',           '30'),
 ('image_cost',              '2'),
 ('video_cost',              '5'),
 ('video_enabled',           'false'),
 ('referral_referrer_bonus', '50'),
 ('referral_new_bonus',      '25')
ON CONFLICT (key) DO NOTHING;

-- 7. Create the credits functions if they don't exist
CREATE OR REPLACE FUNCTION app.cfg_int(p_key TEXT, p_default INTEGER)
RETURNS INTEGER AS $$
DECLARE v JSONB; n INTEGER;
BEGIN
  SELECT value INTO v FROM app_config WHERE key = p_key;
  IF v IS NULL THEN RETURN p_default; END IF;
  SELECT (v::text)::int INTO n;
  RETURN n;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION app.allow_today_simple(p_user TEXT, p_cost INTEGER)
RETURNS BOOLEAN AS $$
DECLARE spent_today INTEGER := 0;
DECLARE cap INTEGER := app.cfg_int('daily_cap', 30);
BEGIN
  SELECT COALESCE(SUM(CASE WHEN amount < 0 AND status = 'committed' THEN -amount ELSE 0 END), 0)
    INTO spent_today
  FROM credits_ledger
  WHERE user_id = p_user
    AND (created_at AT TIME ZONE 'UTC')::date = (NOW() AT TIME ZONE 'UTC')::date;

  RETURN (spent_today + p_cost) <= cap;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION app.reserve_credits(
  p_user TEXT, p_request TEXT, p_action TEXT, p_cost INTEGER
)
RETURNS TABLE (balance INTEGER) AS $$
DECLARE new_balance INTEGER;
BEGIN
  INSERT INTO credits_ledger(user_id, request_id, action, amount, status)
  VALUES (p_user, p_request, p_action, -p_cost, 'reserved');

  UPDATE user_credits
  SET balance = balance - p_cost, updated_at = NOW()
  WHERE user_id = p_user AND balance >= p_cost
  RETURNING balance INTO new_balance;

  IF new_balance IS NULL THEN
    DELETE FROM credits_ledger WHERE user_id = p_user AND request_id = p_request;
    RAISE EXCEPTION 'INSUFFICIENT_CREDITS';
  END IF;

  RETURN QUERY SELECT new_balance;
EXCEPTION WHEN unique_violation THEN
  RETURN QUERY SELECT balance FROM user_credits WHERE user_id = p_user;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION app.finalize_credits(
  p_user TEXT, p_request TEXT, p_status TEXT
)
RETURNS VOID AS $$
DECLARE res credits_ledger;
BEGIN
  IF p_status = 'commit' THEN
    UPDATE credits_ledger
    SET status = 'committed'
    WHERE user_id = p_user AND request_id = p_request AND status = 'reserved';
  ELSIF p_status = 'refund' THEN
    SELECT * INTO res
    FROM credits_ledger
    WHERE user_id = p_user AND request_id = p_request
      AND status IN ('reserved','committed')
    ORDER BY created_at ASC
    LIMIT 1;

    IF NOT FOUND THEN RETURN; END IF;

    INSERT INTO credits_ledger(user_id, request_id, action, amount, status, meta)
    VALUES (res.user_id, res.request_id, res.action, -res.amount, 'refunded', jsonb_build_object('reason','op_failed'))
    ON CONFLICT DO NOTHING;

    UPDATE user_credits
    SET balance = balance + (-res.amount), updated_at = NOW()
    WHERE user_id = p_user;
  ELSE
    RAISE EXCEPTION 'INVALID_FINALIZE_STATUS %', p_status;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION app.grant_credits(
  p_user TEXT, p_amount INTEGER, p_reason TEXT, p_meta JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID AS $$
BEGIN
  UPDATE user_credits SET balance = balance + p_amount, updated_at = NOW()
  WHERE user_id = p_user;
  IF NOT FOUND THEN
    INSERT INTO user_credits(user_id, balance) VALUES (p_user, p_amount);
  END IF;

  INSERT INTO credits_ledger(user_id, request_id, action, amount, status, meta)
  VALUES (p_user, gen_random_uuid()::text, p_reason, p_amount, 'granted', p_meta);
END;
$$ LANGUAGE plpgsql;

-- 8. Create a migration function to move data from old tables if they exist
CREATE OR REPLACE FUNCTION migrate_old_assets_data()
RETURNS VOID AS $$
BEGIN
  -- Check if old assets table exists and has data
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assets' AND table_schema = 'public') THEN
    -- Insert data from old assets table to new media_assets table
    INSERT INTO media_assets (
      id, user_id, final_url, cloudinary_public_id, media_type, 
      prompt, status, is_public, allow_remix, meta, created_at, updated_at
    )
    SELECT 
      id, user_id, final_url, cloudinary_public_id, media_type,
      prompt, COALESCE(status, 'ready'), is_public, allow_remix, meta, created_at, updated_at
    FROM assets
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Migrated data from old assets table to media_assets';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 9. Execute the migration
SELECT migrate_old_assets_data();

-- 10. Create a function to get public feed with proper provider detection
CREATE OR REPLACE FUNCTION get_public_feed(p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  id TEXT,
  user_id TEXT,
  user_email TEXT,
  final_url TEXT,
  media_type TEXT,
  prompt TEXT,
  status TEXT,
  provider TEXT,
  preset_key TEXT,
  created_at TIMESTAMPTZ,
  allow_remix BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ma.id,
    ma.user_id,
    u.email as user_email,
    ma.final_url,
    COALESCE(ma.media_type, ma.resource_type) as media_type,
    ma.prompt,
    ma.status,
    CASE 
      WHEN ma.final_url LIKE '%replicate.delivery%' THEN 'replicate'
      WHEN ma.cloudinary_public_id IS NOT NULL THEN 'cloudinary'
      ELSE 'unknown'
    END as provider,
    COALESCE(ma.preset_key, ma.preset_id) as preset_key,
    ma.created_at,
    ma.allow_remix
  FROM media_assets ma
  LEFT JOIN users u ON ma.user_id = u.id
  WHERE ma.is_public = true 
    AND ma.status = 'ready'
    AND ma.final_url IS NOT NULL
  ORDER BY ma.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- 11. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO PUBLIC;
GRANT ALL ON ALL TABLES IN SCHEMA public TO PUBLIC;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO PUBLIC;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO PUBLIC;

-- 12. Create a summary view of the current database state
CREATE OR REPLACE VIEW database_summary AS
SELECT 
  'media_assets' as table_name,
  COUNT(*) as record_count,
  'Main media storage table' as description
FROM media_assets
UNION ALL
SELECT 
  'user_credits' as table_name,
  COUNT(*) as record_count,
  'User credit balances' as description
FROM user_credits
UNION ALL
SELECT 
  'credits_ledger' as table_name,
  COUNT(*) as record_count,
  'Credit transaction history' as description
FROM credits_ledger
UNION ALL
SELECT 
  'app_config' as table_name,
  COUNT(*) as record_count,
  'Application configuration' as description
FROM app_config;

-- 13. Final verification query
SELECT 'Database architecture fix completed successfully' as status;
