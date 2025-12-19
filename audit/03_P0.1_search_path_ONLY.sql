-- ============================================================
-- P0.1 — SECURITY DEFINER search_path (BLOQUEADOR CRÍTICO)
-- Data: 2024-12-19
-- Objetivo: Adicionar search_path seguro em TODAS as 14 functions SECURITY DEFINER
-- Nota: P0.2 (correção de 3 functions) requer edição manual - ver instruções abaixo
-- ============================================================

-- Opcional: reduzir risco de lock prolongado
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

-- -----------------------------
-- P0.1 — Definir search_path seguro em TODAS as SECURITY DEFINER (public)
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
-- Pós-validação
-- -----------------------------

-- Confirmar search_path setado em todas SECURITY DEFINER
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
-- RESULTADO ESPERADO
-- ==========================================================

-- ✅ Bloqueador CRÍTICO resolvido
-- - Todas as 14 SECURITY DEFINER passam a ter proconfig com search_path='pg_catalog, public'
-- - Mitiga SQL injection via schema poisoning

-- ==========================================================
-- P0.2 — CORREÇÃO MANUAL DAS 3 FUNCTIONS (OPCIONAL MAS RECOMENDADO)
-- ==========================================================

-- As 3 functions abaixo têm riscos MÉDIOS e requerem correção MANUAL:
-- 1. create_order_atomic - Não valida ownership de store_id
-- 2. get_user_stores - Não filtra por auth.uid()
-- 3. update_cash_session_on_order - Não valida ownership de cash session

-- INSTRUÇÕES PARA CORREÇÃO MANUAL:

-- -----------------------------
-- 1) create_order_atomic
-- -----------------------------
-- Adicionar validação logo após v_idempotency_key:

/*
  v_idempotency_key := nullif(p_payload->>'idempotency_key', '')::uuid;
  
  -- P0.2 hardening: valida acesso do caller à store_id
  IF coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' THEN
    IF v_store_id IS NOT NULL AND auth.uid() IS NOT NULL THEN
      IF NOT public.user_has_store_access(v_store_id) THEN
        RAISE EXCEPTION 'forbidden_store';
      END IF;
    END IF;
  END IF;

  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'store_id is required';
  END IF;
*/

-- -----------------------------
-- 2) get_user_stores
-- -----------------------------
-- Adicionar filtro WHERE su.user_id = auth.uid():

/*
RETURN QUERY
SELECT DISTINCT s.*
FROM stores s
INNER JOIN store_users su ON su.store_id = s.id
WHERE su.user_id = auth.uid();  -- ADICIONAR ESTA LINHA
*/

-- -----------------------------
-- 3) update_cash_session_on_order
-- -----------------------------
-- Adicionar validação antes do UPDATE cash_register_sessions:

/*
  -- P0.2 hardening: valida acesso à sessão de caixa
  IF coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' THEN
    IF auth.uid() IS NOT NULL THEN
      PERFORM 1
        FROM cash_register_sessions cs
        JOIN store_users su ON su.store_id = cs.store_id
       WHERE cs.id = NEW.cash_session_id
         AND su.user_id = auth.uid();
      IF NOT FOUND THEN
        RAISE EXCEPTION 'forbidden_cash_session';
      END IF;
    END IF;
  END IF;

  UPDATE cash_register_sessions
  SET ...
*/

-- ==========================================================
-- DECISÃO GO/NO-GO PÓS P0.1
-- ==========================================================

-- ✅ GO CONDICIONAL
-- - Bloqueador CRÍTICO (search_path) resolvido
-- - 3 functions com riscos MÉDIOS ainda requerem correção manual
-- - Sistema pode ir para produção com P0.1, mas P0.2 é RECOMENDADO
