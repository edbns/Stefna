-- One-time database backfill to fix NULL url values
-- Run this in Supabase SQL editor after deploying the function fixes

-- Backfill legacy rows where url is NULL but result_url exists
update public.media_assets
set url = result_url
where url is null and result_url is not null;

-- Verify the fix
select 
  count(*) as total_rows,
  count(url) as rows_with_url,
  count(result_url) as rows_with_result_url
from public.media_assets;

-- Show any remaining NULL urls (should be 0 after backfill)
select id, user_id, url, result_url 
from public.media_assets 
where url is null;
