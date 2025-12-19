-- ============================================================================
-- SLUG RESERVATIONS: Reserva de URL antes do signup (tenant por lojista)
-- Objetivo: evitar corrida (duas pessoas escolhendo o mesmo slug)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.slug_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  token uuid NOT NULL DEFAULT gen_random_uuid(),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (slug),
  UNIQUE (token)
);

CREATE INDEX IF NOT EXISTS idx_slug_reservations_expires_at
ON public.slug_reservations (expires_at);

ALTER TABLE public.slug_reservations ENABLE ROW LEVEL SECURITY;

-- IMPORTANTE:
-- Não criamos policies para slug_reservations.
-- A leitura/escrita deve acontecer apenas via Service Role em rotas server-side.
