-- ============================================================
-- MIGRATION: Idempotency Keys System
-- Data: 21/12/2024
-- Objetivo: Prevenir operações duplicadas com idempotency keys
-- ============================================================

-- Criar tabela de idempotency keys
CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  key TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  request_hash TEXT NOT NULL,
  response JSONB NOT NULL,
  status_code INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_tenant_id ON idempotency_keys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_expires_at ON idempotency_keys(expires_at);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_created_at ON idempotency_keys(created_at DESC);

-- RLS: Usuários veem apenas keys do próprio tenant
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;

-- Policy para leitura
CREATE POLICY idempotency_keys_select_policy ON idempotency_keys
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT s.tenant_id
      FROM store_users su 
      INNER JOIN stores s ON s.id = su.store_id
      WHERE su.user_id = auth.uid()
    )
  );

-- Policy para inserção
CREATE POLICY idempotency_keys_insert_policy ON idempotency_keys
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT s.tenant_id
      FROM store_users su 
      INNER JOIN stores s ON s.id = su.store_id
      WHERE su.user_id = auth.uid()
    )
  );

-- Função para limpar keys expiradas (executar via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_idempotency_keys()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM idempotency_keys
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RAISE NOTICE 'Removidas % idempotency keys expiradas', deleted_count;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Função para buscar ou criar idempotency key
CREATE OR REPLACE FUNCTION get_or_create_idempotency_response(
  p_key TEXT,
  p_tenant_id UUID,
  p_request_hash TEXT
)
RETURNS TABLE (
  found BOOLEAN,
  response JSONB,
  status_code INTEGER
) AS $$
BEGIN
  -- Tentar buscar key existente e não expirada
  RETURN QUERY
  SELECT 
    TRUE as found,
    ik.response,
    ik.status_code
  FROM idempotency_keys ik
  WHERE ik.key = p_key
    AND ik.tenant_id = p_tenant_id
    AND ik.expires_at > NOW()
  LIMIT 1;
  
  -- Se não encontrou, retornar found=false
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::JSONB, NULL::INTEGER;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Função para salvar resposta de idempotency key
CREATE OR REPLACE FUNCTION save_idempotency_response(
  p_key TEXT,
  p_tenant_id UUID,
  p_request_hash TEXT,
  p_response JSONB,
  p_status_code INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO idempotency_keys (
    key,
    tenant_id,
    request_hash,
    response,
    status_code,
    created_at,
    expires_at
  ) VALUES (
    p_key,
    p_tenant_id,
    p_request_hash,
    p_response,
    p_status_code,
    NOW(),
    NOW() + INTERVAL '24 hours'
  )
  ON CONFLICT (key) DO NOTHING;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON TABLE idempotency_keys IS 'Armazena respostas de requisições para prevenir duplicação';
COMMENT ON COLUMN idempotency_keys.key IS 'Chave de idempotência fornecida pelo cliente (UUID v4)';
COMMENT ON COLUMN idempotency_keys.request_hash IS 'Hash do corpo da requisição para validação';
COMMENT ON COLUMN idempotency_keys.response IS 'Resposta cacheada da requisição original';
COMMENT ON COLUMN idempotency_keys.expires_at IS 'Data de expiração (24h após criação)';
