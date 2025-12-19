-- =====================================================
-- SETUP COMPLETO: Super Admin Security
-- =====================================================
-- 
-- Execute este SQL COMPLETO no Supabase SQL Editor
-- Ele cria tudo do zero e faz o bootstrap do Fabiano
-- 
-- =====================================================

-- 1) Criar tabela super_admins (se não existir)
CREATE TABLE IF NOT EXISTS public.super_admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  notes TEXT
);

-- 2) Adicionar coluna notes se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'super_admins' 
    AND column_name = 'notes'
  ) THEN
    ALTER TABLE public.super_admins ADD COLUMN notes TEXT;
  END IF;
END $$;

-- 3) Habilitar RLS
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

-- 4) Criar função is_super_admin
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

-- 5) Criar policies
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
-- 6) BOOTSTRAP: Inserir Fabiano como Super Admin
-- =====================================================

INSERT INTO public.super_admins (user_id, email, notes)
VALUES (
  'e0913bb8-35ff-49db-a3b7-818d6018bba2', -- Fabiano Braga
  'fabianobraga@me.com',
  'bootstrap - Fabiano Braga - primeiro super admin do sistema'
)
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- 7) VERIFICAÇÃO
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
-- Deve retornar TRUE

-- =====================================================
-- 8) Criar tabela admin_permissions
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
-- 9) Criar tabela admin_audit_logs
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

DROP POLICY IF EXISTS admin_audit_logs_select ON public.admin_audit_logs;
CREATE POLICY admin_audit_logs_select ON public.admin_audit_logs
FOR SELECT TO authenticated
USING (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS admin_audit_logs_insert ON public.admin_audit_logs;
CREATE POLICY admin_audit_logs_insert ON public.admin_audit_logs
FOR INSERT TO authenticated
WITH CHECK (
  public.is_super_admin(auth.uid())
  AND admin_user_id = auth.uid()
);

-- =====================================================
-- 10) Criar índices
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_user ON public.admin_audit_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON public.admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created ON public.admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target ON public.admin_audit_logs(target_type, target_id);

CREATE INDEX IF NOT EXISTS idx_admin_permissions_user ON public.admin_permissions(user_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_admin_permissions_permission ON public.admin_permissions(permission) WHERE revoked_at IS NULL;

-- =====================================================
-- ✅ SETUP COMPLETO!
-- =====================================================

SELECT '✅ Setup completo! Fabiano Braga configurado como Super Admin.' as status;
