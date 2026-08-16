-- "Yakamoz Halı Yıkama" modülü için ekleme (additive) migration.
-- Tabloları SİLMEZ — mevcut Supabase projesinde SQL Editor'de
-- (https://supabase.com/dashboard/project/_/sql/new) çalıştırın.
--
-- Bu modül diğer modüllerden bağımsız: halı yıkama firmasının müşteri,
-- randevu ve kurye/servis takibi için. İleride WhatsApp YZ asistanı
-- POST /api/orders üzerinden buraya otomatik kayıt düşecek.

create table if not exists public.yakamoz_jobs (
  id uuid primary key default gen_random_uuid(),
  customer_name text,
  phone text not null,
  address_text text,
  lat numeric,
  lng numeric,
  il text not null default 'İstanbul',
  ilce text not null,
  mahalle text,
  price_per_m2 numeric,
  requested_date date,
  requested_time time,
  status text not null default 'siparis_alindi'
    check (status in ('siparis_alindi', 'yikamada', 'bitti', 'yolda')),
  status_changed_at timestamptz not null default now(),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists yakamoz_jobs_ilce_idx on public.yakamoz_jobs (ilce);
create index if not exists yakamoz_jobs_status_idx on public.yakamoz_jobs (status);
create index if not exists yakamoz_jobs_created_at_idx on public.yakamoz_jobs (created_at desc);

alter table public.yakamoz_jobs enable row level security;

drop policy if exists "anon full access" on public.yakamoz_jobs;
create policy "anon full access" on public.yakamoz_jobs
  for all
  to anon
  using (true)
  with check (true);

-- Her durum değişikliğinin ne zaman yapıldığının log'u.
create table if not exists public.yakamoz_status_log (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.yakamoz_jobs (id) on delete cascade,
  status text not null
    check (status in ('siparis_alindi', 'yikamada', 'bitti', 'yolda')),
  changed_at timestamptz not null default now()
);

create index if not exists yakamoz_status_log_job_id_idx on public.yakamoz_status_log (job_id);

alter table public.yakamoz_status_log enable row level security;

drop policy if exists "anon full access" on public.yakamoz_status_log;
create policy "anon full access" on public.yakamoz_status_log
  for all
  to anon
  using (true)
  with check (true);

-- Örnek veri (isteğe bağlı) — Avcılar, Beylikdüzü, Esenyurt, Başakşehir'den
-- birkaç mahalle ve örnek randevu/iş. Test/demo amaçlı; istemiyorsanız bu
-- bloğu çalıştırmayın. Tekrar çalıştırırsanız kayıtlar tekrar eklenir
-- (id her seferinde yeni üretilir), o yüzden yalnızca bir kez çalıştırın.
insert into public.yakamoz_jobs
  (customer_name, phone, ilce, mahalle, requested_date, requested_time, price_per_m2, status, note)
values
  ('Ayşe Yılmaz', '05551112233', 'Avcılar', 'Merkez', current_date + 1, '10:00', 45, 'siparis_alindi', null),
  ('Mehmet Kaya', '05552223344', 'Avcılar', 'Firuzköy', current_date + 1, '13:30', 45, 'yikamada', null),
  (null, '05553334455', 'Beylikdüzü', 'Yakuplu', current_date + 2, '11:00', 50, 'siparis_alindi', 'YZ asistanı üzerinden geldi'),
  ('Fatma Demir', '05554445566', 'Beylikdüzü', 'Barış', current_date, '09:00', 50, 'yolda', null),
  ('Ali Şahin', '05555556677', 'Esenyurt', 'Cumhuriyet', current_date, '15:00', 40, 'bitti', null),
  (null, '05556667788', 'Esenyurt', 'Yenikent', current_date + 3, '12:00', 40, 'siparis_alindi', null),
  ('Zeynep Arslan', '05557778899', 'Başakşehir', 'Bahçeşehir', current_date + 1, '16:00', 55, 'siparis_alindi', null),
  ('Can Öztürk', '05558889900', 'Başakşehir', 'Kayabaşı', current_date, '14:00', 55, 'yikamada', null);
