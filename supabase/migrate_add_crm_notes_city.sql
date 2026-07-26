-- Müşteri Takip (CRM) — Şehir alanı ve çoklu takip notu için ekleme (additive)
-- migration. Tabloları SİLMEZ, mevcut kayıtları etkilemez — mevcut Supabase
-- projesinde SQL Editor'de
-- (https://supabase.com/dashboard/project/_/sql/new) çalıştırın.
--
-- crm_contacts.notes sütunu duruyor (veri kaybı olmasın diye silinmiyor),
-- sadece artık kullanılmıyor — dolu olan değerler aşağıda ilk takip notu
-- olarak crm_contact_notes'a kopyalanıyor.

alter table public.crm_contacts add column if not exists city text;

create table if not exists public.crm_contact_notes (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.crm_contacts (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists crm_contact_notes_contact_id_idx
  on public.crm_contact_notes (contact_id, created_at);

alter table public.crm_contact_notes enable row level security;

drop policy if exists "anon full access" on public.crm_contact_notes;
create policy "anon full access" on public.crm_contact_notes
  for all
  to anon
  using (true)
  with check (true);

insert into public.crm_contact_notes (contact_id, body, created_at)
select id, notes, created_at from public.crm_contacts
where notes is not null and trim(notes) <> '';
