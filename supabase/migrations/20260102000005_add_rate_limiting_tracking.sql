-- Migration: Add rate limiting to create_order_atomic
-- Date: 2026-01-02
-- Purpose: Prevent spam and abuse by limiting order creation rate

-- Note: This is a database-level throttle as a fallback
-- Primary rate limiting should be done at application level (Upstash Redis)
-- This migration adds a helper table for tracking order creation attempts

-- Table to track order attempts for rate limiting analysis
CREATE TABLE IF NOT EXISTS public.order_creation_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for rate limiting queries
CREATE INDEX IF NOT EXISTS order_creation_attempts_store_created_idx 
  ON public.order_creation_attempts(store_id, created_at DESC);

CREATE INDEX IF NOT EXISTS order_creation_attempts_ip_created_idx 
  ON public.order_creation_attempts(ip_address, created_at DESC);

-- RLS for order_creation_attempts
ALTER TABLE public.order_creation_attempts ENABLE ROW LEVEL SECURITY;

-- Only store members can view attempts
CREATE POLICY order_creation_attempts_select
ON public.order_creation_attempts
FOR SELECT
USING (public.user_has_store_access(store_id));

-- System can insert (via service role)
CREATE POLICY order_creation_attempts_insert
ON public.order_creation_attempts
FOR INSERT
WITH CHECK (true); -- Service role will insert

COMMENT ON TABLE public.order_creation_attempts IS 'Tracks order creation attempts for rate limiting and abuse detection';
