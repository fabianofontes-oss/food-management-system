-- ============================================================================
-- MIGRAÇÃO: Adicionar campo past_due_since na tabela tenants
-- Data: 2025-12-19
-- Descrição: Campo necessário para o Billing Enforcement (ETAPA 5 P0)
-- ============================================================================

-- Adicionar campo past_due_since para controlar grace period
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS past_due_since TIMESTAMPTZ NULL;

-- Índice para queries de billing
CREATE INDEX IF NOT EXISTS idx_tenants_past_due ON tenants(past_due_since) WHERE past_due_since IS NOT NULL;

-- Comentário
COMMENT ON COLUMN tenants.past_due_since IS 'Data desde quando o tenant está com pagamento atrasado (para calcular grace period)';
