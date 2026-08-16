-- "Günlük Takip" modülü için ekleme (additive) migration.
-- Tabloları SİLMEZ — mevcut Supabase projesinde SQL Editor'de
-- (https://supabase.com/dashboard/project/_/sql/new) çalıştırın.
--
-- Bu modül diğer modüllerden bağımsız: müşteri/CRM ile ilgisi yok, tamamen
-- kişisel günlük görev (spor, diyet vb.) takibi ve haftalık rapor için.

-- ---------------------------------------------------------------------------
-- daily_habits — takip edilen görevlerin listesi (örn. "Spor", "Diyet").
-- ---------------------------------------------------------------------------
create table if not exists public.daily_habits (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists daily_habits_active_idx on public.daily_habits (active, sort_order);

alter table public.daily_habits enable row level security;

drop policy if exists "anon full access" on public.daily_habits;
create policy "anon full access" on public.daily_habits
  for all
  to anon
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- daily_habit_logs — her görev için hangi günde yapıldı/yapılmadı bilgisi
-- (1 satır = 1 görev x 1 gün).
-- ---------------------------------------------------------------------------
create table if not exists public.daily_habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.daily_habits (id) on delete cascade,
  log_date date not null,
  done boolean not null default true,
  created_at timestamptz not null default now(),
  unique (habit_id, log_date)
);

create index if not exists daily_habit_logs_habit_id_idx on public.daily_habit_logs (habit_id);
create index if not exists daily_habit_logs_log_date_idx on public.daily_habit_logs (log_date);

alter table public.daily_habit_logs enable row level security;

drop policy if exists "anon full access" on public.daily_habit_logs;
create policy "anon full access" on public.daily_habit_logs
  for all
  to anon
  using (true)
  with check (true);
