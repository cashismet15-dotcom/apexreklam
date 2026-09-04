-- "Dökümanlar" (Günlük Görevler modülü içinde) için ekleme (additive) migration.
-- Tabloları SİLMEZ — mevcut Supabase projesinde SQL Editor'de
-- (https://supabase.com/dashboard/project/_/sql/new) çalıştırın.
--
-- Sunumlar ve belgeler için genel bir dosya deposu. Kategori/klasör ayrımı
-- yok — tek düz liste, en yeni üstte.

-- ---------------------------------------------------------------------------
-- documents — yüklenen dosyaların kaydı.
-- ---------------------------------------------------------------------------
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  file_path text not null,
  file_url text not null,
  file_type text,
  file_size bigint not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists documents_created_at_idx on public.documents (created_at desc);

alter table public.documents enable row level security;

drop policy if exists "anon full access" on public.documents;
create policy "anon full access" on public.documents
  for all
  to anon
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- Storage — döküman yüklemeleri için "documents" bucket'ı. Diğer tüm
-- tablolar gibi anon role'e tam erişim veriyoruz (bu app'te login yok,
-- bkz. schema.sql'deki güvenlik notu).
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

drop policy if exists "anon full access to documents" on storage.objects;
create policy "anon full access to documents"
  on storage.objects
  for all
  to anon
  using (bucket_id = 'documents')
  with check (bucket_id = 'documents');
