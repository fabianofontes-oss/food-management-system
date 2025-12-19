-- ==========================================================
-- P0: Supabase Multi-tenant Hardening (RLS + policies + grants)
-- Escopo: schema public
-- Objetivo: corrigir NO-GO (financeiro exposto, tenants cross-tenant,
--           core tables bloqueadas por falta de policies)
-- Data: 2024-12-19
-- Fonte: Auditoria ETAPA 3 - audit/03_supabase_rls_findings_REAL.md
-- ==========================================================

BEGIN;

-- -----------------------------
-- 0) Preflight (somente leitura)
-- -----------------------------
-- (Opcional) Confirme colunas existentes nos alvos
-- SELECT table_name, column_name
-- FROM information_schema.columns
-- WHERE table_schema='public'
--   AND table_name IN ('tenants','stores','store_users','customers','orders','order_items','users','invoices','payment_history','tenant_subscriptions')
-- ORDER BY 1,2;

-- -----------------------------
-- 1) Habilitar RLS nas tabelas críticas citadas (se estiver OFF)
-- -----------------------------
DO $$
DECLARE
  t text;
  tables text[] := ARRAY['invoices','payment_history','tenant_subscriptions','tenants','customers','orders','order_items','users'];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
               WHERE n.nspname='public' AND c.relkind='r' AND c.relname=t) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
      EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY;', t);
    END IF;
  END LOOP;
END $$;

-- -----------------------------
-- 2) Corrigir TENANTS: remover policies permissivas (qual=true ou auth.uid()!=null)
--    e criar policies de isolamento via store_users -> stores -> tenants
-- -----------------------------
DO $$
DECLARE
  r record;
  has_stores boolean;
  has_store_users boolean;
  stores_has_tenant_id boolean;
BEGIN
  -- Drop policies claramente permissivas em tenants (se existirem)
  FOR r IN
    SELECT policyname, qual
    FROM pg_policies
    WHERE schemaname='public'
      AND tablename='tenants'
      AND (
        qual IS NULL
        OR lower(qual) = 'true'
        OR qual ~* 'auth\.uid\(\)\s+is\s+not\s+null'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.tenants;', r.policyname);
  END LOOP;

  -- Verificações de dependências
  has_stores := EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
                        WHERE n.nspname='public' AND c.relkind='r' AND c.relname='stores');
  has_store_users := EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
                             WHERE n.nspname='public' AND c.relkind='r' AND c.relname='store_users');

  IF has_stores AND has_store_users THEN
    stores_has_tenant_id := EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='stores' AND column_name='tenant_id'
    );

    IF stores_has_tenant_id THEN
      -- SELECT tenants apenas se o usuário pertence a alguma store do tenant
      EXECUTE $pol$
        CREATE POLICY tenants_select_by_membership
        ON public.tenants
        FOR SELECT
        TO authenticated
        USING (
          EXISTS (
            SELECT 1
            FROM public.stores s
            JOIN public.store_users su ON su.store_id = s.id
            WHERE su.user_id = auth.uid()
              AND s.tenant_id = tenants.id
          )
        );
      $pol$;

      -- UPDATE tenants: por padrão, restringir a usuários autenticados com vínculo.
      -- (Ideal: restringir ainda mais por role na store_users, se existir.)
      EXECUTE $pol$
        CREATE POLICY tenants_update_by_membership
        ON public.tenants
        FOR UPDATE
        TO authenticated
        USING (
          EXISTS (
            SELECT 1
            FROM public.stores s
            JOIN public.store_users su ON su.store_id = s.id
            WHERE su.user_id = auth.uid()
              AND s.tenant_id = tenants.id
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1
            FROM public.stores s
            JOIN public.store_users su ON su.store_id = s.id
            WHERE su.user_id = auth.uid()
              AND s.tenant_id = tenants.id
          )
        );
      $pol$;
    END IF;
  END IF;
END $$;

-- -----------------------------
-- 3) Policies para STORES / STORE_USERS (se você já tiver, ignore; aqui é P0 mínimo)
--    (Opcional, mas ajuda a consistência do isolamento)
-- -----------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
             WHERE n.nspname='public' AND c.relkind='r' AND c.relname='stores') THEN
    -- Criar policy somente se não existir nenhuma em stores
    IF (SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename='stores') = 0 THEN
      EXECUTE $pol$
        CREATE POLICY stores_select_by_membership
        ON public.stores
        FOR SELECT
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.store_users su
            WHERE su.user_id = auth.uid()
              AND su.store_id = stores.id
          )
        );
      $pol$;
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
             WHERE n.nspname='public' AND c.relkind='r' AND c.relname='store_users') THEN
    IF (SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename='store_users') = 0 THEN
      EXECUTE $pol$
        CREATE POLICY store_users_select_self_or_same_store
        ON public.store_users
        FOR SELECT
        TO authenticated
        USING (
          user_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.store_users su2
            WHERE su2.user_id = auth.uid()
              AND su2.store_id = store_users.store_id
          )
        );
      $pol$;
    END IF;
  END IF;
