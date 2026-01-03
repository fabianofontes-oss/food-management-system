-- Migration: Add public_token to orders for secure public tracking
-- Date: 2026-01-02
-- Purpose: Replace enumerable order codes with random UUID tokens for public access

-- Add public_token column
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS public_token UUID DEFAULT gen_random_uuid() NOT NULL;

-- Create unique index for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS orders_public_token_idx ON public.orders(public_token);

-- Update existing orders to have random tokens
UPDATE public.orders
SET public_token = gen_random_uuid()
WHERE public_token IS NULL;

-- Add constraint to ensure tokens are always unique and not null
ALTER TABLE public.orders
ALTER COLUMN public_token SET NOT NULL;

COMMENT ON COLUMN public.orders.public_token IS 'Random UUID for secure public order tracking (non-enumerable)';
