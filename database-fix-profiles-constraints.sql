-- Fix Profiles Table for Custom OTP Authentication
-- This fixes the foreign key constraint issues and RLS policies
-- Run this in your Supabase SQL Editor

BEGIN;

-- Step 1: Drop existing profiles table if it has wrong constraints
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Step 2: Create profiles table with correct foreign key to users (not auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  avatar_url TEXT,
  share_to_feed BOOLEAN DEFAULT false,
  allow_remix BOOLEAN DEFAULT false,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON public.profiles(updated_at);
CREATE INDEX IF NOT EXISTS idx_profiles_share_to_feed ON public.profiles(share_to_feed);

-- Step 4: Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Step 5: Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies for custom JWT authentication
-- Note: These policies work with custom JWT tokens, not Supabase Auth

-- Allow service role to do everything (for server-side operations)
DROP POLICY IF EXISTS "service_role_all_profiles" ON public.profiles;
CREATE POLICY "service_role_all_profiles"
ON public.profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow authenticated users to read all profiles (for public feed)
DROP POLICY IF EXISTS "authenticated_read_all_profiles" ON public.profiles;
CREATE POLICY "authenticated_read_all_profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Allow anonymous users to read public profiles (for public feed)
DROP POLICY IF EXISTS "anon_read_public_profiles" ON public.profiles;
CREATE POLICY "anon_read_public_profiles"
ON public.profiles
FOR SELECT
TO anon
USING (share_to_feed = true);

-- Step 7: Grant necessary permissions
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT ON public.profiles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.profiles TO service_role;

-- Step 8: Create function to safely upsert profile (for use by Netlify functions)
CREATE OR REPLACE FUNCTION public.upsert_profile(
  user_id UUID,
  username_param TEXT DEFAULT NULL,
  avatar_url_param TEXT DEFAULT NULL,
  share_to_feed_param BOOLEAN DEFAULT NULL,
  allow_remix_param BOOLEAN DEFAULT NULL,
  onboarding_completed_param BOOLEAN DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  username TEXT,
  avatar_url TEXT,
  share_to_feed BOOLEAN,
  allow_remix BOOLEAN,
  onboarding_completed BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify user exists in users table
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE public.users.id = user_id) THEN
    RAISE EXCEPTION 'User with ID % does not exist', user_id;
  END IF;

  -- Upsert the profile
  INSERT INTO public.profiles (
    id,
    username,
    avatar_url,
    share_to_feed,
    allow_remix,
    onboarding_completed,
    updated_at
  ) VALUES (
    user_id,
    COALESCE(username_param, ''),
    COALESCE(avatar_url_param, ''),
    COALESCE(share_to_feed_param, false),
    COALESCE(allow_remix_param, false),
    COALESCE(onboarding_completed_param, false),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    username = CASE WHEN username_param IS NOT NULL THEN username_param ELSE profiles.username END,
    avatar_url = CASE WHEN avatar_url_param IS NOT NULL THEN avatar_url_param ELSE profiles.avatar_url END,
    share_to_feed = CASE WHEN share_to_feed_param IS NOT NULL THEN share_to_feed_param ELSE profiles.share_to_feed END,
    allow_remix = CASE WHEN allow_remix_param IS NOT NULL THEN 
      CASE WHEN COALESCE(share_to_feed_param, profiles.share_to_feed) THEN allow_remix_param ELSE false END
      ELSE profiles.allow_remix END,
    onboarding_completed = CASE WHEN onboarding_completed_param IS NOT NULL THEN onboarding_completed_param ELSE profiles.onboarding_completed END,
    updated_at = NOW();

  -- Return the updated profile
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.avatar_url,
    p.share_to_feed,
    p.allow_remix,
    p.onboarding_completed,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.id = user_id;
END;
$$;

-- Step 9: Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.upsert_profile TO service_role;

-- Step 10: Create profiles for existing users
INSERT INTO public.profiles (id, username, avatar_url, share_to_feed, allow_remix, onboarding_completed)
SELECT 
  u.id,
  NULL as username,
  u.avatar_url,
  false as share_to_feed,
  false as allow_remix,
  false as onboarding_completed
FROM public.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- Verify the setup
SELECT 
  'profiles' as table_name,
  count(*) as row_count
FROM public.profiles
UNION ALL
SELECT 
  'users' as table_name,
  count(*) as row_count
FROM public.users;

-- Test the upsert function
-- SELECT * FROM public.upsert_profile(
--   (SELECT id FROM public.users LIMIT 1),
--   'test_username',
--   'https://example.com/avatar.jpg',
--   true,
--   true,
--   true
-- );
