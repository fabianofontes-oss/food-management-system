-- Migration: Add localization fields to tenants table
-- Adds support for multi-country/language/currency/timezone

-- Add localization columns to tenants table (idempotent)
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS country text DEFAULT 'BR',
  ADD COLUMN IF NOT EXISTS language text DEFAULT 'pt-BR',
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'BRL',
  ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'America/Sao_Paulo';

-- Add comment to document the purpose
COMMENT ON COLUMN public.tenants.country IS 'ISO country code (BR, US, CL, etc.)';
COMMENT ON COLUMN public.tenants.language IS 'Locale code (pt-BR, en-US, es-CL, etc.)';
COMMENT ON COLUMN public.tenants.currency IS 'Currency code (BRL, USD, CLP, etc.)';
COMMENT ON COLUMN public.tenants.timezone IS 'IANA timezone identifier (America/Sao_Paulo, America/New_York, etc.)';
