-- "Danışan İçerik Takibi" modülü için ekleme (additive) migration.
-- Tabloları SİLMEZ — mevcut Supabase projesinde SQL Editor'de
-- (https://supabase.com/dashboard/project/_/sql/new) çalıştırın.
--
-- Bu modül Muhasebe'deki aynı customers tablosunu kullanır; sadece logo ve
-- kalıcı talimat/not alanları ekler. Haftalık video durumu ayrı bir tabloda
-- (content_weeks) tutulur.

alter table public.customers
  add column if not exists logo_url text,
  add column if not exists content_notes text;

-- ---------------------------------------------------------------------------
-- content_weeks — her müşteri için haftalık video üretim durumu (1 satır =
-- 1 müşteri x 1 hafta).
-- ---------------------------------------------------------------------------
create table if not exists public.content_weeks (
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

create index if not exists content_weeks_customer_id_idx on public.content_weeks (customer_id);
create index if not exists content_weeks_week_start_idx on public.content_weeks (week_start);

alter table public.content_weeks enable row level security;

drop policy if exists "anon full access" on public.content_weeks;
create policy "anon full access" on public.content_weeks
  for all
  to anon
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- Storage — logo yüklemeleri için "client-logos" bucket'ı. Diğer tüm
-- tablolar gibi anon role'e tam erişim veriyoruz (bu app'te login yok,
-- bkz. schema.sql'deki güvenlik notu).
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('client-logos', 'client-logos', true)
on conflict (id) do nothing;

drop policy if exists "anon full access to client-logos" on storage.objects;
create policy "anon full access to client-logos"
  on storage.objects
  for all
  to anon
  using (bucket_id = 'client-logos')
  with check (bucket_id = 'client-logos');
