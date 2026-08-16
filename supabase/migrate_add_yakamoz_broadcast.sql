-- "Yakamoz Haberleşme" modülü için ekleme (additive) migration.
-- Tabloları SİLMEZ — mevcut Supabase projesinde SQL Editor'de
-- (https://supabase.com/dashboard/project/_/sql/new) çalıştırın.
--
-- Şablonlar, özel gün takvimi ve toplu WhatsApp gönderim geçmişi. Gönderim
-- yakamoz_contacts / yakamoz_wa_messages'ı (Yakamoz WhatsApp modülü) kullanır,
-- burada sadece şablon/takvim/geçmiş verisi tutulur.

create table if not exists public.yakamoz_templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.yakamoz_templates enable row level security;

drop policy if exists "anon full access" on public.yakamoz_templates;
create policy "anon full access" on public.yakamoz_templates
  for all
  to anon
  using (true)
  with check (true);

create table if not exists public.yakamoz_special_days (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  month smallint not null check (month between 1 and 12),
  day smallint not null check (day between 1 and 31),
  template_id uuid references public.yakamoz_templates (id) on delete set null,
  body text,
  last_sent_year smallint,
  created_at timestamptz not null default now()
);

alter table public.yakamoz_special_days enable row level security;

drop policy if exists "anon full access" on public.yakamoz_special_days;
create policy "anon full access" on public.yakamoz_special_days
  for all
  to anon
  using (true)
  with check (true);

create table if not exists public.yakamoz_broadcasts (
  id uuid primary key default gen_random_uuid(),
  title text,
  body text not null,
  recipient_count integer not null default 0,
  success_count integer not null default 0,
  failed_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists yakamoz_broadcasts_created_at_idx on public.yakamoz_broadcasts (created_at desc);

alter table public.yakamoz_broadcasts enable row level security;

drop policy if exists "anon full access" on public.yakamoz_broadcasts;
create policy "anon full access" on public.yakamoz_broadcasts
  for all
  to anon
  using (true)
  with check (true);

-- Hazır şablonlar (isteğe bağlı) — sabit tarihli özel günlerle eşleştirilir.
-- Ramazan/Kurban Bayramı gibi hicri takvime göre kayan günler yok; onları
-- elle eklemen ve her yıl tarihini güncellemen gerekir.
insert into public.yakamoz_templates (title, body) values
  ('Yılbaşı', 'Merhaba {{ad}}, yeni yılınızı kutlar, sağlık ve mutluluk dolu bir yıl dileriz. Yakamoz Halı Yıkama ailesi olarak size hizmet vermekten mutluluk duyarız.'),
  ('Sevgililer Günü', 'Merhaba {{ad}}, 14 Şubat Sevgililer Gününüz kutlu olsun. Evinizi temiz ve ferah bir güne hazırlamak isterseniz buradayız.'),
  ('Kadınlar Günü', 'Merhaba {{ad}}, 8 Mart Dünya Kadınlar Gününüz kutlu olsun.'),
  ('23 Nisan', 'Merhaba {{ad}}, 23 Nisan Ulusal Egemenlik ve Çocuk Bayramı kutlu olsun.'),
  ('Kampanya Duyurusu', 'Merhaba {{ad}}, bu ay halı yıkamada özel kampanyamız var. Detaylar ve randevu için bize yazabilirsiniz.'),
  ('Hizmet Hatırlatma', 'Merhaba {{ad}}, son halı yıkama hizmetinizin üzerinden biraz zaman geçti. Yeniden randevu almak ister misiniz?')
returning id, title;

-- Yukarıdaki insert'in döndürdüğü id'lerle özel günleri eşleştiriyoruz.
insert into public.yakamoz_special_days (title, month, day, template_id)
select 'Yılbaşı', 1, 1, id from public.yakamoz_templates where title = 'Yılbaşı'
union all
select 'Sevgililer Günü', 2, 14, id from public.yakamoz_templates where title = 'Sevgililer Günü'
union all
select 'Kadınlar Günü', 3, 8, id from public.yakamoz_templates where title = 'Kadınlar Günü'
union all
select '23 Nisan', 4, 23, id from public.yakamoz_templates where title = '23 Nisan';
