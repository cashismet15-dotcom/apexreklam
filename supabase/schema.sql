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
-- daily_habits / daily_habit_logs — Günlük Takip: müşteri/CRM'den bağımsız,
-- kişisel günlük görev (spor, diyet vb.) takibi ve haftalık rapor.
-- ---------------------------------------------------------------------------
create table public.daily_habits (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index daily_habits_active_idx on public.daily_habits (active, sort_order);

alter table public.daily_habits enable row level security;

create policy "anon full access" on public.daily_habits
  for all
  to anon
  using (true)
  with check (true);

create table public.daily_habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.daily_habits (id) on delete cascade,
  log_date date not null,
  done boolean not null default true,
  created_at timestamptz not null default now(),
  unique (habit_id, log_date)
);

create index daily_habit_logs_habit_id_idx on public.daily_habit_logs (habit_id);
create index daily_habit_logs_log_date_idx on public.daily_habit_logs (log_date);

alter table public.daily_habit_logs enable row level security;

create policy "anon full access" on public.daily_habit_logs
  for all
  to anon
  using (true)
  with check (true);

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
  job_date date default current_date,
  job_time time,
  status text not null default 'bekliyor' check (status in ('bekliyor', 'tamamlandi', 'iptal')),
  note text,
  open_to_partners boolean not null default false,
  partner_taken_at timestamptz,
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

-- ---------------------------------------------------------------------------
-- partner_companies — Ufo Temizlik'in iş verdiği taşeron (alt) firmalar. Her
-- firmanın kendi giriş hesabı olur; sadece open_to_partners=true işaretli
-- ufo_jobs kayıtlarını (havuz) görebilirler.
-- ---------------------------------------------------------------------------
create table public.partner_companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  username text not null unique,
  passcode_hash text not null,
  active boolean not null default true,
  tax_id text,
  tax_office text,
  address text,
  contact_name text,
  contact_phone text,
  tax_document_url text,
  balance numeric not null default 0,
  created_at timestamptz not null default now()
);

alter table public.partner_companies enable row level security;

create policy "anon full access" on public.partner_companies
  for all
  to anon
  using (true)
  with check (true);

alter table public.ufo_jobs add column taken_by_partner_id uuid references public.partner_companies(id) on delete set null;
alter table public.ufo_jobs add column partner_rating smallint check (partner_rating between 1 and 10);
alter table public.ufo_jobs add column partner_terms_version text;

-- Vergi levhası yüklemeleri için Storage bucket'ı.
insert into storage.buckets (id, name, public)
values ('partner-documents', 'partner-documents', true)
on conflict (id) do nothing;

create policy "anon full access to partner-documents"
  on storage.objects
  for all
  to anon
  using (bucket_id = 'partner-documents')
  with check (bucket_id = 'partner-documents');

-- ---------------------------------------------------------------------------
-- partner_transactions — taşeron cüzdan hareketleri (bakiye yükleme, komisyon
-- kesintisi, owner düzeltmesi).
-- ---------------------------------------------------------------------------
create table public.partner_transactions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.partner_companies(id) on delete cascade,
  type text not null check (type in ('topup', 'commission', 'adjustment')),
  amount numeric not null,
  job_id uuid references public.ufo_jobs(id) on delete set null,
  status text not null default 'completed' check (status in ('pending', 'completed', 'failed')),
  iyzico_token text,
  iyzico_payment_id text,
  note text,
  created_at timestamptz not null default now()
);

create index partner_transactions_company_id_idx on public.partner_transactions (company_id);

alter table public.partner_transactions enable row level security;

create policy "anon full access" on public.partner_transactions
  for all
  to anon
  using (true)
  with check (true);

create or replace function public.take_partner_job(p_job_id uuid, p_company_id uuid, p_terms_version text)
returns table(ok boolean, message text) language plpgsql as $$
declare
  v_taken uuid;
  v_commission numeric;
  v_balance numeric;
begin
  select taken_by_partner_id, commission_amount into v_taken, v_commission
    from public.ufo_jobs where id = p_job_id for update;

  if v_taken is not null then
    return query select false, 'Bu iş zaten alınmış.';
    return;
  end if;

  select balance into v_balance from public.partner_companies where id = p_company_id for update;

  if v_balance < v_commission then
    return query select false, format('Bakiyeniz yetersiz. Gereken komisyon: %s TL, bakiyeniz: %s TL.', v_commission, v_balance);
    return;
  end if;

  update public.ufo_jobs
    set taken_by_partner_id = p_company_id,
        partner_taken_at = now(),
        partner_terms_version = p_terms_version
    where id = p_job_id;

  update public.partner_companies set balance = balance - v_commission where id = p_company_id;

  insert into public.partner_transactions (company_id, type, amount, job_id, note)
    values (p_company_id, 'commission', -v_commission, p_job_id, 'İş komisyonu');

  return query select true, 'İşi aldınız.';
end;
$$;

create or replace function public.complete_partner_topup(p_transaction_id uuid)
returns table(ok boolean, company_id uuid, amount numeric) language plpgsql as $$
declare
  v_company uuid;
  v_amount numeric;
begin
  update public.partner_transactions set status = 'completed'
    where id = p_transaction_id and status = 'pending'
    returning company_id, amount into v_company, v_amount;

  if v_company is null then
    return query select false, null::uuid, null::numeric;
    return;
  end if;

  update public.partner_companies set balance = balance + v_amount where id = v_company;

  return query select true, v_company, v_amount;
end;
$$;
