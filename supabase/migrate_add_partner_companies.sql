-- Taşeron (alt) firmalar için hesap tablosu + ufo_jobs üzerinde iş havuzu alanları.
-- Additive migration — tabloları SİLMEZ, mevcut kayıtları etkilemez. Mevcut Supabase
-- projesinde SQL Editor'de (https://supabase.com/dashboard/project/_/sql/new) çalıştırın.

create table public.partner_companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  username text not null unique,
  passcode_hash text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.partner_companies enable row level security;

create policy "anon full access" on public.partner_companies
  for all
  to anon
  using (true)
  with check (true);

alter table public.ufo_jobs add column open_to_partners boolean not null default false;
alter table public.ufo_jobs add column taken_by_partner_id uuid references public.partner_companies(id) on delete set null;
alter table public.ufo_jobs add column partner_taken_at timestamptz;
