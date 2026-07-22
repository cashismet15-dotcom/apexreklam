-- Apex Müşteri Takip (CRM) şeması — WhatsApp üzerinden gelen müşteri/lead takibi.
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql/new).
-- This is additive — it does not touch the muhasebe (customers/payments) tables.
--
-- Security note: same as the muhasebe schema — RLS grants the anon role full
-- CRUD since this app has no login layer yet. Tighten before relying on RLS
-- for real access control if you ever add user accounts.

-- ---------------------------------------------------------------------------
-- crm_contacts — one row per WhatsApp contact/lead
-- ---------------------------------------------------------------------------
create table public.crm_contacts (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  name text,
  notes text,
  last_message_at timestamptz,
  created_at timestamptz not null default now()
);

create index crm_contacts_last_message_at_idx on public.crm_contacts (last_message_at desc nulls last);

alter table public.crm_contacts enable row level security;

create policy "anon full access" on public.crm_contacts
  for all
  to anon
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- crm_messages — WhatsApp mesaj geçmişi (gelen = müşteriden, giden = bizden)
-- ---------------------------------------------------------------------------
create table public.crm_messages (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.crm_contacts (id) on delete cascade,
  direction text not null check (direction in ('gelen', 'giden')),
  body text not null,
  whatsapp_message_id text,
  created_at timestamptz not null default now()
);

create index crm_messages_contact_id_idx on public.crm_messages (contact_id, created_at);

alter table public.crm_messages enable row level security;

create policy "anon full access" on public.crm_messages
  for all
  to anon
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- crm_quick_replies — tek tık gönderilebilen hazır mesaj şablonları
-- (örn. web sitesi linki, sosyal medya linki). Ayarlar sayfasından yönetilir.
-- ---------------------------------------------------------------------------
create table public.crm_quick_replies (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now()
);

alter table public.crm_quick_replies enable row level security;

create policy "anon full access" on public.crm_quick_replies
  for all
  to anon
  using (true)
  with check (true);

-- Başlangıç şablonları — linkleri sonra Ayarlar sayfasından düzenleyebilirsin.
insert into public.crm_quick_replies (title, message, sort_order) values
  ('Web Sitemiz', 'Web sitemiz: https://ornek-website.com', 1),
  ('Sosyal Medya', 'Instagram: https://instagram.com/ornek', 2);
