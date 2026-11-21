-- 1) Funnel: site_basvurulari tablosu (funnel sitesi zaten buraya yazmaya
--    çalışıyor ama tablo hiç oluşturulmamıştı) + her yeni başvuruyu otomatik
--    olarak Firmalar'a "İlk Görüşme" aşamasında ekleyen trigger.
-- 2) Tek seferlik hizmet tahsilatı: firm_services'a vade ve ödendi tarihi.
-- Additive migration — hiçbir tabloyu/kaydı silmez.

-- ---------------------------------------------------------------------------
-- firms.source — firma nereden geldi (elle eklendi / funnel sitesi).
-- ---------------------------------------------------------------------------
alter table public.firms add column if not exists source text not null default 'manuel';

-- ---------------------------------------------------------------------------
-- site_basvurulari — apexfunnelsite/js/script.js'in insert ettiği kolonlarla birebir.
-- ---------------------------------------------------------------------------
create table if not exists public.site_basvurulari (
  id uuid primary key default gen_random_uuid(),
  hizmet text not null,
  ad_soyad text not null,
  firma text not null,
  telefon text not null,
  sehir text not null,
  gorusme_tarihi date,
  gorusme_saati text,
  ekip_sayisi text,
  servis_araci text,
  kaynak text not null default 'apexfunnelsite',
  firm_id uuid references public.firms (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists site_basvurulari_created_at_idx on public.site_basvurulari (created_at desc);

alter table public.site_basvurulari enable row level security;
drop policy if exists "anon full access" on public.site_basvurulari;
create policy "anon full access" on public.site_basvurulari
  for all to anon using (true) with check (true);

-- Her başvuru → firms satırı (İlk Görüşme). security definer: sitenin anon
-- isteği hangi yetkiyle gelirse gelsin firma kaydı açılabilsin.
create or replace function public.site_basvuru_to_firm()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_firm_id uuid;
  about_text text;
begin
  about_text := concat_ws(E'\n',
    'Siteden başvuru (' || coalesce(new.kaynak, 'site') || ')',
    'İlgilendiği hizmet: ' || new.hizmet,
    case when new.gorusme_tarihi is not null
      then 'İstediği görüşme: ' || to_char(new.gorusme_tarihi, 'DD.MM.YYYY') || coalesce(' ' || new.gorusme_saati, '')
    end,
    case when new.ekip_sayisi is not null and new.ekip_sayisi <> '' then 'Ekip: ' || new.ekip_sayisi end,
    case when new.servis_araci is not null and new.servis_araci <> '' then 'Araç: ' || new.servis_araci end
  );

  insert into public.firms (name, contact_name, phone, city, about, stage, created_by, source)
  values (new.firma, new.ad_soyad, new.telefon, new.sehir, about_text, 'ilk_gorusme', 'owner', 'site')
  returning id into new_firm_id;

  new.firm_id := new_firm_id;
  return new;
end;
$$;

drop trigger if exists site_basvuru_to_firm on public.site_basvurulari;
create trigger site_basvuru_to_firm
  before insert on public.site_basvurulari
  for each row execute function public.site_basvuru_to_firm();

-- ---------------------------------------------------------------------------
-- Tek seferlik hizmetler: vade (ilk ödeme tarihi) ve tahsil edildiği tarih.
-- Aylık hizmetlerde kullanılmaz — onlar Muhasebe'deki customers/payments ile takip edilir.
-- ---------------------------------------------------------------------------
alter table public.firm_services add column if not exists due_date date;
alter table public.firm_services add column if not exists paid_at date;

update public.firm_services set due_date = start_date where billing = 'tek_seferlik' and due_date is null;

notify pgrst, 'reload schema';
