-- "Hata Takibi" güncellemesi (additive) — Tabloları SİLMEZ, mevcut kayıtları
-- etkilemez. Mevcut Supabase projesinde SQL Editor'de
-- (https://supabase.com/dashboard/project/_/sql/new) çalıştırın.
--
-- 1) assigned_to artık zorunlu değil (atama kavramı kaldırıldı).
-- 2) Görsel (ekran görüntüsü) eklenebilsin diye image_path/image_url.

alter table public.ai_bugs alter column assigned_to drop not null;

alter table public.ai_bugs add column if not exists image_path text;
alter table public.ai_bugs add column if not exists image_url text;
