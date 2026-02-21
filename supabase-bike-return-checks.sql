-- Bike Park return checklist storage (cross-device sync)
-- Run this in Supabase SQL Editor after your base schema.

create table if not exists public.bike_return_checks (
  id bigserial primary key,
  session_id bigint not null references public.sessions(id) on delete cascade,
  asset_id bigint not null references public.assets(id) on delete cascade,
  cleaned boolean not null,
  needs_maintenance boolean not null,
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade
);

create index if not exists idx_bike_return_checks_user_id
  on public.bike_return_checks(user_id);

create index if not exists idx_bike_return_checks_created_at
  on public.bike_return_checks(created_at desc);

alter table public.bike_return_checks enable row level security;

drop policy if exists "Users can view own bike return checks" on public.bike_return_checks;
create policy "Users can view own bike return checks"
  on public.bike_return_checks for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own bike return checks" on public.bike_return_checks;
create policy "Users can insert own bike return checks"
  on public.bike_return_checks for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own bike return checks" on public.bike_return_checks;
create policy "Users can update own bike return checks"
  on public.bike_return_checks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own bike return checks" on public.bike_return_checks;
create policy "Users can delete own bike return checks"
  on public.bike_return_checks for delete
  using (auth.uid() = user_id);
