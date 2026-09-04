-- client_tasks artık müşteriye bağlı olmayan (genel/dahili) görevleri de
-- destekliyor — customer_id NULL olabilir. Mevcut kayıtları etkilemez.

alter table public.client_tasks alter column customer_id drop not null;
