-- ApexReklam Aylık Tahsilat Takip Sistemi şeması
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql/new).
--
-- This DROPS and recreates customers and payments (the old "jobs" table is gone
-- entirely — this system tracks a fixed monthly fee per customer, not per-project
-- billing). Back up first if you care about existing rows.
--
-- Security note: this app has no login/auth layer and talks to Supabase only with
-- the public anon key. The RLS policies below intentionally grant the anon role
-- full CRUD so the app works without auth. If you ever add user accounts, tighten
-- these policies (e.g. scope rows by auth.uid()) before relying on RLS for real
-- access control.

drop table if exists public.payments cascade;
drop table if exists public.jobs cascade;
drop table if exists public.customers cascade;

-- ---------------------------------------------------------------------------
-- customers — one row per recurring-billing client
-- ---------------------------------------------------------------------------
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text not null,
  phone text not null,
  monthly_fee numeric(12, 2) not null check (monthly_fee > 0),
  payment_day smallint not null check (payment_day between 1 and 31),
  status text not null default 'aktif' check (status in ('aktif', 'pasif', 'donduruldu')),
  start_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now(),
  -- Aktif dondurmanın başladığı tarih; sadece status = 'donduruldu' iken dolu.
  frozen_since date,
  -- Bugüne kadar biriken toplam dondurma günü; ödeme vadeleri hesaplanırken
  -- bu kadar ileri kaydırılır (bkz. src/lib/collections.ts:addDaysIso).
  freeze_offset_days integer not null default 0,
  -- Danışan İçerik Takibi modülü: logo ve kalıcı video talimatları/notları.
  logo_url text,
  content_notes text
);

create index customers_status_idx on public.customers (status);
create index customers_created_at_idx on public.customers (created_at desc);

alter table public.customers enable row level security;

create policy "anon full access" on public.customers
  for all
  to anon
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- payments — each row is money actually received, tagged to the billing
-- month/year it counts toward (which may differ from payment_date, e.g. a
-- late payment received in the following month for the prior month's fee).
-- ---------------------------------------------------------------------------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  payment_date date not null default current_date,
  month smallint not null check (month between 1 and 12),
  year smallint not null check (year between 2000 and 2100),
  note text,
  -- Set when this row is a partial/deposit (kapora) payment: the date the
  -- remaining balance for this month is expected to be collected.
  expected_remaining_date date,
  created_at timestamptz not null default now()
);

create index payments_customer_id_idx on public.payments (customer_id);
create index payments_month_year_idx on public.payments (year, month);
create index payments_payment_date_idx on public.payments (payment_date);

alter table public.payments enable row level security;

create policy "anon full access" on public.payments
  for all
  to anon
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- content_weeks — Danışan İçerik Takibi: her müşteri için haftalık video
-- üretim durumu (1 satır = 1 müşteri x 1 hafta).
-- ---------------------------------------------------------------------------
create table public.content_weeks (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  -- O haftanın Pazartesi'si (bkz. src/lib/content.ts:currentWeekStartIso).
  week_start date not null,
  status text not null default 'talimat_bekliyor'
    check (status in ('talimat_bekliyor', 'hazirlaniyor', 'onayda', 'yayinlandi')),
  note text,
  video_url text,
  created_at timestamptz not null default now(),
  unique (customer_id, week_start)
);

create index content_weeks_customer_id_idx on public.content_weeks (customer_id);
create index content_weeks_week_start_idx on public.content_weeks (week_start);

alter table public.content_weeks enable row level security;

create policy "anon full access" on public.content_weeks
  for all
  to anon
  using (true)
  with check (true);

-- Logo yüklemeleri için Storage bucket'ı.
insert into storage.buckets (id, name, public)
values ('client-logos', 'client-logos', true)
on conflict (id) do nothing;

create policy "anon full access to client-logos"
  on storage.objects
  for all
  to anon
  using (bucket_id = 'client-logos')
  with check (bucket_id = 'client-logos');

-- ---------------------------------------------------------------------------
-- ufo_jobs — Ufo Temizlik: Apex'ten bağımsız ikinci gelir kaynağı (ev temizliği /
-- koltuk yıkama) için iş ve ciro takibi. Bu CRM'in bir parçası değil.
-- ---------------------------------------------------------------------------
create table public.ufo_jobs (
  id uuid primary key default gen_random_uuid(),
  record_type text not null default 'is' check (record_type in ('randevu', 'is')),
  category text not null check (category in ('ev_temizligi', 'koltuk_yikama')),
  cleaning_type text check (cleaning_type in ('dolu_ev', 'kiraci_sonrasi', 'insaat_sonrasi')),
  home_type text check (home_type in ('1+1', '2+1', '3+1', '4+1', '5+1')),
  location text,
  customer_name text,
  customer_phone text,
  amount numeric not null default 0,
  commission_amount numeric not null default 0,
  job_date date not null default current_date,
  job_time time,
  status text not null default 'bekliyor' check (status in ('bekliyor', 'tamamlandi', 'iptal')),
  note text,
  created_at timestamptz not null default now()
);

create index ufo_jobs_job_date_idx on public.ufo_jobs (job_date desc);
create index ufo_jobs_status_idx on public.ufo_jobs (status);
create index ufo_jobs_record_type_idx on public.ufo_jobs (record_type);

alter table public.ufo_jobs enable row level security;

create policy "anon full access" on public.ufo_jobs
  for all
  to anon
  using (true)
  with check (true);
