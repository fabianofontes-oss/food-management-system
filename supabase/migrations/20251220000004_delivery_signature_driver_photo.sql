-- Adicionar coluna de assinatura do cliente
ALTER TABLE public.deliveries 
ADD COLUMN IF NOT EXISTS customer_signature_url text null;

-- Adicionar coluna de foto do motorista na tabela drivers
ALTER TABLE public.drivers 
ADD COLUMN IF NOT EXISTS photo_url text null;

-- Adicionar coluna de timeout de entrega
ALTER TABLE public.deliveries 
ADD COLUMN IF NOT EXISTS timeout_at timestamptz null;

-- Adicionar coluna de motivo de recusa
ALTER TABLE public.deliveries 
ADD COLUMN IF NOT EXISTS refusal_reason text null;

-- Comentários
COMMENT ON COLUMN public.deliveries.customer_signature_url IS 'URL da assinatura digital do cliente';
COMMENT ON COLUMN public.drivers.photo_url IS 'URL da foto do motorista';
COMMENT ON COLUMN public.deliveries.timeout_at IS 'Data/hora limite para a entrega';
COMMENT ON COLUMN public.deliveries.refusal_reason IS 'Motivo da recusa de entrega';
