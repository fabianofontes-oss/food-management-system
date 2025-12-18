-- ============================================================================
-- MIGRAÇÃO: Adicionar campos completos para Tenants
-- Data: 2025-12-18
-- Descrição: Adiciona campos de contato, identificação fiscal, status e billing
-- ============================================================================

-- Criar enum para status do tenant
DO $$ BEGIN
  CREATE TYPE tenant_status_enum AS ENUM ('active', 'suspended', 'cancelled', 'trial');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Adicionar novos campos na tabela tenants
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS document VARCHAR(20); -- CPF ou CNPJ
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS document_type VARCHAR(4) DEFAULT 'cpf'; -- 'cpf' ou 'cnpj'
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS responsible_name VARCHAR(255);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS state VARCHAR(2);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS cep VARCHAR(10);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS billing_day INTEGER DEFAULT 1; -- Dia do vencimento (1-28)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS notes TEXT; -- Anotações internas
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS suspended_reason TEXT;

-- Índices para busca
CREATE INDEX IF NOT EXISTS idx_tenants_email ON tenants(email);
CREATE INDEX IF NOT EXISTS idx_tenants_document ON tenants(document);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);

-- Comentários
COMMENT ON COLUMN tenants.email IS 'Email principal do responsável';
COMMENT ON COLUMN tenants.phone IS 'Telefone de contato';
COMMENT ON COLUMN tenants.document IS 'CPF ou CNPJ sem formatação';
COMMENT ON COLUMN tenants.document_type IS 'Tipo do documento: cpf ou cnpj';
COMMENT ON COLUMN tenants.responsible_name IS 'Nome do responsável legal';
COMMENT ON COLUMN tenants.status IS 'Status: active, suspended, cancelled, trial';
COMMENT ON COLUMN tenants.trial_ends_at IS 'Data fim do período trial';
COMMENT ON COLUMN tenants.billing_day IS 'Dia do mês para vencimento (1-28)';
COMMENT ON COLUMN tenants.notes IS 'Anotações internas do super admin';
