-- ============================================================
-- P0.1 + P0.2 — SECURITY DEFINER HARDENING (public)
-- Data: 2024-12-19
-- Objetivo: 
--   - P0.2: Corrigir 3 functions (create_order_atomic, get_user_stores, update_cash_session_on_order)
--   - P0.1: Definir search_path seguro para TODAS as SECURITY DEFINER
-- Fonte: Análise de segurança audit/03_P0_security_definer_analysis.md
-- ============================================================

-- Opcional: reduzir risco de lock prolongado
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

-- -----------------------------
-- A) P0.2 — Patch 3 functions com risco médio (via "surgical rewrite")
--     - Preserva assinatura/return type pois reaproveita pg_get_functiondef(oid)
--     - Só aplica se encontrar padrões esperados; caso contrário, aborta com EXCEPTION
-- -----------------------------

DO $$
DECLARE
  f_oid oid;
  orig text;
  patched text;
BEGIN
  -- ============ 1) create_order_atomic ============
  SELECT p.oid INTO f_oid
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'create_order_atomic'
  ORDER BY p.oid
  LIMIT 1;

  IF f_oid IS NOT NULL THEN
    orig := pg_get_functiondef(f_oid);

    IF orig ~ 'user_has_store_access' THEN
      RAISE NOTICE 'create_order_atomic: já contém validação de acesso (user_has_store_access). Skip.';
    ELSE
      -- Injeta check logo após v_idempotency_key (antes da validação de store)
      patched := regexp_replace(
        orig,
        '(v_idempotency_key\s*:=.*idempotency_key.*;\s*\n)',
        E'\\1\n  -- P0.2 hardening: valida acesso do caller à store_id (bypass apenas para service_role)\n  IF coalesce(current_setting(''request.jwt.claim.role'', true), '''') <> ''service_role'' THEN\n    IF v_store_id IS NOT NULL AND auth.uid() IS NOT NULL THEN\n      IF NOT public.user_has_store_access(v_store_id) THEN\n        RAISE EXCEPTION ''forbidden_store'';\n      END IF;\n    END IF;\n  END IF;\n\n'
      );

      IF patched = orig THEN
        RAISE EXCEPTION 'create_order_atomic: padrão de injeção não encontrado. Patch manual necessário.';
      END IF;

      EXECUTE patched;
      RAISE NOTICE 'create_order_atomic: patched OK.';
    END IF;
  ELSE
    RAISE NOTICE 'create_order_atomic: function não encontrada. Skip.';
  END IF;

  -- ============ 2) get_user_stores ============
  SELECT p.oid INTO f_oid
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'get_user_stores'
  ORDER BY p.oid
  LIMIT 1;

  IF f_oid IS NOT NULL THEN
    orig := pg_get_functiondef(f_oid);

    IF orig ~ 'su\.user_id\s*=\s*auth\.uid\(\)' THEN
      RAISE NOTICE 'get_user_stores: já filtra por auth.uid(). Skip.';
    ELSE
      -- Caso mais comum do seu DDL: JOIN store_users sem WHERE
      patched := regexp_replace(
        orig,
        '(inner\s+join\s+store_users\s+su\s+on\s+su\.store_id\s*=\s*s\.id\s*)(;)',
        E'\\1\nWHERE su.user_id = auth.uid()\\2'
      );

      IF patched = orig THEN
        RAISE EXCEPTION 'get_user_stores: padrão de JOIN não encontrado. Patch manual necessário.';
      END IF;

      EXECUTE patched;
      RAISE NOTICE 'get_user_stores: patched OK.';
    END IF;
  ELSE
    RAISE NOTICE 'get_user_stores: function não encontrada. Skip.';
  END IF;

  -- ============ 3) update_cash_session_on_order ============
  SELECT p.oid INTO f_oid
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'update_cash_session_on_order'
  ORDER BY p.oid
  LIMIT 1;

  IF f_oid IS NOT NULL THEN
    orig := pg_get_functiondef(f_oid);

    IF orig ~ 'cash_register_sessions.*store_users' THEN
      RAISE NOTICE 'update_cash_session_on_order: já contém validação por store_users. Skip.';
    ELSE
      -- Injeta validação imediatamente antes do UPDATE cash_register_sessions
      patched := regexp_replace(
        orig,
        '(update\s+cash_register_sessions)',
        E'-- P0.2 hardening: valida acesso do caller à sessão de caixa (bypass apenas para service_role)\n  IF coalesce(current_setting(''request.jwt.claim.role'', true), '''') <> ''service_role'' THEN\n    IF auth.uid() IS NULL THEN\n      RAISE EXCEPTION ''not_authenticated'';\n    END IF;\n    PERFORM 1\n      FROM cash_register_sessions cs\n      JOIN store_users su ON su.store_id = cs.store_id\n     WHERE cs.id = NEW.cash_session_id\n       AND su.user_id = auth.uid();\n    IF NOT FOUND THEN\n      RAISE EXCEPTION ''forbidden_cash_session'';\n    END IF;\n  END IF;\n\n  \\1'
      );

      IF patched = orig THEN
        RAISE EXCEPTION 'update_cash_session_on_order: padrão UPDATE não encontrado. Patch manual necessário.';
      END IF;

      EXECUTE patched;
      RAISE NOTICE 'update_cash_session_on_order: patched OK.';
    END IF;
  ELSE
    RAISE NOTICE 'update_cash_session_on_order: function não encontrada. Skip.';
  END IF;

END $$;

-- -----------------------------
-- B) P0.1 — Definir search_path seguro em TODAS as SECURITY DEFINER (public)
--     Recomendado: 'pg_catalog, public'
-- -----------------------------

DO $$
DECLARE
  r record;
  v_search_path text := 'pg_catalog, public';
BEGIN
  FOR r IN
    SELECT
      n.nspname AS schema,
      p.proname AS name,
      pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
  LOOP
    EXECUTE format(
      'ALTER FUNCTION %I.%I(%s) SET search_path = %L;',
      r.schema, r.name, r.args, v_search_path
    );
  END LOOP;

  RAISE NOTICE 'P0.1: search_path aplicado em todas as SECURITY DEFINER (%).', v_search_path;
END $$;

-- -----------------------------
-- C) Pós-validação (rápida)
-- -----------------------------

-- 1) Confirmar search_path setado em todas SECURITY DEFINER
SELECT
  n.nspname AS schema,
  p.proname AS function_name,
  p.prosecdef AS security_definer,
  p.proconfig
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prosecdef = true
ORDER BY 1,2;

-- 2) Confirmar DDL atualizado das 3 functions (amostra)
SELECT
  p.proname AS function_name,
  pg_get_functiondef(p.oid) AS ddl
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('create_order_atomic','get_user_stores','update_cash_session_on_order')
ORDER BY 1;

-- ==========================================================
-- RESULTADO ESPERADO APÓS APLICAR
-- ==========================================================

-- ✅ Bloqueador CRÍTICO resolvido
-- - Todas as 14 SECURITY DEFINER passam a ter proconfig com search_path='pg_catalog, public'

-- ✅ 3 functions de risco médio mitigadas
-- - create_order_atomic: passa a rejeitar store_id fora do membership (via public.user_has_store_access) quando não for service_role
-- - get_user_stores: passa a filtrar por su.user_id = auth.uid()
-- - update_cash_session_on_order: passa a validar que a cash_session pertence a uma store acessível pelo auth.uid() (quando não for service_role)
