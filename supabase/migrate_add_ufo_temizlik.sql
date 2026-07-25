-- "Ufo Temizlik" modülü için ekleme (additive) migration.
-- Tabloları SİLMEZ — mevcut Supabase projesinde SQL Editor'de
-- (https://supabase.com/dashboard/project/_/sql/new) çalıştırın.
--
-- Bu modül Apex muhasebesinden bağımsız: ev temizliği / koltuk yıkama
-- hizmetlerinden gelen iş ve ciro takibi için, kendi ayrı geliri.

create table if not exists public.ufo_jobs (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('ev_temizligi', 'koltuk_yikama')),
  cleaning_type text check (cleaning_type in ('dolu_ev', 'kiraci_sonrasi', 'insaat_sonrasi')),
  home_type text check (home_type in ('1+1', '2+1', '3+1', '4+1', '5+1')),
  location text,
  customer_name text,
  customer_phone text,
  amount numeric not null default 0,
  job_date date not null default current_date,
  status text not null default 'bekliyor' check (status in ('bekliyor', 'tamamlandi', 'iptal')),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists ufo_jobs_job_date_idx on public.ufo_jobs (job_date desc);
create index if not exists ufo_jobs_status_idx on public.ufo_jobs (status);

alter table public.ufo_jobs enable row level security;

drop policy if exists "anon full access" on public.ufo_jobs;
create policy "anon full access" on public.ufo_jobs
  for all
  to anon
  using (true)
  with check (true);
