-- "Panel" (ekip CRM'i) için ekleme (additive) migration. Tabloları SİLMEZ —
-- mevcut Supabase projesinde SQL Editor'de
-- (https://supabase.com/dashboard/project/_/sql/new) çalıştırın.
--
-- Bu modül Muhasebe'deki aynı public.customers tablosunu kullanır (müşteri
-- kartları = aynı müşteriler). Sadece görev ve Meta reklam raporu için yeni
-- tablo ekliyor. Görünürlük/yetki (kim neyi görür) uygulama katmanında
-- (session role) kontrol edilir — bu app'te giriş var ama satır bazlı DB
-- güvenliği yok, bkz. schema.sql'deki güvenlik notu.

-- ---------------------------------------------------------------------------
-- client_tasks — bir müşteri için yapılan/yapılacak iş, birine atanabilir.
-- ---------------------------------------------------------------------------
create table if not exists public.client_tasks (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  title text not null,
  description text,
  category text not null default 'diger'
    check (category in ('video', 'reklam', 'yapay_zeka', 'diger')),
  status text not null default 'bekliyor'
    check (status in ('bekliyor', 'devam_ediyor', 'tamamlandi')),
  -- Ekip üyesi kimliği — gerçek bir kullanıcılar tablosu yok, session role'üyle
  -- birebir eşleşir (bkz. src/lib/session.ts AppRole).
  assigned_to text not null check (assigned_to in ('owner', 'huseyin', 'batuhan')),
  created_by text not null check (created_by in ('owner', 'huseyin', 'batuhan')),
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists client_tasks_customer_id_idx on public.client_tasks (customer_id, created_at desc);
create index if not exists client_tasks_assigned_to_idx on public.client_tasks (assigned_to, status);

alter table public.client_tasks enable row level security;

drop policy if exists "anon full access" on public.client_tasks;
create policy "anon full access" on public.client_tasks
  for all
  to anon
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- client_ad_reports — bir müşterinin ayı için Meta reklam rakamları (manuel
-- girilir, 1 satır = 1 müşteri x 1 ay).
-- ---------------------------------------------------------------------------
create table if not exists public.client_ad_reports (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  -- O ayın 1'i (bkz. src/lib/content.ts:currentWeekStartIso ile aynı mantık, ama aylık).
  period date not null,
  spend numeric(12, 2),
  note text,
  created_at timestamptz not null default now(),
  unique (customer_id, period)
);

create index if not exists client_ad_reports_customer_id_idx on public.client_ad_reports (customer_id, period desc);

alter table public.client_ad_reports enable row level security;

drop policy if exists "anon full access" on public.client_ad_reports;
create policy "anon full access" on public.client_ad_reports
  for all
  to anon
  using (true)
  with check (true);
