-- Credits Ledger Table for Stefna
-- This table tracks all credit deductions for AI generation

-- Create the credits_ledger table
create table if not exists credits_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount int not null check (amount > 0),       -- number of credits to deduct
  reason text,                                   -- e.g. 'i2i_generate'
  request_id text unique,                        -- idempotency key to avoid double charge
  asset_id uuid references media_assets(id),     -- optional, fill later if you want
  env text not null default 'prod',
  created_at timestamptz not null default now()
);

-- Helpful indexes
create index if not exists idx_credits_user_date on credits_ledger(user_id, created_at desc);
create index if not exists idx_credits_env on credits_ledger(env);
create index if not exists idx_credits_request_id on credits_ledger(request_id);

-- Enable RLS
alter table credits_ledger enable row level security;

-- Drop existing policies if they exist
drop policy if exists "users read own credits" on credits_ledger;

-- Create RLS policy: users can read their own credit history
create policy "users read own credits"
on credits_ledger for select
using (
  (current_setting('request.jwt.claims', true)::jsonb->>'sub')::uuid = user_id
);

-- Note: Inserts will be done via service role (bypasses RLS) to ensure proper charging
-- Users cannot insert their own credits (security)
