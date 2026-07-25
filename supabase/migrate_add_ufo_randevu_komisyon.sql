-- "Ufo Temizlik" — Randevu tipi ve Komisyon Tutarı için ekleme (additive) migration.
-- Tabloları SİLMEZ, mevcut kayıtları etkilemez — mevcut Supabase projesinde SQL
-- Editor'de (https://supabase.com/dashboard/project/_/sql/new) çalıştırın.
--
-- record_type: 'randevu' (henüz kesinleşmemiş, her zaman durumu Bekliyor kalır)
-- veya 'is' (gerçek iş). Mevcut kayıtların hepsi varsayılan olarak 'is' sayılır.
-- commission_amount: müşteriyi getiren aracıya/platforma ödenen komisyon tutarı.

alter table public.ufo_jobs
  add column if not exists record_type text not null default 'is'
    check (record_type in ('randevu', 'is')),
  add column if not exists commission_amount numeric not null default 0;

create index if not exists ufo_jobs_record_type_idx on public.ufo_jobs (record_type);
