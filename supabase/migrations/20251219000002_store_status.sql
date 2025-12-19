-- Migration: Store Status (Onboarding Slug Primeiro)
-- Adiciona campos status e published_at para controlar publicação de lojas
-- Lojas em DRAFT não aparecem no cardápio público

-- 1. Criar enum de status (se não existir)
DO $$ BEGIN
  CREATE TYPE store_status_enum AS ENUM ('draft', 'active');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Adicionar campo status na tabela stores
ALTER TABLE stores ADD COLUMN IF NOT EXISTS status store_status_enum NOT NULL DEFAULT 'active';

-- 3. Adicionar campo published_at na tabela stores
ALTER TABLE stores ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ NULL;

-- 4. Criar índice único case-insensitive no slug (substituir o existente)
DROP INDEX IF EXISTS idx_stores_slug;
CREATE UNIQUE INDEX IF NOT EXISTS idx_stores_slug_lower ON stores(lower(slug));

-- 5. Atualizar lojas existentes como active com published_at = created_at
UPDATE stores 
SET 
  status = 'active', 
  published_at = created_at 
WHERE published_at IS NULL;

-- 6. Criar índice para filtrar por status
CREATE INDEX IF NOT EXISTS idx_stores_status ON stores(status);

-- Comentários
COMMENT ON COLUMN stores.status IS 'Status da loja: draft (em configuração, não pública) ou active (publicada)';
COMMENT ON COLUMN stores.published_at IS 'Data/hora em que a loja foi publicada pela primeira vez';
