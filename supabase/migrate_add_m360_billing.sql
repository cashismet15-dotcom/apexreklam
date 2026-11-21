-- Mühendis360 muhasebesi — eski işletmenin Muhasebe'sinden (customers/payments)
-- tamamen ayrı. Additive migration, hiçbir şeyi silmez.
--
-- Aylık ücret = firmanın aldığı aylık hizmetlerin (firm_services) toplamı.
-- Vade: firms.payment_day (her ayın X'i), tahsilat firms.billing_start'tan başlar.
-- Alınan her para firm_payments'a yazılır (aylık için period, tek seferlik için firm_service_id).

alter table public.firms add column if not exists payment_day smallint
  check (payment_day between 1 and 31);
alter table public.firms add column if not exists billing_start date;

create table if not exists public.firm_payments (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms (id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  payment_date date not null default current_date,
  -- Aylık ödeme: hangi ayın ücreti (o ayın 1'i). Tek seferlikte null.
  period date,
  -- Tek seferlik hizmet tahsilatı ise ilgili hizmet.
  firm_service_id uuid references public.firm_services (id) on delete cascade,
  note text,
  created_at timestamptz not null default now(),
  check ((period is null) <> (firm_service_id is null))
);

create index if not exists firm_payments_firm_id_idx on public.firm_payments (firm_id);
create index if not exists firm_payments_payment_date_idx on public.firm_payments (payment_date desc);
create index if not exists firm_payments_period_idx on public.firm_payments (period);

alter table public.firm_payments enable row level security;
drop policy if exists "anon full access" on public.firm_payments;
create policy "anon full access" on public.firm_payments
  for all to anon using (true) with check (true);

notify pgrst, 'reload schema';
