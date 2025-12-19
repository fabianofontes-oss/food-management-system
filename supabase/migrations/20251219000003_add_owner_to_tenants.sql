-- Migration: Adiciona owner_id à tabela tenants
-- Necessário para vincular tenant ao usuário dono (1 tenant = 1 lojista)

ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_tenants_owner ON public.tenants(owner_id);

COMMENT ON COLUMN public.tenants.owner_id IS 'ID do usuário dono do tenant (1 tenant = 1 store owner)';
