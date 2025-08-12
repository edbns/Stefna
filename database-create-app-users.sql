-- Create app_users table and repoint foreign keys for custom OTP users
-- Run this in Supabase SQL editor to fix the FK constraint error

begin;

-- 1) Create a lightweight user table for your OTP identities
create table if not exists public.app_users (
  id uuid primary key,
  email text unique,
  created_at timestamptz default now()
);

-- 2) Repoint media_assets.user_id FK to app_users
alter table public.media_assets
  drop constraint if exists media_assets_user_id_fkey;

alter table public.media_assets
  add constraint media_assets_user_id_fkey
  foreign key (user_id) references public.app_users(id)
  on delete cascade;

-- 3) (If you have these tables) repoint their FKs too
-- likes.user_id
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='likes' and column_name='user_id') then
    alter table public.likes
      drop constraint if exists likes_user_id_fkey;
    alter table public.likes
      add constraint likes_user_id_fkey
      foreign key (user_id) references public.app_users(id)
      on delete cascade;
  end if;
end$$;

-- shares.user_id
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='shares' and column_name='user_id') then
    alter table public.shares
      drop constraint if exists shares_user_id_fkey;
    alter table public.shares
      add constraint shares_user_id_fkey
      foreign key (user_id) references public.app_users(id)
      on delete cascade;
  end if;
end$$;

-- 4) Backfill app_users from any existing rows
insert into public.app_users (id)
select distinct user_id
from public.media_assets
where user_id is not null
on conflict (id) do nothing;

commit;

-- Verify the fix
select 
  'app_users' as table_name,
  count(*) as user_count
from public.app_users
union all
select 
  'media_assets' as table_name,
  count(*) as media_count
from public.media_assets;
