-- Database Compatibility View for Neon Migration
-- This view maps the new Neon schema to the old column names your code expects
-- Run this in your Neon database to fix the schema mismatches

-- Create compatibility view for media_assets table
CREATE OR REPLACE VIEW app_media AS
SELECT
  id,
  owner_id AS user_id,           -- Map owner_id to user_id for compatibility
  url,
  public_id,
  resource_type AS type,         -- Map resource_type to type for compatibility
  visibility,
  CASE 
    WHEN visibility = 'public' THEN true 
    ELSE false 
  END AS is_public,              -- Map visibility to is_public boolean
  prompt,
  model,
  mode,
  allow_remix,
  env,
  meta,
  created_at,
  updated_at
FROM media_assets;

-- Create compatibility view for users table
CREATE OR REPLACE VIEW app_users AS
SELECT
  id,
  email,
  external_id,
  name,
  tier,
  avatar_url,
  created_at,
  updated_at
FROM users;

-- Create compatibility view for user_settings table
CREATE OR REPLACE VIEW app_user_settings AS
SELECT
  id,
  user_id,
  share_to_feed,
  allow_remix,
  updated_at
FROM user_settings;

-- Grant permissions to the views
GRANT SELECT ON app_media TO authenticated;
GRANT SELECT ON app_users TO authenticated;
GRANT SELECT ON app_user_settings TO authenticated;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS app_media_user_id_idx ON media_assets(owner_id);
CREATE INDEX IF NOT EXISTS app_media_visibility_idx ON media_assets(visibility);
CREATE INDEX IF NOT EXISTS app_media_created_at_idx ON media_assets(created_at);

-- Verify the views work
SELECT 'Compatibility views created successfully!' as status;

-- Test the views
SELECT 'Testing app_media view:' as test;
SELECT COUNT(*) as media_count FROM app_media;

SELECT 'Testing app_users view:' as test;
SELECT COUNT(*) as users_count FROM app_users;

SELECT 'Testing app_user_settings view:' as test;
SELECT COUNT(*) as settings_count FROM app_user_settings;
