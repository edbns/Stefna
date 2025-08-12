-- Performance indexes for media_assets table
-- Run this in Supabase SQL editor after the RLS policies

-- Latest for a user (All Media tab)
create index if not exists idx_media_assets_user_created_at
  on public.media_assets (user_id, created_at desc);

-- Public feed (sorted by newest first)
create index if not exists idx_media_assets_visibility_created_at
  on public.media_assets (visibility, created_at desc);

-- Optional env filter (if you use it in queries)
create index if not exists idx_media_assets_env_created_at
  on public.media_assets (env, created_at desc);

-- If you sometimes upsert by job_id
create unique index if not exists uq_media_assets_job_id
  on public.media_assets (job_id) where job_id is not null;

-- Composite index for visibility + allow_remix queries
create index if not exists idx_media_assets_vis_remix_created
  on public.media_assets (visibility, allow_remix, created_at desc);

-- If you have a likes table, also add this constraint:
-- (Uncomment and adjust column names if you have a likes table)
-- alter table public.likes
--   add constraint if not exists likes_user_asset_unique
--   unique (user_id, asset_id);
