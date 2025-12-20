-- Adicionar coluna de foto de comprovação na tabela deliveries
ALTER TABLE public.deliveries 
ADD COLUMN IF NOT EXISTS proof_photo_url text null;

-- Adicionar coluna de rating do motorista
ALTER TABLE public.deliveries 
ADD COLUMN IF NOT EXISTS driver_rating integer null;

-- Adicionar coluna de comentário da avaliação
ALTER TABLE public.deliveries 
ADD COLUMN IF NOT EXISTS rating_comment text null;

-- Adicionar coluna de data da avaliação
ALTER TABLE public.deliveries 
ADD COLUMN IF NOT EXISTS rated_at timestamptz null;

-- Comentários
COMMENT ON COLUMN public.deliveries.proof_photo_url IS 'URL da foto de comprovação de entrega';
COMMENT ON COLUMN public.deliveries.driver_rating IS 'Avaliação do motorista (1-5)';
COMMENT ON COLUMN public.deliveries.rating_comment IS 'Comentário da avaliação';
COMMENT ON COLUMN public.deliveries.rated_at IS 'Data/hora da avaliação';
