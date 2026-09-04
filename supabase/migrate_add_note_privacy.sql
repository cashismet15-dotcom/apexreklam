-- Notlar artık iki türlü: genel (herkes görür) ve kişisel (sadece yazan görür).
-- Mevcut kayıtlar (hepsi paylaşımlıydı) varsayılan false ile genel kalır.

alter table public.panel_notes add column if not exists is_private boolean not null default false;
