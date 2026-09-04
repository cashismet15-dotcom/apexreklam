-- Panel > "Potansiyel Müşteriler" için ekleme (additive) migration. Tabloları
-- SİLMEZ. Henüz müşteri olmamış, takip edilen aday kişi/şirketler — customers
-- tablosundan tamamen ayrı, faturalandırmaya hiç dokunmaz.

create table if not exists public.panel_leads (
  id uuid primary key default gen_random_uuid(),
  name text,
  phone text not null,
  note text,
  -- Ekip üyesi kimliği — session role'üyle birebir eşleşir.
  created_by text not null check (created_by in ('owner', 'huseyin', 'batuhan')),
  created_at timestamptz not null default now()
);

create index if not exists panel_leads_created_at_idx on public.panel_leads (created_at desc);

alter table public.panel_leads enable row level security;

drop policy if exists "anon full access" on public.panel_leads;
create policy "anon full access" on public.panel_leads
  for all
  to anon
  using (true)
  with check (true);
