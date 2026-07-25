-- "Ufo Temizlik" — iş/randevu saati için ekleme (additive) migration.
-- Tabloları SİLMEZ, mevcut kayıtları etkilemez (job_time null kalır) —
-- mevcut Supabase projesinde SQL Editor'de
-- (https://supabase.com/dashboard/project/_/sql/new) çalıştırın.

alter table public.ufo_jobs add column if not exists job_time time;
