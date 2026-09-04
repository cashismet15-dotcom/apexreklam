-- "Günlük Görevler" modülü için ekleme (additive) migration.
-- Tabloları SİLMEZ — mevcut Supabase projesinde SQL Editor'de
-- (https://supabase.com/dashboard/project/_/sql/new) çalıştırın.
--
-- Bu modül personel + biz için günlük görev takibi: her kişinin kendi
-- tekrarlayan görev listesi var, her gün için ayrı işaretlenir (kutucuk).
-- daily_habits/daily_habit_logs (kişisel alışkanlık takibi) ile ilgisi yok.

-- ---------------------------------------------------------------------------
-- daily_task_people — takip edilen kişiler (personel + biz).
-- ---------------------------------------------------------------------------
create table if not exists public.daily_task_people (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists daily_task_people_active_idx on public.daily_task_people (active, sort_order);

alter table public.daily_task_people enable row level security;

drop policy if exists "anon full access" on public.daily_task_people;
create policy "anon full access" on public.daily_task_people
  for all
  to anon
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- daily_tasks — bir kişinin tekrarlayan (her gün geçerli) görev listesi.
-- ---------------------------------------------------------------------------
create table if not exists public.daily_tasks (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.daily_task_people (id) on delete cascade,
  title text not null,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists daily_tasks_person_id_idx on public.daily_tasks (person_id, active, sort_order);

alter table public.daily_tasks enable row level security;

drop policy if exists "anon full access" on public.daily_tasks;
create policy "anon full access" on public.daily_tasks
  for all
  to anon
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- daily_task_logs — her görev için hangi günde yapıldı bilgisi
-- (1 satır = 1 görev x 1 gün).
-- ---------------------------------------------------------------------------
create table if not exists public.daily_task_logs (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.daily_tasks (id) on delete cascade,
  log_date date not null,
  done boolean not null default true,
  done_at timestamptz not null default now(),
  unique (task_id, log_date)
);

create index if not exists daily_task_logs_task_id_idx on public.daily_task_logs (task_id);
create index if not exists daily_task_logs_log_date_idx on public.daily_task_logs (log_date);

alter table public.daily_task_logs enable row level security;

drop policy if exists "anon full access" on public.daily_task_logs;
create policy "anon full access" on public.daily_task_logs
  for all
  to anon
  using (true)
  with check (true);
