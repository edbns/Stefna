-- Fix for feed showing 0 items: Create missing shares table and backfill data
-- This migration is idempotent and safe to run multiple times

-- 1) Create table public.shares (safe to run multiple times)
-- Needed for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.shares (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id   uuid NOT NULL REFERENCES public.media_assets(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id)         ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Unique per (asset_id, user_id) so a user can "share" an asset once
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'shares_unique_asset_user'
  ) THEN
    ALTER TABLE public.shares
      ADD CONSTRAINT shares_unique_asset_user UNIQUE (asset_id, user_id);
  END IF;
END$$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_shares_asset   ON public.shares(asset_id);
CREATE INDEX IF NOT EXISTS idx_shares_user    ON public.shares(user_id);
CREATE INDEX IF NOT EXISTS idx_shares_created ON public.shares(created_at DESC);

-- 2) Turn on RLS + policies (no "IF NOT EXISTS" — we drop then create)
ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS anyone_can_read_shares ON public.shares;
CREATE POLICY anyone_can_read_shares
ON public.shares
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS auth_can_insert_share ON public.shares;
CREATE POLICY auth_can_insert_share
ON public.shares
FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS owner_can_delete_share ON public.shares;
CREATE POLICY owner_can_delete_share
ON public.shares
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- 3) Backfill shares from existing public media
-- Only insert for assets that (a) are public, (b) have a user_id, and (c) that user exists
INSERT INTO public.shares (asset_id, user_id, created_at)
SELECT m.id, m.user_id, COALESCE(m.created_at, now())
FROM public.media_assets m
LEFT JOIN public.shares s
  ON s.asset_id = m.id AND s.user_id = m.user_id
WHERE m.visibility = 'public'
  AND m.user_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM auth.users u WHERE u.id = m.user_id)
  AND s.asset_id IS NULL;

-- 4) Clean up orphaned public assets (those without valid user_id)
-- See how many public, ownerless assets you have (these broke the backfill)
SELECT count(*) AS orphan_public_assets
FROM public.media_assets
WHERE visibility = 'public' AND user_id IS NULL;

-- Make ownerless assets non-public (so they never hit the feed)
UPDATE public.media_assets
SET visibility = 'private'
WHERE visibility = 'public' AND user_id IS NULL;

-- 5) Auto-fill user_id on future inserts if caller forgets to send it
CREATE OR REPLACE FUNCTION public.set_media_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_set_media_owner ON public.media_assets;
CREATE TRIGGER trg_set_media_owner
BEFORE INSERT ON public.media_assets
FOR EACH ROW EXECUTE FUNCTION public.set_media_owner();

-- 6) Sanity checks to verify everything is working
-- Shares present?
SELECT 'Shares count:' as info, count(*) as count FROM public.shares;

-- Feed base rows (without requiring shares) just to verify you have public items
SELECT 'Public media count:' as info, count(*) as count
FROM public.media_assets
WHERE visibility='public';

-- Sample of recent public media
SELECT 'Recent public media:' as info, id, created_at, user_id
FROM public.media_assets
WHERE visibility='public'
ORDER BY created_at DESC
LIMIT 5;

-- Refresh schema cache to avoid PGRST204 errors
NOTIFY pgrst, 'reload schema';
