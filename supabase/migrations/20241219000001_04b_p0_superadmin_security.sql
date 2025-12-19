-- ETAPA 4B-P0: SuperAdmin por USER_ID + Audit Log + Permissões
-- Data: 2024-12-19
-- Objetivo: Eliminar vulnerabilidades P0 do SuperAdmin

-- =====================================================
-- 1) SUPER ADMINS (user_id ao invés de email)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.super_admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  notes TEXT
);

ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

-- Função para verificar se usuário é super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(p_uid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SET search_path = 'pg_catalog, public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.super_admins sa
    WHERE sa.user_id = p_uid
      AND sa.revoked_at IS NULL
  );
$$;

-- RLS: Somente super admin enxerga/gera lista
DROP POLICY IF EXISTS super_admins_select ON public.super_admins;
CREATE POLICY super_admins_select ON public.super_admins
FOR SELECT TO authenticated
USING (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS super_admins_insert ON public.super_admins;
CREATE POLICY super_admins_insert ON public.super_admins
FOR INSERT TO authenticated
WITH CHECK (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS super_admins_update ON public.super_admins;
CREATE POLICY super_admins_update ON public.super_admins
FOR UPDATE TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

-- =====================================================
-- 2) PERMISSÕES GRANULARES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.admin_permissions (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission TEXT NOT NULL,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, permission)
);

ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_permissions_rw ON public.admin_permissions;
CREATE POLICY admin_permissions_rw ON public.admin_permissions
FOR ALL TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

-- =====================================================
-- 3) AUDIT LOG (append-only)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  admin_email TEXT,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  target_name TEXT,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS: Somente super admin pode ler
DROP POLICY IF EXISTS admin_audit_logs_select ON public.admin_audit_logs;
CREATE POLICY admin_audit_logs_select ON public.admin_audit_logs
FOR SELECT TO authenticated
USING (public.is_super_admin(auth.uid()));

-- RLS: Somente super admin pode inserir (e apenas seu próprio user_id)
DROP POLICY IF EXISTS admin_audit_logs_insert ON public.admin_audit_logs;
CREATE POLICY admin_audit_logs_insert ON public.admin_audit_logs
FOR INSERT TO authenticated
WITH CHECK (
  public.is_super_admin(auth.uid())
  AND admin_user_id = auth.uid()
);

-- Sem UPDATE/DELETE policies = ninguém altera/apaga logs via API

-- =====================================================
-- 4) ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_user ON public.admin_audit_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON public.admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created ON public.admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target ON public.admin_audit_logs(target_type, target_id);

CREATE INDEX IF NOT EXISTS idx_admin_permissions_user ON public.admin_permissions(user_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_admin_permissions_permission ON public.admin_permissions(permission) WHERE revoked_at IS NULL;

-- =====================================================
-- 5) COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE public.super_admins IS 'Lista de Super Admins do sistema (autenticação por user_id)';
COMMENT ON TABLE public.admin_permissions IS 'Permissões granulares para operações administrativas';
COMMENT ON TABLE public.admin_audit_logs IS 'Log de auditoria de todas as ações administrativas (append-only)';

COMMENT ON FUNCTION public.is_super_admin(UUID) IS 'Verifica se um user_id é Super Admin ativo';

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
