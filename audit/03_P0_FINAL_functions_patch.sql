-- ============================================================
-- P0.1 + P0.2 — SECURITY DEFINER HARDENING (VERSÃO FINAL)
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
-- 1) P0.2 — Corrigir create_order_atomic (validação de acesso à store)
-- -----------------------------

DO $$
DECLARE
  f_oid oid;
  orig text;
  patched text;
BEGIN
  SELECT p.oid INTO f_oid
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'create_order_atomic'
  ORDER BY p.oid
  LIMIT 1;

  IF f_oid IS NULL THEN
    RAISE EXCEPTION 'create_order_atomic não encontrada em public';
  END IF;

  orig := pg_get_functiondef(f_oid);

  -- Evita aplicar duas vezes
  IF orig ~ 'forbidden_store' OR orig ~ 'store_users su' THEN
    RAISE NOTICE 'create_order_atomic: parece já estar hardenizada. Skip.';
    RETURN;
  END IF;

  patched := regexp_replace(
    orig,
    '(IF\s+v_idempotency_key\s+IS\s+NULL\s+THEN\s+RAISE\s+EXCEPTION\s+''idempotency_key is required'';\s*END\s+IF;\s*)',
    E'\\1\n  -- P0.2: Validar que o usuário autenticado tem acesso à store_id\n  IF auth.uid() IS NULL THEN\n    RAISE EXCEPTION ''not_authenticated'';\n  END IF;\n\n  IF NOT EXISTS (\n    SELECT 1 FROM public.store_users su\n    WHERE su.store_id = v_store_id\n      AND su.user_id = auth.uid()\n  ) THEN\n    RAISE EXCEPTION ''forbidden_store'';\n  END IF;\n\n'
  );

  IF patched = orig THEN
    RAISE EXCEPTION 'create_order_atomic: âncora não encontrada; patch manual necessário (não alterei nada).';
  END IF;

  EXECUTE patched;
  RAISE NOTICE 'create_order_atomic: patched OK.';
END $$;

-- -----------------------------
-- 2) P0.2 — Corrigir get_user_stores (filtrar por auth.uid())
-- -----------------------------

DO $$
DECLARE
  f_oid oid;
  orig text;
  patched text;
BEGIN
  SELECT p.oid INTO f_oid
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'get_user_stores'
  ORDER BY p.oid
  LIMIT 1;

  IF f_oid IS NULL THEN
    RAISE EXCEPTION 'get_user_stores não encontrada em public';
  END IF;

  orig := pg_get_functiondef(f_oid);

  IF orig ~ 'su\.user_id\s*=\s*auth\.uid\(\)' THEN
    RAISE NOTICE 'get_user_stores: já filtra por auth.uid(). Skip.';
    RETURN;
  END IF;

  patched := regexp_replace(
    orig,
    '(?i)inner\s+join\s+store_users\s+su\s+on\s+su\.store_id\s*=\s*s\.id',
    'INNER JOIN store_users su ON su.store_id = s.id AND su.user_id = auth.uid()'
  );

  IF patched = orig THEN
    RAISE EXCEPTION 'get_user_stores: padrão de JOIN não encontrado; patch manual necessário (não alterei nada).';
  END IF;

  EXECUTE patched;
  RAISE NOTICE 'get_user_stores: patched OK.';
END $$;

-- -----------------------------
-- 3) P0.2 — Corrigir update_cash_session_on_order (amarrar sessão ao NEW.store_id)
-- -----------------------------

DO $$
DECLARE
  f_oid oid;
  orig text;
  patched text;
BEGIN
  SELECT p.oid INTO f_oid
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'update_cash_session_on_order'
  ORDER BY p.oid
  LIMIT 1;

  IF f_oid IS NULL THEN
    RAISE EXCEPTION 'update_cash_session_on_order não encontrada em public';
  END IF;

  orig := pg_get_functiondef(f_oid);

  IF orig ~ 'store_id\s*=\s*NEW\.store_id' THEN
    RAISE NOTICE 'update_cash_session_on_order: já valida store_id. Skip.';
    RETURN;
  END IF;

  -- Caso padrão: WHERE id = NEW.cash_session_id;
  patched := regexp_replace(
    orig,
    '(WHERE\s+id\s*=\s*NEW\.cash_session_id\s*;)',
    'WHERE id = NEW.cash_session_id AND store_id = NEW.store_id;'
  );

  -- Fallback: WHERE cs.id = NEW.cash_session_id;
  IF patched = orig THEN
    patched := regexp_replace(
      orig,
      '(WHERE\s+cs\.id\s*=\s*NEW\.cash_session_id\s*;)',
      'WHERE cs.id = NEW.cash_session_id AND cs.store_id = NEW.store_id;'
    );
  END IF;

  IF patched = orig THEN
    RAISE EXCEPTION 'update_cash_session_on_order: WHERE não encontrado; patch manual necessário (não alterei nada).';
  END IF;

  EXECUTE patched;
  RAISE NOTICE 'update_cash_session_on_order: patched OK.';
END $$;

-- -----------------------------
-- 4) P0.1 — Corrigir search_path em TODAS as SECURITY DEFINER
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
-- 5) Validação (rápida)
-- -----------------------------

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

-- ==========================================================
-- RESULTADO ESPERADO APÓS APLICAR
-- ==========================================================

-- ✅ Bloqueador CRÍTICO resolvido
-- - Todas as 14 SECURITY DEFINER passam a ter proconfig com search_path='pg_catalog, public'

-- ✅ 3 functions de risco médio mitigadas
-- - create_order_atomic: valida que usuário tem acesso à store via store_users
-- - get_user_stores: filtra por auth.uid() no JOIN
-- - update_cash_session_on_order: valida que cash_session pertence ao mesmo store_id do pedido

-- ==========================================================
-- NOTICES ESPERADOS
-- ==========================================================

-- NOTICE: create_order_atomic: patched OK.
-- NOTICE: get_user_stores: patched OK.
-- NOTICE: update_cash_session_on_order: patched OK.
-- NOTICE: P0.1: search_path aplicado em todas as SECURITY DEFINER (pg_catalog, public).
