-- Dökümanlar/Sunumlar için ekleme (additive) migration. Tabloları SİLMEZ —
-- mevcut Supabase projesinde SQL Editor'de
-- (https://supabase.com/dashboard/project/_/sql/new) çalıştırın.
--
-- Panel'deki "Sunumlar" genel (şirkete bağlı olmayan) bir sunum kütüphanesi
-- oldu — aynı documents tablosunu/bucket'ını kullanıyor, sadece isim
-- (documents.name) yanında bir de not alanı gerekiyor.

alter table public.documents add column if not exists note text;
