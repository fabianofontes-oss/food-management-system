-- =====================================================
-- RESET E SETUP COMPLETO: Super Admin Security
-- =====================================================
-- 
-- Este script REMOVE a tabela antiga e recria corretamente
-- Execute este SQL COMPLETO no Supabase SQL Editor
-- 
-- =====================================================

-- 1) REMOVER tabelas antigas (se existirem)
DROP TABLE IF EXISTS public.admin_audit_logs CASCADE;
DROP TABLE IF EXISTS public.admin_permissions CASCADE;
DROP TABLE IF EXISTS public.super_admins CASCADE;
DROP FUNCTION IF EXISTS public.is_super_admin(UUID);

-- =====================================================
-- 2) CRIAR TABELA super_admins (CORRETA)
-- =====================================================

CREATE TABLE public.super_admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  notes TEXT
);

ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3) CRIAR FUNÇÃO is_super_admin
-- =====================================================

CREATE FUNCTION public.is_super_admin(p_uid UUID)
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

-- =====================================================
-- 4) CRIAR POLICIES para super_admins
-- =====================================================

CREATE POLICY super_admins_select ON public.super_admins
FOR SELECT TO authenticated
USING (public.is_super_admin(auth.uid()));

CREATE POLICY super_admins_insert ON public.super_admins
FOR INSERT TO authenticated
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY super_admins_update ON public.super_admins
FOR UPDATE TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

-- =====================================================
-- 5) BOOTSTRAP: Inserir Fabiano como Super Admin
-- =====================================================

INSERT INTO public.super_admins (user_id, email, notes)
VALUES (
  'e0913bb8-35ff-49db-a3b7-818d6018bba2',
  'fabianobraga@me.com',
  'bootstrap - Fabiano Braga - primeiro super admin do sistema'
);

-- =====================================================
-- 6) CRIAR TABELA admin_permissions
-- =====================================================

CREATE TABLE public.admin_permissions (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission TEXT NOT NULL,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, permission)
);

ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_permissions_rw ON public.admin_permissions
FOR ALL TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

-- =====================================================
-- 7) CRIAR TABELA admin_audit_logs
-- =====================================================

CREATE TABLE public.admin_audit_logs (
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

CREATE POLICY admin_audit_logs_select ON public.admin_audit_logs
FOR SELECT TO authenticated
USING (public.is_super_admin(auth.uid()));

CREATE POLICY admin_audit_logs_insert ON public.admin_audit_logs
FOR INSERT TO authenticated
WITH CHECK (
  public.is_super_admin(auth.uid())
  AND admin_user_id = auth.uid()
);

-- =====================================================
-- 8) CRIAR ÍNDICES
-- =====================================================

CREATE INDEX idx_admin_audit_logs_admin_user ON public.admin_audit_logs(admin_user_id);
CREATE INDEX idx_admin_audit_logs_action ON public.admin_audit_logs(action);
CREATE INDEX idx_admin_audit_logs_created ON public.admin_audit_logs(created_at DESC);
CREATE INDEX idx_admin_audit_logs_target ON public.admin_audit_logs(target_type, target_id);

CREATE INDEX idx_admin_permissions_user ON public.admin_permissions(user_id) WHERE revoked_at IS NULL;
CREATE INDEX idx_admin_permissions_permission ON public.admin_permissions(permission) WHERE revoked_at IS NULL;

-- =====================================================
-- 9) VERIFICAÇÃO FINAL
-- =====================================================

-- Listar super admins
SELECT 
  user_id,
  email,
  granted_at,
  notes
FROM public.super_admins
WHERE revoked_at IS NULL;

-- Testar função is_super_admin
SELECT public.is_super_admin('e0913bb8-35ff-49db-a3b7-818d6018bba2') as is_admin;

-- Status final
SELECT '✅ SETUP COMPLETO! Fabiano Braga configurado como Super Admin.' as status;

-- =====================================================
-- ✅ FIM DO SETUP
-- =====================================================