END $$;

-- -----------------------------
-- 4) CORE TABLES: customers / orders / order_items / users
--    Criar policies P0 somente se não houver NENHUMA policy (para destravar o sistema).
-- -----------------------------

-- 4.1 customers
DO $$
DECLARE
  has_store_id boolean;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
             WHERE n.nspname='public' AND c.relkind='r' AND c.relname='customers') THEN

    IF (SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename='customers') = 0 THEN
      has_store_id := EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='customers' AND column_name='store_id'
      );

      IF has_store_id THEN
        EXECUTE $pol$
          CREATE POLICY customers_select_by_store_membership
          ON public.customers
          FOR SELECT
          TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM public.store_users su
              WHERE su.user_id = auth.uid()
                AND su.store_id = customers.store_id
            )
          );
        $pol$;

        EXECUTE $pol$
          CREATE POLICY customers_write_by_store_membership
          ON public.customers
          FOR INSERT
          TO authenticated
          WITH CHECK (
            EXISTS (
              SELECT 1 FROM public.store_users su
              WHERE su.user_id = auth.uid()
                AND su.store_id = customers.store_id
            )
          );
        $pol$;

        EXECUTE $pol$
          CREATE POLICY customers_update_by_store_membership
          ON public.customers
          FOR UPDATE
          TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM public.store_users su
              WHERE su.user_id = auth.uid()
                AND su.store_id = customers.store_id
            )
          )
          WITH CHECK (
            EXISTS (
              SELECT 1 FROM public.store_users su
              WHERE su.user_id = auth.uid()
                AND su.store_id = customers.store_id
            )
          );
        $pol$;

        EXECUTE $pol$
          CREATE POLICY customers_delete_by_store_membership
          ON public.customers
          FOR DELETE
          TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM public.store_users su
              WHERE su.user_id = auth.uid()
                AND su.store_id = customers.store_id
            )
          );
        $pol$;
      END IF;
    END IF;
  END IF;
END $$;

-- 4.2 orders
DO $$
DECLARE
  has_store_id boolean;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
             WHERE n.nspname='public' AND c.relkind='r' AND c.relname='orders') THEN

    IF (SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename='orders') = 0 THEN
      has_store_id := EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='orders' AND column_name='store_id'
      );

      IF has_store_id THEN
        EXECUTE $pol$
          CREATE POLICY orders_select_by_store_membership
          ON public.orders
          FOR SELECT
          TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM public.store_users su
              WHERE su.user_id = auth.uid()
                AND su.store_id = orders.store_id
            )
          );
        $pol$;

        EXECUTE $pol$
          CREATE POLICY orders_insert_by_store_membership
          ON public.orders
          FOR INSERT
          TO authenticated
          WITH CHECK (
            EXISTS (
              SELECT 1 FROM public.store_users su
              WHERE su.user_id = auth.uid()
                AND su.store_id = orders.store_id
            )
          );
        $pol$;

        EXECUTE $pol$
          CREATE POLICY orders_update_by_store_membership
          ON public.orders
          FOR UPDATE
          TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM public.store_users su
              WHERE su.user_id = auth.uid()
                AND su.store_id = orders.store_id
            )
          )
          WITH CHECK (
            EXISTS (
              SELECT 1 FROM public.store_users su
              WHERE su.user_id = auth.uid()
                AND su.store_id = orders.store_id
            )
          );
        $pol$;

        EXECUTE $pol$
          CREATE POLICY orders_delete_by_store_membership
          ON public.orders
          FOR DELETE
          TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM public.store_users su
              WHERE su.user_id = auth.uid()
                AND su.store_id = orders.store_id
            )
          );
        $pol$;
      END IF;
    END IF;
  END IF;
END $$;

-- 4.3 order_items (preferir join em orders se não tiver store_id)
DO $$
DECLARE
  has_store_id boolean;
  has_order_id boolean;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
             WHERE n.nspname='public' AND c.relkind='r' AND c.relname='order_items') THEN

    IF (SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename='order_items') = 0 THEN
      has_store_id := EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='order_items' AND column_name='store_id'
      );
      has_order_id := EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='order_items' AND column_name='order_id'
      );

      IF has_store_id THEN
        EXECUTE $pol$
          CREATE POLICY order_items_all_by_store_membership
          ON public.order_items
          FOR ALL
          TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM public.store_users su
              WHERE su.user_id = auth.uid()
                AND su.store_id = order_items.store_id
            )
          )
          WITH CHECK (
            EXISTS (
              SELECT 1 FROM public.store_users su
              WHERE su.user_id = auth.uid()
                AND su.store_id = order_items.store_id
            )
          );
        $pol$;

      ELSIF has_order_id AND EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
                                     WHERE n.nspname='public' AND c.relkind='r' AND c.relname='orders') THEN
        -- assume orders tem store_id
        EXECUTE $pol$
          CREATE POLICY order_items_all_via_orders_store
          ON public.order_items
          FOR ALL
          TO authenticated
          USING (
            EXISTS (
              SELECT 1
              FROM public.orders o
              JOIN public.store_users su ON su.store_id = o.store_id
              WHERE su.user_id = auth.uid()
                AND o.id = order_items.order_id
            )
          )
          WITH CHECK (
            EXISTS (
              SELECT 1
              FROM public.orders o
              JOIN public.store_users su ON su.store_id = o.store_id
              WHERE su.user_id = auth.uid()
                AND o.id = order_items.order_id
            )
          );
        $pol$;
      END IF;
    END IF;
  END IF;
