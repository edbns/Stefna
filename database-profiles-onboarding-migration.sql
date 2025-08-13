-- Profiles & Onboarding Migration for Stefna
-- Copy and paste this entire script into Supabase SQL Editor

-- Step 1: Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text,
  avatar_url text,
  share_to_feed boolean NOT NULL DEFAULT false,
  allow_remix boolean NOT NULL DEFAULT false,
  onboarding_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- Enforce allowed characters & length for username
  CONSTRAINT username_chars CHECK (
    username IS NULL OR username ~ '^[a-z0-9_]{3,30}$'
  )
);

-- Step 2: Case-insensitive uniqueness for username (safer than plain UNIQUE)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_idx
  ON public.profiles (lower(username));

-- Additional unique constraint for direct username uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_key 
  ON public.profiles (lower(username));

-- Step 3: Updated-at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$;

-- Step 4: Apply updated-at trigger to profiles
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Step 5: Auto-create profile row when new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (new.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

-- Step 6: Apply auto-create trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 7: Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 8: RLS Policies for profiles

-- Everyone can read profiles (needed to show avatar/name on media cards)
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_select_all"
  ON public.profiles FOR SELECT
  TO anon, authenticated
  USING (true);

-- Users can insert their own (rarely needed since trigger inserts, but safe)
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Step 9: Add profile fields to media_assets for denormalized display
ALTER TABLE public.media_assets ADD COLUMN IF NOT EXISTS user_username text;
ALTER TABLE public.media_assets ADD COLUMN IF NOT EXISTS user_avatar text;

-- Step 10: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding ON public.profiles(onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_media_assets_user_username ON public.media_assets(user_username);

-- Step 11: Function to get user profile info (for media cards)
CREATE OR REPLACE FUNCTION public.get_user_profile(user_id_param text)
RETURNS TABLE(username text, avatar_url text, share_to_feed boolean, allow_remix boolean)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT p.username, p.avatar_url, p.share_to_feed, p.allow_remix
  FROM public.profiles p
  WHERE p.id::text = user_id_param;
END;
$$;

-- Step 12: Check results
SELECT 'Profiles & Onboarding migration completed successfully!' as status;

-- Step 13: Verify the setup
SELECT 
  table_schema, 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;
