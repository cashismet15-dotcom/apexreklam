-- Mühendis360 borç takibi: kısmi ödemede kalan tutarın ödenmesi için söz
-- verilen tarih. Additive migration.
alter table public.firm_payments add column if not exists expected_remaining_date date;

notify pgrst, 'reload schema';
