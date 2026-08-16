-- Taşeron cüzdanı: bakiye, işlem geçmişi, ve atomik "iş al" / "bakiye yükleme onayı"
-- fonksiyonları. Additive migration — tabloları SİLMEZ, mevcut kayıtları etkilemez.
-- Mevcut Supabase projesinde SQL Editor'de
-- (https://supabase.com/dashboard/project/_/sql/new) çalıştırın.

alter table public.partner_companies add column balance numeric not null default 0;

create table public.partner_transactions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.partner_companies(id) on delete cascade,
  type text not null check (type in ('topup', 'commission', 'adjustment')),
  amount numeric not null, -- topup/adjustment(+): pozitif, commission/adjustment(-): negatif
  job_id uuid references public.ufo_jobs(id) on delete set null,
  status text not null default 'completed' check (status in ('pending', 'completed', 'failed')),
  iyzico_token text,
  iyzico_payment_id text,
  note text,
  created_at timestamptz not null default now()
);

create index partner_transactions_company_id_idx on public.partner_transactions (company_id);

alter table public.partner_transactions enable row level security;

create policy "anon full access" on public.partner_transactions
  for all
  to anon
  using (true)
  with check (true);

-- Atomik iş alma: bakiye kontrolü + düşme + iş atama tek transaction'da olur, iki
-- firmanın aynı işi ya da aynı firmanın bakiyesini aynı anda yarışarak
-- alması/düşmesi engellenir.
create or replace function public.take_partner_job(p_job_id uuid, p_company_id uuid, p_terms_version text)
returns table(ok boolean, message text) language plpgsql as $$
declare
  v_taken uuid;
  v_commission numeric;
  v_balance numeric;
begin
  select taken_by_partner_id, commission_amount into v_taken, v_commission
    from public.ufo_jobs where id = p_job_id for update;

  if v_taken is not null then
    return query select false, 'Bu iş zaten alınmış.';
    return;
  end if;

  select balance into v_balance from public.partner_companies where id = p_company_id for update;

  if v_balance < v_commission then
    return query select false, format('Bakiyeniz yetersiz. Gereken komisyon: %s TL, bakiyeniz: %s TL.', v_commission, v_balance);
    return;
  end if;

  update public.ufo_jobs
    set taken_by_partner_id = p_company_id,
        partner_taken_at = now(),
        partner_terms_version = p_terms_version
    where id = p_job_id;

  update public.partner_companies set balance = balance - v_commission where id = p_company_id;

  insert into public.partner_transactions (company_id, type, amount, job_id, note)
    values (p_company_id, 'commission', -v_commission, p_job_id, 'İş komisyonu');

  return query select true, 'İşi aldınız.';
end;
$$;

-- Atomik bakiye yükleme onayı (iyzico callback'inde çağrılır) — aynı transaction'ın
-- iki kere işlenip bakiyenin çift eklenmesini "status='pending'" şartıyla engeller.
create or replace function public.complete_partner_topup(p_transaction_id uuid)
returns table(ok boolean, company_id uuid, amount numeric) language plpgsql as $$
declare
  v_company uuid;
  v_amount numeric;
begin
  update public.partner_transactions set status = 'completed'
    where id = p_transaction_id and status = 'pending'
    returning company_id, amount into v_company, v_amount;

  if v_company is null then
    return query select false, null::uuid, null::numeric;
    return;
  end if;

  update public.partner_companies set balance = balance + v_amount where id = v_company;

  return query select true, v_company, v_amount;
end;
$$;
