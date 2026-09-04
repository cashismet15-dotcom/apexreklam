-- Panel > "Hata Takibi" için ekleme (additive) migration. Tabloları SİLMEZ —
-- mevcut Supabase projesinde SQL Editor'de
-- (https://supabase.com/dashboard/project/_/sql/new) çalıştırın.
--
-- Yapay zeka sistemlerindeki hataları takip etmek için — bir müşterinin
-- sistemiyle ilgili olabilir (customer_id doluysa) ya da genel/dahili
-- olabilir (customer_id boş). Görevlerden bağımsız, ayrı bir liste.

create table if not exists public.ai_bugs (
  id uuid primary key default gen_random_uuid(),
  -- Müşteri silinirse hata kaydı kaybolmasın, sadece bağlantısı boşalsın.
  customer_id uuid references public.customers (id) on delete set null,
  title text not null,
  description text,
  severity text not null default 'orta' check (severity in ('kritik', 'orta', 'dusuk')),
  status text not null default 'acik' check (status in ('acik', 'inceleniyor', 'cozuldu')),
  -- Ekip üyesi kimliği — session role'üyle birebir eşleşir (bkz. src/lib/session.ts AppRole).
  assigned_to text not null check (assigned_to in ('owner', 'huseyin', 'batuhan')),
  created_by text not null check (created_by in ('owner', 'huseyin', 'batuhan')),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists ai_bugs_status_idx on public.ai_bugs (status, severity);
create index if not exists ai_bugs_customer_id_idx on public.ai_bugs (customer_id);

alter table public.ai_bugs enable row level security;

drop policy if exists "anon full access" on public.ai_bugs;
create policy "anon full access" on public.ai_bugs
  for all
  to anon
  using (true)
  with check (true);
