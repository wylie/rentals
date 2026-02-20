-- App-level user settings storage (cross-device sync)
-- Run this in Supabase SQL Editor after your base schema.

create table if not exists public.app_settings (
  id bigserial primary key,
  setting_key text not null,
  setting_value text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  unique (user_id, setting_key)
);

create index if not exists idx_app_settings_user_id
  on public.app_settings(user_id);

alter table public.app_settings enable row level security;

drop policy if exists "Users can view own app settings" on public.app_settings;
create policy "Users can view own app settings"
  on public.app_settings for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own app settings" on public.app_settings;
create policy "Users can insert own app settings"
  on public.app_settings for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own app settings" on public.app_settings;
create policy "Users can update own app settings"
  on public.app_settings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own app settings" on public.app_settings;
create policy "Users can delete own app settings"
  on public.app_settings for delete
  using (auth.uid() = user_id);

create or replace function public.update_app_settings_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_app_settings_updated_at on public.app_settings;
create trigger trg_app_settings_updated_at
before update on public.app_settings
for each row
execute procedure public.update_app_settings_updated_at();
