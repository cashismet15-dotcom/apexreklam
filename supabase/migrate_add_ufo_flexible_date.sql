-- "Ufo Temizlik" — Esnek Tarih (tarih seçmeme) için ekleme (additive) migration.
-- Tabloları SİLMEZ, mevcut kayıtları etkilemez — mevcut Supabase projesinde
-- SQL Editor'de (https://supabase.com/dashboard/project/_/sql/new) çalıştırın.

alter table public.ufo_jobs alter column job_date drop not null;
