-- Panel > "Notlar" için ekleme (additive) migration. Tabloları SİLMEZ —
-- mevcut Supabase projesinde SQL Editor'de
-- (https://supabase.com/dashboard/project/_/sql/new) çalıştırın.
--
-- Basit, paylaşımlı bir günlük not defteri — kim yazdıysa etiketiyle görünür,
-- tarihe göre gruplanır (bkz. src/lib/panel.ts groupNotesByDay).

create table if not exists public.panel_notes (
  id uuid primary key default gen_random_uuid(),
  -- Ekip üyesi kimliği — session role'üyle birebir eşleşir (bkz. src/lib/session.ts AppRole).
  author text not null check (author in ('owner', 'huseyin', 'batuhan')),
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists panel_notes_created_at_idx on public.panel_notes (created_at desc);

alter table public.panel_notes enable row level security;

drop policy if exists "anon full access" on public.panel_notes;
create policy "anon full access" on public.panel_notes
  for all
  to anon
  using (true)
  with check (true);
