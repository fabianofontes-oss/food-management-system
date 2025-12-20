-- Adicionar coluna de confirmação do cliente
ALTER TABLE public.deliveries 
ADD COLUMN IF NOT EXISTS customer_confirmed_at timestamptz null;

-- Adicionar coluna de código de confirmação único
ALTER TABLE public.deliveries 
ADD COLUMN IF NOT EXISTS confirmation_code text null;

-- Gerar código de confirmação para entregas existentes
UPDATE public.deliveries 
SET confirmation_code = UPPER(SUBSTRING(id::text, 1, 8))
WHERE confirmation_code IS NULL;

-- Comentários
COMMENT ON COLUMN public.deliveries.customer_confirmed_at IS 'Data/hora que o cliente confirmou recebimento';
COMMENT ON COLUMN public.deliveries.confirmation_code IS 'Código de confirmação único para QR Code';
