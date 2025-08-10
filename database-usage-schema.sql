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

-- Track token usage per day
alter table public.usage 
add column if not exists tokens int not null default 0;

-- Limits by tier (daily and weekly)
create or replace function public.get_limits(p_tier text)
returns table(daily_limit int, weekly_limit int)
language sql as $$
  select 
    case 
      when lower(coalesce(p_tier,'registered')) = 'verified' then 60
      when lower(coalesce(p_tier,'registered')) = 'contributor' then 120
      else 30
    end as daily_limit,
    case 
      when lower(coalesce(p_tier,'registered')) = 'verified' then 300
      when lower(coalesce(p_tier,'registered')) = 'contributor' then 600
      else 150
    end as weekly_limit
$$;

-- Compute user's current quota (used and limits)
create or replace function public.get_quota(p_user_id uuid)
returns table(daily_used int, daily_limit int, weekly_used int, weekly_limit int)
language plpgsql as $$
declare
  v_tier text;
begin
  select tier into v_tier from public.users where id = p_user_id;
  if v_tier is null then v_tier := 'registered'; end if;

  return query
  with d as (
    select tokens from public.usage where user_id = p_user_id and day = current_date
  ),
  w as (
    select coalesce(sum(tokens),0) as tokens
    from public.usage 
    where user_id = p_user_id 
      and day >= current_date - interval '6 days'
  ),
  l as (
    select * from public.get_limits(v_tier)
  )
  select 
    coalesce((select tokens from d), 0) as daily_used,
    l.daily_limit,
    (select tokens from w) as weekly_used,
    l.weekly_limit
  from l;
end $$;

-- Pre-check tokens without consuming
create or replace function public.can_consume_tokens(p_user_id uuid, p_cost int)
returns table(ok boolean, reason text, daily_remaining int, weekly_remaining int)
language plpgsql as $$
declare
  q record;
begin
  select * into q from public.get_quota(p_user_id);
  if q.daily_used + p_cost > q.daily_limit then
    return query select false, 'Daily limit reached', greatest(q.daily_limit - q.daily_used, 0), greatest(q.weekly_limit - q.weekly_used, 0);
  end if;
  if q.weekly_used + p_cost > q.weekly_limit then
    return query select false, 'Weekly limit reached', greatest(q.daily_limit - q.daily_used, 0), greatest(q.weekly_limit - q.weekly_used, 0);
  end if;
  return query select true, null::text, q.daily_limit - q.daily_used - p_cost, q.weekly_limit - q.weekly_used - p_cost;
end $$;

-- Atomically consume tokens for today
create or replace function public.consume_tokens(p_user_id uuid, p_cost int, p_kind text default 'photo')
returns table(ok boolean)
language plpgsql as $$
declare
  c record;
  v_kind text := coalesce(p_kind,'photo');
begin
  perform public.ensure_usage_row(p_user_id, current_date);
  select * into c from public.can_consume_tokens(p_user_id, p_cost);
  if not c.ok then
    return query select false;
  end if;

  update public.usage
  set tokens = tokens + p_cost,
      img_count = img_count + case when v_kind in ('img','photo','image') then 1 else 0 end,
      vid_count = vid_count + case when v_kind in ('vid','video') then 1 else 0 end
  where user_id = p_user_id and day = current_date;

  return query select true;
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