END $$;

-- 4.4 users (típico "profile table")
DO $$
DECLARE
  has_id boolean;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
             WHERE n.nspname='public' AND c.relkind='r' AND c.relname='users') THEN

    IF (SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename='users') = 0 THEN
      has_id := EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='users' AND column_name='id'
      );

      IF has_id THEN
        EXECUTE $pol$
          CREATE POLICY users_select_self
          ON public.users
          FOR SELECT
          TO authenticated
          USING (id = auth.uid());
        $pol$;

        EXECUTE $pol$
          CREATE POLICY users_update_self
          ON public.users
          FOR UPDATE
          TO authenticated
          USING (id = auth.uid())
          WITH CHECK (id = auth.uid());
        $pol$;

        -- INSERT costuma ser feito via trigger; se seu app insere direto, habilite com cuidado.
        -- EXECUTE 'CREATE POLICY users_insert_self ON public.users FOR INSERT TO authenticated WITH CHECK (id = auth.uid());';
      END IF;
    END IF;
  END IF;
END $$;

-- -----------------------------
-- 5) FINANCEIRO: invoices / payment_history / tenant_subscriptions
--    Policies via tenant_id ou store_id (dependendo do schema)
-- -----------------------------
DO $$
DECLARE
  t text;
  tables text[] := ARRAY['invoices','payment_history','tenant_subscriptions'];
  has_tenant_id boolean;
  has_store_id boolean;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
               WHERE n.nspname='public' AND c.relkind='r' AND c.relname=t) THEN

      IF (SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename=t) = 0 THEN
        has_tenant_id := EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema='public' AND table_name=t AND column_name='tenant_id'
        );
        has_store_id := EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema='public' AND table_name=t AND column_name='store_id'
        );

        IF has_tenant_id THEN
          EXECUTE format($pol$
            CREATE POLICY %I_select_by_tenant_membership
            ON public.%I
            FOR SELECT
            TO authenticated
            USING (
              EXISTS (
                SELECT 1
                FROM public.stores s
                JOIN public.store_users su ON su.store_id = s.id
                WHERE su.user_id = auth.uid()
                  AND s.tenant_id = %I.tenant_id
              )
            );
          $pol$, t, t, t);

          -- P0: bloquear writes para cliente por padrão (financeiro deve ser "system-controlled").
          -- Se seu app precisa de update/insert via authenticated, crie policies específicas depois.

        ELSIF has_store_id THEN
          EXECUTE format($pol$
            CREATE POLICY %I_select_by_store_membership
            ON public.%I
            FOR SELECT
            TO authenticated
            USING (
              EXISTS (
                SELECT 1
                FROM public.store_users su
                WHERE su.user_id = auth.uid()
                  AND su.store_id = %I.store_id
              )
            );
          $pol$, t, t, t);

        END IF;
      END IF;
    END IF;
  END LOOP;
END $$;

-- -----------------------------
-- 6) GRANTS (hardening mínimo)
--    - anon NÃO deve ter privilégio em tabelas sensíveis financeiras/tenancy
--    - authenticated: manter, pois RLS governa; ajuste fino depois
-- -----------------------------
REVOKE ALL ON TABLE public.tenants FROM anon;
REVOKE ALL ON TABLE public.store_users FROM anon;
REVOKE ALL ON TABLE public.users FROM anon;

REVOKE ALL ON TABLE public.invoices FROM anon;
REVOKE ALL ON TABLE public.payment_history FROM anon;
REVOKE ALL ON TABLE public.tenant_subscriptions FROM anon;

-- Se você expõe cardápio publicamente, você pode re-grantar SELECT em products/categories/stores/etc
-- (NÃO faço aqui para evitar abrir superfície sem confirmar seu modelo).

COMMIT;

-- -----------------------------
-- 7) Pós-check (somente leitura)
-- -----------------------------
-- 7.1: RLS + policy_count
-- SELECT n.nspname AS schema, c.relname AS table, c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS rls_forced,
--   (SELECT count(*) FROM pg_policies p WHERE p.schemaname=n.nspname AND p.tablename=c.relname) AS policy_count
-- FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
-- WHERE n.nspname='public' AND c.relkind='r'
--   AND c.relname IN ('invoices','payment_history','tenant_subscriptions','tenants','customers','orders','order_items','users')
-- ORDER BY 1,2;

-- 7.2: tenants policies (garantir que não sobrou qual=true / auth.uid()!=null)
-- SELECT * FROM pg_policies WHERE schemaname='public' AND tablename='tenants' ORDER BY policyname;
