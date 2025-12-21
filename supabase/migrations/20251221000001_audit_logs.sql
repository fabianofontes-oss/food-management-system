-- ============================================================
-- MIGRATION: Audit Logs System
-- Data: 21/12/2024
-- Objetivo: Sistema completo de auditoria com particionamento
-- ============================================================

-- Criar tabela principal de audit logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Criar partições para os próximos 12 meses
CREATE TABLE IF NOT EXISTS audit_logs_2024_12 PARTITION OF audit_logs
  FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');

CREATE TABLE IF NOT EXISTS audit_logs_2025_01 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE IF NOT EXISTS audit_logs_2025_02 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

CREATE TABLE IF NOT EXISTS audit_logs_2025_03 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');

CREATE TABLE IF NOT EXISTS audit_logs_2025_04 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-04-01') TO ('2025-05-01');

CREATE TABLE IF NOT EXISTS audit_logs_2025_05 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-05-01') TO ('2025-06-01');

CREATE TABLE IF NOT EXISTS audit_logs_2025_06 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-06-01') TO ('2025-07-01');

CREATE TABLE IF NOT EXISTS audit_logs_2025_07 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-07-01') TO ('2025-08-01');

CREATE TABLE IF NOT EXISTS audit_logs_2025_08 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-08-01') TO ('2025-09-01');

CREATE TABLE IF NOT EXISTS audit_logs_2025_09 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-09-01') TO ('2025-10-01');

CREATE TABLE IF NOT EXISTS audit_logs_2025_10 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');

CREATE TABLE IF NOT EXISTS audit_logs_2025_11 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

CREATE TABLE IF NOT EXISTS audit_logs_2025_12 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id ON audit_logs(resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_created ON audit_logs(tenant_id, created_at DESC);

-- Índice GIN para busca em JSONB
CREATE INDEX IF NOT EXISTS idx_audit_logs_changes ON audit_logs USING gin(changes);
CREATE INDEX IF NOT EXISTS idx_audit_logs_metadata ON audit_logs USING gin(metadata);

-- RLS: Usuários veem apenas logs do próprio tenant
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy para leitura (apenas membros do tenant)
CREATE POLICY audit_logs_select_policy ON audit_logs
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT su.store_id 
      FROM store_users su 
      INNER JOIN stores s ON s.id = su.store_id
      WHERE su.user_id = auth.uid()
    )
  );

-- Policy para inserção (qualquer autenticado pode inserir no seu tenant)
CREATE POLICY audit_logs_insert_policy ON audit_logs
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT s.tenant_id
      FROM store_users su 
      INNER JOIN stores s ON s.id = su.store_id
      WHERE su.user_id = auth.uid()
    )
  );

-- Super admins podem ver tudo
CREATE POLICY audit_logs_superadmin_all ON audit_logs
  FOR ALL
  USING (
    auth.jwt()->>'email' IN (
      SELECT unnest(string_to_array(current_setting('app.super_admin_emails', true), ','))
    )
  );

-- Função para criar partições automaticamente
CREATE OR REPLACE FUNCTION create_audit_log_partition()
RETURNS void AS $$
DECLARE
  partition_date DATE;
  partition_name TEXT;
  start_date TEXT;
  end_date TEXT;
BEGIN
  -- Criar partição para o próximo mês
  partition_date := DATE_TRUNC('month', NOW() + INTERVAL '1 month');
  partition_name := 'audit_logs_' || TO_CHAR(partition_date, 'YYYY_MM');
  start_date := TO_CHAR(partition_date, 'YYYY-MM-DD');
  end_date := TO_CHAR(partition_date + INTERVAL '1 month', 'YYYY-MM-DD');
  
  -- Verificar se partição já existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_class WHERE relname = partition_name
  ) THEN
    EXECUTE format(
      'CREATE TABLE IF NOT EXISTS %I PARTITION OF audit_logs FOR VALUES FROM (%L) TO (%L)',
      partition_name, start_date, end_date
    );
    RAISE NOTICE 'Partição % criada', partition_name;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Função para limpar logs antigos (opcional, manter últimos 12 meses)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
DECLARE
  cutoff_date DATE;
  partition_name TEXT;
BEGIN
  cutoff_date := DATE_TRUNC('month', NOW() - INTERVAL '12 months');
  partition_name := 'audit_logs_' || TO_CHAR(cutoff_date, 'YYYY_MM');
  
  -- Dropar partição antiga se existir
  IF EXISTS (
    SELECT 1 FROM pg_class WHERE relname = partition_name
  ) THEN
    EXECUTE format('DROP TABLE IF EXISTS %I', partition_name);
    RAISE NOTICE 'Partição antiga % removida', partition_name;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON TABLE audit_logs IS 'Logs de auditoria de todas as ações do sistema, particionado por mês';
COMMENT ON COLUMN audit_logs.action IS 'Ação realizada (ex: product.create, order.update)';
COMMENT ON COLUMN audit_logs.resource_type IS 'Tipo do recurso afetado (ex: product, order)';
COMMENT ON COLUMN audit_logs.resource_id IS 'ID do recurso afetado';
COMMENT ON COLUMN audit_logs.changes IS 'Objeto JSON com before/after da mudança';
COMMENT ON COLUMN audit_logs.metadata IS 'Metadados adicionais da operação';
