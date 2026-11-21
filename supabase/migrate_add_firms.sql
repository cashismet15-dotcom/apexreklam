-- Mühendislik firmaları yapısı: Firmalar (funnel aşamalı), firma notları,
-- Hizmet kataloğu ve firmaların aldığı hizmetler.
-- Additive migration — hiçbir tabloyu SİLMEZ, mevcut muhasebe kayıtlarını
-- etkilemez. customers tablosuna sadece boş (nullable) bir firm_id kolonu ekler.
-- Supabase Dashboard > SQL Editor'de çalıştırın.

-- ---------------------------------------------------------------------------
-- firms — her mühendislik firması için bir satır (aday veya müşteri).
-- stage: ilk_gorusme -> teklif_verildi -> olumlu | olumsuz
-- olumlu olunca Muhasebe'de bir customers satırı açılır (customers.firm_id).
-- ---------------------------------------------------------------------------
create table if not exists public.firms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  phone text,
  city text,
  -- Firmanın kendi verdiği hizmetler (statik proje, zemin etüdü vb.) — serbest metin.
  firm_services text,
  website text,
  instagram text,
  linkedin text,
  facebook text,
  -- "Hakkında / İlk tanışma görüşmesi" notu.
  about text,
  stage text not null default 'ilk_gorusme'
    check (stage in ('ilk_gorusme', 'teklif_verildi', 'olumlu', 'olumsuz')),
  stage_changed_at timestamptz not null default now(),
  created_by text not null check (created_by in ('owner', 'huseyin', 'batuhan')),
  created_at timestamptz not null default now()
);

create index if not exists firms_stage_idx on public.firms (stage);
create index if not exists firms_created_at_idx on public.firms (created_at desc);

alter table public.firms enable row level security;
drop policy if exists "anon full access" on public.firms;
create policy "anon full access" on public.firms
  for all to anon using (true) with check (true);

-- ---------------------------------------------------------------------------
-- firm_notes — firma hakkında üst üste biriken tarihli notlar.
-- ---------------------------------------------------------------------------
create table if not exists public.firm_notes (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms (id) on delete cascade,
  body text not null,
  author text not null check (author in ('owner', 'huseyin', 'batuhan')),
  created_at timestamptz not null default now()
);

create index if not exists firm_notes_firm_id_idx on public.firm_notes (firm_id, created_at desc);

alter table public.firm_notes enable row level security;
drop policy if exists "anon full access" on public.firm_notes;
create policy "anon full access" on public.firm_notes
  for all to anon using (true) with check (true);

-- ---------------------------------------------------------------------------
-- services — bizim verdiğimiz hizmetler kataloğu ve fiyatları.
-- billing: aylik (her ay tahsil edilir) | tek_seferlik
-- ---------------------------------------------------------------------------
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(12, 2) not null check (price >= 0),
  billing text not null default 'aylik' check (billing in ('aylik', 'tek_seferlik')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.services enable row level security;
drop policy if exists "anon full access" on public.services;
create policy "anon full access" on public.services
  for all to anon using (true) with check (true);

-- ---------------------------------------------------------------------------
-- firm_services — bir firmanın aldığı hizmetler. Fiyat katalogdan kopyalanır
-- ama firmaya özel değiştirilebilir (indirim vb.); katalog fiyatı sonradan
-- değişse bile eski anlaşmalar bozulmaz.
-- ---------------------------------------------------------------------------
create table if not exists public.firm_services (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms (id) on delete cascade,
  service_id uuid references public.services (id) on delete set null,
  name text not null,
  price numeric(12, 2) not null check (price >= 0),
  billing text not null check (billing in ('aylik', 'tek_seferlik')),
  start_date date not null,
  created_at timestamptz not null default now()
);

create index if not exists firm_services_firm_id_idx on public.firm_services (firm_id);

alter table public.firm_services enable row level security;
drop policy if exists "anon full access" on public.firm_services;
create policy "anon full access" on public.firm_services
  for all to anon using (true) with check (true);

-- ---------------------------------------------------------------------------
-- customers.firm_id — Muhasebe kaydını firmaya bağlar (eski kayıtlarda boş).
-- ---------------------------------------------------------------------------
alter table public.customers
  add column if not exists firm_id uuid references public.firms (id) on delete set null;

create index if not exists customers_firm_id_idx on public.customers (firm_id);
