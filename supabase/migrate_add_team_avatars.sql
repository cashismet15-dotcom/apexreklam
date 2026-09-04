-- Panel > Profil resmi için ekleme (additive) migration. Tabloları SİLMEZ.
-- Gerçek bir kullanıcılar tablosu yok, her rol (owner/huseyin/batuhan) için
-- tek bir profil resmi kaydı tutulur.

create table if not exists public.team_avatars (
  role text primary key check (role in ('owner', 'huseyin', 'batuhan')),
  -- Storage'dan silmek için gerekli.
  avatar_path text,
  avatar_url text,
  updated_at timestamptz not null default now()
);

alter table public.team_avatars enable row level security;

drop policy if exists "anon full access" on public.team_avatars;
create policy "anon full access" on public.team_avatars
  for all
  to anon
  using (true)
  with check (true);
