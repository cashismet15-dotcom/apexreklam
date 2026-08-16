-- "Yakamoz WhatsApp" — konuşma takibi/müdahale modülü için ekleme migration.
-- Tabloları SİLMEZ — mevcut Supabase projesinde SQL Editor'de
-- (https://supabase.com/dashboard/project/_/sql/new) çalıştırın.
--
-- Bu modül diğer modüllerden bağımsız: Yakamoz'un kendi WhatsApp hattı
-- (Evolution API benzeri bir araçla) üzerinden gelen/giden mesajları
-- yakamoz_jobs'tan bağımsız ayrı kişi/mesaj tablolarında tutar.

create table if not exists public.yakamoz_contacts (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  name text,
  ai_paused boolean not null default false,
  last_message_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists yakamoz_contacts_last_message_at_idx
  on public.yakamoz_contacts (last_message_at desc nulls last);

alter table public.yakamoz_contacts enable row level security;

drop policy if exists "anon full access" on public.yakamoz_contacts;
create policy "anon full access" on public.yakamoz_contacts
  for all
  to anon
  using (true)
  with check (true);

create table if not exists public.yakamoz_wa_messages (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.yakamoz_contacts (id) on delete cascade,
  direction text not null check (direction in ('gelen', 'giden')),
  body text not null,
  external_message_id text,
  created_at timestamptz not null default now()
);

create index if not exists yakamoz_wa_messages_contact_id_idx
  on public.yakamoz_wa_messages (contact_id, created_at);

alter table public.yakamoz_wa_messages enable row level security;

drop policy if exists "anon full access" on public.yakamoz_wa_messages;
create policy "anon full access" on public.yakamoz_wa_messages
  for all
  to anon
  using (true)
  with check (true);
