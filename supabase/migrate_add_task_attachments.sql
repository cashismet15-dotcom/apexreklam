-- Panel görevlerine ek (dosya veya link) için ekleme (additive) migration.
-- Tabloları SİLMEZ — mevcut Supabase projesinde SQL Editor'de
-- (https://supabase.com/dashboard/project/_/sql/new) çalıştırın.
--
-- İki tür ek: 'dosya' (küçük dosyalar — sunum/PDF, mevcut "documents" Storage
-- bucket'ına yüklenir, 25MB sınırı) ve 'link' (büyük videolar için Google
-- Drive/YouTube gibi bir dış linke işaret eder — dosya boyutu sınırı yok).

create table if not exists public.client_task_attachments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.client_tasks (id) on delete cascade,
  kind text not null check (kind in ('dosya', 'link')),
  label text not null,
  url text not null,
  -- Sadece kind='dosya' için doludur — Storage'dan silmek için gerekli.
  file_path text,
  file_size bigint,
  created_at timestamptz not null default now()
);

create index if not exists client_task_attachments_task_id_idx
  on public.client_task_attachments (task_id, created_at desc);

alter table public.client_task_attachments enable row level security;

drop policy if exists "anon full access" on public.client_task_attachments;
create policy "anon full access" on public.client_task_attachments
  for all
  to anon
  using (true)
  with check (true);
