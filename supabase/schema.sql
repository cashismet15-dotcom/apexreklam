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
  status text not null default 'aktif' check (status in ('aktif', 'pasif')),
  start_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
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
