-- Subcategory storage for bikes/helmets (cross-device sync)
-- Run this in Supabase SQL Editor after your base schema.

create table if not exists public.asset_subcategories (
  id bigserial primary key,
  asset_type text not null check (asset_type in ('bike', 'helmet')),
  name text not null,
  fleet_numbers integer[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade
);

create index if not exists idx_asset_subcategories_user_id
  on public.asset_subcategories(user_id);

create index if not exists idx_asset_subcategories_user_type
  on public.asset_subcategories(user_id, asset_type);

alter table public.asset_subcategories enable row level security;

drop policy if exists "Users can view own subcategories" on public.asset_subcategories;
create policy "Users can view own subcategories"
  on public.asset_subcategories for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own subcategories" on public.asset_subcategories;
create policy "Users can insert own subcategories"
  on public.asset_subcategories for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own subcategories" on public.asset_subcategories;
create policy "Users can update own subcategories"
  on public.asset_subcategories for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own subcategories" on public.asset_subcategories;
create policy "Users can delete own subcategories"
  on public.asset_subcategories for delete
  using (auth.uid() = user_id);

create or replace function public.update_asset_subcategories_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_asset_subcategories_updated_at on public.asset_subcategories;
create trigger trg_asset_subcategories_updated_at
before update on public.asset_subcategories
for each row
execute procedure public.update_asset_subcategories_updated_at();
