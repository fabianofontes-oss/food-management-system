ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS idempotency_key uuid;

CREATE UNIQUE INDEX IF NOT EXISTS orders_store_idempotency_uq
ON public.orders (store_id, idempotency_key)
WHERE idempotency_key IS NOT NULL;
