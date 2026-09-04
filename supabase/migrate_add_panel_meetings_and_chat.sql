-- Panel > "Toplantılar" ve "Sohbet" için ekleme (additive) migration.
-- Tabloları SİLMEZ — mevcut Supabase projesinde SQL Editor'de
-- (https://supabase.com/dashboard/project/_/sql/new) çalıştırın.

-- ---------------------------------------------------------------------------
-- panel_meetings — basit toplantı kaydı (gerçek video görüşmesi bu sistemde
-- olmaz, sadece kayıt + görünürlük; opsiyonel bir link alanı ile Meet/Zoom
-- gibi harici bir linke işaret edebilir).
-- ---------------------------------------------------------------------------
create table if not exists public.panel_meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  meeting_at timestamptz not null,
  note text,
  link text,
  -- Ekip üyesi kimlikleri — session role'üyle birebir eşleşir.
  participants text[] not null default '{}'
    check (participants <@ array['owner', 'huseyin', 'batuhan']),
  created_by text not null check (created_by in ('owner', 'huseyin', 'batuhan')),
  created_at timestamptz not null default now()
);

create index if not exists panel_meetings_meeting_at_idx on public.panel_meetings (meeting_at);

alter table public.panel_meetings enable row level security;

drop policy if exists "anon full access" on public.panel_meetings;
create policy "anon full access" on public.panel_meetings
  for all
  to anon
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- panel_messages — tek kanallı, paylaşımlı ekip sohbeti (basit, sayfa
-- yenilendiğinde güncellenir — gerçek zamanlı değil).
-- ---------------------------------------------------------------------------
create table if not exists public.panel_messages (
  id uuid primary key default gen_random_uuid(),
  author text not null check (author in ('owner', 'huseyin', 'batuhan')),
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists panel_messages_created_at_idx on public.panel_messages (created_at desc);

alter table public.panel_messages enable row level security;

drop policy if exists "anon full access" on public.panel_messages;
create policy "anon full access" on public.panel_messages
  for all
  to anon
  using (true)
  with check (true);
