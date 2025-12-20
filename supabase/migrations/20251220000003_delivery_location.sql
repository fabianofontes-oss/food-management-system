-- Adicionar colunas de localização do motorista
ALTER TABLE public.deliveries 
ADD COLUMN IF NOT EXISTS driver_latitude double precision null;

ALTER TABLE public.deliveries 
ADD COLUMN IF NOT EXISTS driver_longitude double precision null;

ALTER TABLE public.deliveries 
ADD COLUMN IF NOT EXISTS driver_location_updated_at timestamptz null;

-- Comentários
COMMENT ON COLUMN public.deliveries.driver_latitude IS 'Latitude atual do motorista';
COMMENT ON COLUMN public.deliveries.driver_longitude IS 'Longitude atual do motorista';
COMMENT ON COLUMN public.deliveries.driver_location_updated_at IS 'Última atualização da localização';
