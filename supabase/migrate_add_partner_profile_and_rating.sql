-- Taşeron firma profili (vergi/iletişim bilgileri + vergi levhası), iş puanlaması
-- ve sözleşme onay kaydı için ekleme (additive) migration. Tabloları SİLMEZ,
-- mevcut kayıtları etkilemez. Mevcut Supabase projesinde SQL Editor'de
-- (https://supabase.com/dashboard/project/_/sql/new) çalıştırın.

alter table public.partner_companies add column tax_id text;
alter table public.partner_companies add column tax_office text;
alter table public.partner_companies add column address text;
alter table public.partner_companies add column contact_name text;
alter table public.partner_companies add column contact_phone text;
alter table public.partner_companies add column tax_document_url text;

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
