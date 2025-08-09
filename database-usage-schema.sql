-- Usage tracking table for daily quotas
create table if not exists public.usage (
  user_id uuid not null,
  day date not null,
  img_count int not null default 0,
  vid_count int not null default 0,
  primary key (user_id, day)
);

-- Enable RLS (for safety, even though we use service role)
alter table public.usage enable row level security;

-- Function to ensure usage row exists for a user/day combination
create or replace function public.ensure_usage_row(u_user_id uuid, u_day date)
returns void language plpgsql as $$
begin
  insert into public.usage(user_id, day)
  values (u_user_id, u_day)
  on conflict (user_id, day) do nothing;
end $$;

-- Function to increment usage counters
create or replace function public.bump_usage(u_user_id uuid, u_day date, u_kind text)
returns void language plpgsql as $$
begin
  if u_kind = 'img' then
    update public.usage 
    set img_count = img_count + 1 
    where user_id = u_user_id and day = u_day;
  else
    update public.usage 
    set vid_count = vid_count + 1 
    where user_id = u_user_id and day = u_day;
  end if;
end $$;

-- Add new columns to existing assets table for high-res tracking
alter table public.assets 
add column if not exists proc_w int,
add column if not exists proc_h int,
add column if not exists fps int,
add column if not exists seconds numeric,
add column if not exists kind text,
add column if not exists request_key text;

-- Index for request deduplication
create index if not exists assets_user_request_key_idx 
on public.assets(user_id, request_key);

-- Index for usage queries
create index if not exists usage_user_day_idx 
on public.usage(user_id, day);
