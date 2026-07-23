-- Müşteri "dondurma" (freeze/pause) özelliği için ekleme (additive) migration.
-- schema.sql'in aksine bu dosya tabloları SİLMEZ — mevcut Supabase projesinde
-- SQL Editor'de (https://supabase.com/dashboard/project/_/sql/new) çalıştırın.

alter table public.customers
  add column if not exists frozen_since date,
  add column if not exists freeze_offset_days integer not null default 0;

alter table public.customers
  drop constraint if exists customers_status_check;

alter table public.customers
  add constraint customers_status_check check (status in ('aktif', 'pasif', 'donduruldu'));
