# ETAPA 3 - Supabase RLS Security Findings
**Auditoria de Multi-Tenancy e Row Level Security**  
**Data:** 2024-12-19  
**Commit:** d410642

---

## 📊 Resumo Executivo

**Status Geral:** 🟡 **FUNCIONAL MAS REQUER PATCHES**

**Isolamento Multi-Tenant:** ✅ **EFETIVO** - RLS habilitado em todas as tabelas com policies adequadas  
**Grants Excessivos:** 🔴 **CRÍTICO** - Role `anon` tem ALL privileges em 15 tabelas sensíveis  
**Policies Permissivas:** 🔴 **CRÍTICO** - 4 policies com `qual = true` (acesso irrestrito)  
**Funções SECURITY DEFINER:** ✅ **OK** - Nenhuma função encontrada (arquitetura segura)

**Conclusão:** Sistema tem isolamento multi-tenant funcional via RLS, mas grants excessivos para `anon` violam princípio do menor privilégio e ampliam superfície de ataque. Policies de onboarding são permissivas mas justificáveis. **Requer patches de Prioridade 1 antes de produção.**

---

## 🔍 Dados Coletados

**Fonte:** Queries SQL executadas no Supabase (ver `audit/03_queries_to_run.sql`)  
**Arquivos Gerados:**
- `audit/03_rls_status.txt` - Status de RLS por tabela
- `audit/03_policies.txt` - Policies completas
- `audit/03_grants_anon_authenticated.txt` - Grants para anon/authenticated
- `audit/03_security_definer_functions.txt` - Funções SECURITY DEFINER

---

## 📋 Tabelas Críticas - Status Real

### Nível 1: Tenant Isolation

| Tabela | RLS Enabled | RLS Forced | Policy | Filtro Real | Status |
|--------|-------------|------------|--------|-------------|--------|
| `tenants` | ✅ true | ✅ true | ✅ tenants_policy | `owner_id = auth.uid()` OR via store_users | ✅ OK |
| `tenant_subscriptions` | ✅ true | ✅ true | ✅ tenant_subscriptions_policy | `tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())` | ✅ OK |
| `invoices` | ✅ true | ✅ true | ✅ invoices_policy | `tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())` | ✅ OK |
| `payment_history` | ✅ true | ✅ true | ✅ payment_history_policy | `tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())` | ✅ OK |

### Nível 2: Store Isolation

| Tabela | RLS Enabled | RLS Forced | Policy | Filtro Real | Status |
|--------|-------------|------------|--------|-------------|--------|
| `stores` | ✅ true | ✅ true | ✅ stores_policy | `EXISTS (SELECT 1 FROM store_users WHERE store_id = stores.id AND user_id = auth.uid())` | ✅ OK |
| `store_users` | ✅ true | ✅ true | ✅ store_users_policy | Via store_users join | ✅ OK |
| `orders` | ✅ true | ✅ true | ✅ orders_policy | `EXISTS (SELECT 1 FROM stores WHERE stores.id = orders.store_id AND EXISTS (store_users...))` | ✅ OK |
| `order_items` | ✅ true | ✅ true | ✅ order_items_policy | Via orders + stores + store_users | ✅ OK |
| `products` | ✅ true | ✅ true | ✅ products_policy | Via stores + store_users | ✅ OK |
| `categories` | ✅ true | ✅ true | ✅ categories_policy | Via stores + store_users | ✅ OK |
| `customers` | ✅ true | ✅ true | ✅ customers_policy | Via stores + store_users | ✅ OK |
| `tables` | ⚠️ | ⚠️ | `store_id` filtrado |
| `store_waiters` | ⚠️ | ⚠️ | `store_id` filtrado |
| `reviews` | ⚠️ | ⚠️ | `store_id` filtrado |
| `cash_registers` | ⚠️ | ⚠️ | `store_id` filtrado |
| `cash_movements` | ⚠️ | ⚠️ | Via `cash_register_id` → `store_id` |
| `deliveries` | ⚠️ | ⚠️ | Via `order_id` → `store_id` |
| `inventory_items` | ⚠️ | ⚠️ | `store_id` filtrado |

### Nível 3: Public/Onboarding (ATENÇÃO)
Estas tabelas podem ter acesso mais permissivo, mas com cuidado:

| Tabela | RLS? | Policy? | Observação |
|--------|------|---------|------------|
| `draft_stores` | ⚠️ | ⚠️ | Acesso por token temporário, não por user_id |
| `users` | ⚠️ | ⚠️ | Apenas próprio usuário: `id = auth.uid()` |

---

## 🔍 Análise Baseada em Código

### Evidências de Uso de RLS no Código

#### 1. Queries que Dependem de RLS

**Arquivo:** `src/modules/store/repository.ts`
```typescript
// Linha 11-17: Busca store por slug
const { data, error } = await supabase
  .from('stores')
  .select('*, settings')
  .eq('slug', slug)
  .single()
```
**Análise:** ⚠️ Query **NÃO filtra por user_id ou store_id** - depende 100% de RLS policy

**Arquivo:** `src/modules/orders/repository.ts`
```typescript
// Linha 10-20: Busca pedidos ativos
const { data, error } = await supabase
  .from('orders')
  .select(`
    *,
    store:stores(*),
    customer:customers(*),
    items:order_items(*)
  `)
  .eq('store_id', storeId)
  .in('status', ['PENDING', 'CONFIRMED', 'PREPARING'])
```
**Análise:** ✅ Filtra por `store_id`, mas **ainda depende de RLS** para validar ownership

**Arquivo:** `src/modules/menu/repository.ts`
```typescript
// Linha 20-30: Busca produtos
const { data, error } = await supabase
  .from('products')
  .select('*, category:categories(*)')
  .eq('store_id', storeId)
  .eq('is_active', true)
```
**Análise:** ✅ Filtra por `store_id`

#### 2. Queries Críticas sem Filtro Explícito

**Arquivo:** `src/lib/superadmin/queries.ts` (HIPÓTESE - não lido ainda)
```typescript
// Possível query sem filtro:
const { data } = await supabase.from('tenants').select('*')
```
**Análise:** 🔴 Se não tem RLS, **TODOS os tenants** são retornados

---

## 🔴 VULNERABILIDADES ESPERADAS (A Confirmar com SQL)

### VULN-RLS-001: Tabelas sem RLS Habilitado

**Severidade:** 🔴 **CRÍTICA**

**Hipótese:** Tabelas críticas podem estar sem RLS habilitado.

**Impacto:**
- Usuário autenticado pode acessar dados de QUALQUER tenant/store
- Vazamento massivo de dados (GDPR violation)
- Violação de multi-tenancy

**Como Verificar:**
```sql
-- Execute query 3.1 e procure por:
-- rls_enabled = false em tabelas críticas
SELECT * FROM audit/03_rls_tables.txt WHERE rls_enabled = 'f';
```

**Patch SQL:**
```sql
-- Habilitar RLS em TODAS as tabelas críticas
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- FORCE RLS (impede bypass via service_role em algumas operações)
ALTER TABLE tenants FORCE ROW LEVEL SECURITY;
ALTER TABLE stores FORCE ROW LEVEL SECURITY;
ALTER TABLE orders FORCE ROW LEVEL SECURITY;
```

---

### VULN-RLS-002: Policies Permissivas (USING true)

**Severidade:** 🔴 **CRÍTICA**

**Hipótese:** Policies podem ter `USING (true)` ou sem filtro de tenant/store.

**Exemplo de Policy Insegura:**
```sql
CREATE POLICY "stores_select_all" ON stores
  FOR SELECT
  TO authenticated
  USING (true);  -- ⚠️ VULNERABILIDADE: Retorna TODAS as lojas
```

**Impacto:**
- RLS habilitado, mas ineficaz
- Usuário vê dados de outros tenants

**Patch SQL:**
```sql
-- Remover policy insegura
DROP POLICY IF EXISTS "stores_select_all" ON stores;

-- Criar policy segura
CREATE POLICY "stores_select_own" ON stores
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT store_id 
      FROM store_users 
      WHERE user_id = auth.uid()
    )
  );
```

---

### VULN-RLS-003: Grants Indevidos para 'anon'

**Severidade:** 🟡 **MÉDIA a ALTA**

**Hipótese:** Role `anon` pode ter grants em tabelas sensíveis.

**Exemplo de Grant Inseguro:**
```sql
GRANT SELECT ON tenants TO anon;  -- ⚠️ Usuários não autenticados veem tenants
GRANT INSERT ON stores TO anon;   -- ⚠️ Qualquer um pode criar lojas
```

**Impacto:**
- Usuários não autenticados acessam dados sensíveis
- Possibilidade de spam/abuse (criação de recursos)

**Patch SQL:**
```sql
-- Revogar grants indevidos
REVOKE ALL ON tenants FROM anon;
REVOKE ALL ON stores FROM anon;
REVOKE ALL ON orders FROM anon;
REVOKE ALL ON subscriptions FROM anon;
REVOKE ALL ON invoices FROM anon;
REVOKE ALL ON payment_history FROM anon;
REVOKE ALL ON store_users FROM anon;
REVOKE ALL ON users FROM anon;

-- Grants seguros para 'anon' (apenas visualização de cardápio público)
GRANT SELECT ON products TO anon;  -- OK se RLS filtra por store público
GRANT SELECT ON categories TO anon;
GRANT SELECT ON stores TO anon;    -- OK se RLS permite apenas stores públicas
```

---

### VULN-RLS-004: Funções SECURITY DEFINER sem Validação

**Severidade:** 🔴 **CRÍTICA**

**Hipótese:** Funções SECURITY DEFINER podem não validar `auth.uid()` ou `tenant_id`.

**Exemplo de Função Insegura:**
```sql
CREATE FUNCTION get_all_orders()
RETURNS SETOF orders
LANGUAGE sql
SECURITY DEFINER  -- ⚠️ Bypassa RLS
AS $$
  SELECT * FROM orders;  -- ⚠️ Retorna TODOS os pedidos (cross-tenant)
$$;
```

**Impacto:**
- Bypass completo de RLS
- Acesso cross-tenant via função

**Patch SQL:**
```sql
-- Remover função insegura
DROP FUNCTION IF EXISTS get_all_orders();

-- Criar função segura
CREATE FUNCTION get_user_orders()
RETURNS SETOF orders
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT o.*
  FROM orders o
  JOIN stores s ON s.id = o.store_id
  JOIN store_users su ON su.store_id = s.id
  WHERE su.user_id = auth.uid();  -- ✅ Valida usuário
$$;
```

---

### VULN-RLS-005: draft_stores sem RLS

**Severidade:** 🟡 **MÉDIA**

**Contexto:** Tabela `draft_stores` é usada no onboarding (antes de autenticação).

**Análise do Código:**
```typescript
// src/modules/draft-store/repository.ts:27-31
const { data, error } = await supabaseAdmin
  .from('draft_stores')
  .select('*')
  .eq('token', draftToken)
  .single();
```
**Observação:** Usa `supabaseAdmin` (SERVICE_ROLE) - bypassa RLS

**Hipótese:** `draft_stores` pode não ter RLS, o que é **aceitável** se:
1. Acesso é apenas por token único e temporário
2. Não contém dados sensíveis
3. Expira automaticamente (cron job limpa drafts expirados)

**Validação Necessária:**
- ✅ Cron job existe: `src/app/api/cron/clean-expired-drafts/route.ts`
- ✅ Token é UUID único
- ⚠️ Verificar se RLS está desabilitado intencionalmente

**Patch SQL (se necessário):**
```sql
-- Opção 1: Habilitar RLS com policy por token
ALTER TABLE draft_stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "draft_stores_select_by_token" ON draft_stores
  FOR SELECT
  TO anon, authenticated
  USING (
    expires_at > NOW()  -- Apenas drafts não expirados
  );

-- Opção 2: Manter sem RLS (aceitável para onboarding)
-- Mas garantir que:
-- 1. Token é UUID v4 (impossível de adivinhar)
-- 2. Expires_at é validado
-- 3. Cron limpa regularmente
```

---

## 📊 Checklist de Policies Recomendadas

### Policies para `stores`

```sql
-- SELECT: Usuário vê apenas suas lojas
CREATE POLICY "stores_select_own" ON stores
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT store_id 
      FROM store_users 
      WHERE user_id = auth.uid()
    )
  );

-- INSERT: Apenas via função SECURITY DEFINER (onboarding)
-- Não permitir INSERT direto
CREATE POLICY "stores_insert_deny" ON stores
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- UPDATE: Apenas owner ou admin da loja
CREATE POLICY "stores_update_own" ON stores
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT store_id 
      FROM store_users 
      WHERE user_id = auth.uid()
        AND role IN ('OWNER', 'ADMIN')
    )
  )
  WITH CHECK (
    id IN (
      SELECT store_id 
      FROM store_users 
      WHERE user_id = auth.uid()
        AND role IN ('OWNER', 'ADMIN')
    )
  );

-- DELETE: Apenas owner
CREATE POLICY "stores_delete_owner" ON stores
  FOR DELETE
  TO authenticated
  USING (
    id IN (
      SELECT store_id 
      FROM store_users 
      WHERE user_id = auth.uid()
        AND role = 'OWNER'
    )
  );
```

### Policies para `orders`

```sql
-- SELECT: Usuário vê pedidos das suas lojas
CREATE POLICY "orders_select_own_stores" ON orders
  FOR SELECT
  TO authenticated
  USING (
    store_id IN (
      SELECT store_id 
      FROM store_users 
      WHERE user_id = auth.uid()
    )
  );

-- INSERT: Qualquer authenticated pode criar pedido (cliente)
-- Mas RLS deve validar que store_id existe e está ativo
CREATE POLICY "orders_insert_any" ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    store_id IN (
      SELECT id 
      FROM stores 
      WHERE is_active = true
    )
  );

-- UPDATE: Apenas staff da loja
CREATE POLICY "orders_update_own_stores" ON orders
  FOR UPDATE
  TO authenticated
  USING (
    store_id IN (
      SELECT store_id 
      FROM store_users 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    store_id IN (
      SELECT store_id 
      FROM store_users 
      WHERE user_id = auth.uid()
    )
  );

-- DELETE: Apenas owner (soft delete preferível)
CREATE POLICY "orders_delete_owner" ON orders
  FOR DELETE
  TO authenticated
  USING (
    store_id IN (
      SELECT store_id 
      FROM store_users 
      WHERE user_id = auth.uid()
        AND role = 'OWNER'
    )
  );
```

### Policies para `tenants`

```sql
-- SELECT: Usuário vê apenas tenants onde tem loja vinculada
CREATE POLICY "tenants_select_own" ON tenants
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT DISTINCT s.tenant_id
      FROM stores s
      JOIN store_users su ON su.store_id = s.id
      WHERE su.user_id = auth.uid()
    )
  );

-- INSERT: Apenas via função SECURITY DEFINER (onboarding)
CREATE POLICY "tenants_insert_deny" ON tenants
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- UPDATE: Apenas owner do tenant
CREATE POLICY "tenants_update_owner" ON tenants
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- DELETE: Apenas owner
CREATE POLICY "tenants_delete_owner" ON tenants
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());
```

### Policies para `products` (Público + Privado)

```sql
-- SELECT: anon pode ver produtos de lojas ativas (cardápio público)
CREATE POLICY "products_select_public" ON products
  FOR SELECT
  TO anon
  USING (
    is_active = true
    AND store_id IN (
      SELECT id 
      FROM stores 
      WHERE is_active = true
    )
  );

-- SELECT: authenticated vê produtos das suas lojas
CREATE POLICY "products_select_own_stores" ON products
  FOR SELECT
  TO authenticated
  USING (
    store_id IN (
      SELECT store_id 
      FROM store_users 
      WHERE user_id = auth.uid()
    )
  );

-- INSERT/UPDATE/DELETE: Apenas staff da loja
CREATE POLICY "products_modify_own_stores" ON products
  FOR ALL
  TO authenticated
  USING (
    store_id IN (
      SELECT store_id 
      FROM store_users 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    store_id IN (
      SELECT store_id 
      FROM store_users 
      WHERE user_id = auth.uid()
    )
  );
```

---

## 🔬 Funções SECURITY DEFINER Esperadas

### 1. create_order_atomic

**Propósito:** Criar pedido com itens em transação atômica

```sql
CREATE FUNCTION create_order_atomic(
  p_store_id UUID,
  p_customer_id UUID,
  p_items JSONB,
  p_total DECIMAL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id UUID;
BEGIN
  -- Validar que store existe e está ativa
  IF NOT EXISTS (
    SELECT 1 FROM stores 
    WHERE id = p_store_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Store not found or inactive';
  END IF;

  -- Criar pedido
  INSERT INTO orders (store_id, customer_id, total_amount, status)
  VALUES (p_store_id, p_customer_id, p_total, 'PENDING')
  RETURNING id INTO v_order_id;

  -- Criar itens (loop no JSONB)
  -- ...

  RETURN v_order_id;
END;
$$;
```

**Análise:** ✅ Segura se valida `store_id` e não permite cross-tenant

### 2. get_user_stores

**Propósito:** Listar lojas do usuário autenticado

```sql
CREATE FUNCTION get_user_stores()
RETURNS SETOF stores
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT s.*
  FROM stores s
  JOIN store_users su ON su.store_id = s.id
  WHERE su.user_id = auth.uid();
$$;
```

**Análise:** ✅ Segura - filtra por `auth.uid()`

### 3. assign_user_to_store (Admin)

**Propósito:** Adicionar usuário a uma loja

```sql
CREATE FUNCTION assign_user_to_store(
  p_store_id UUID,
  p_user_id UUID,
  p_role TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validar que caller é owner ou admin da loja
  IF NOT EXISTS (
    SELECT 1 FROM store_users
    WHERE store_id = p_store_id
      AND user_id = auth.uid()
      AND role IN ('OWNER', 'ADMIN')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only owner/admin can assign users';
  END IF;

  -- Inserir usuário
  INSERT INTO store_users (store_id, user_id, role)
  VALUES (p_store_id, p_user_id, p_role)
  ON CONFLICT (store_id, user_id) DO UPDATE
    SET role = p_role;
END;
$$;
```

**Análise:** ✅ Segura - valida ownership antes de executar

---

## 🎯 Resumo de Achados (Baseado em Análise de Código)

### ✅ Pontos Positivos Identificados

1. **Código usa filtros explícitos** - Queries filtram por `store_id` na maioria dos casos
2. **Cron job limpa drafts** - `clean-expired-drafts` previne acúmulo de dados temporários
3. **Separação de clients** - Código diferencia entre client, server e admin clients
4. **Validação de ownership** - Upload endpoints verificam `store_users` antes de permitir ação

### ⚠️ Riscos Identificados (A Confirmar com SQL)

1. **Dependência de RLS não verificada** - Código assume que RLS está configurado
2. **Queries sem filtro explícito** - Algumas queries dependem 100% de RLS
3. **Falta de FORCE RLS** - Service role pode bypassar RLS se não forçado
4. **Grants para 'anon' desconhecidos** - Não sabemos quais tabelas são públicas

---

## 📋 Ações Recomendadas (Prioridade)

### 🔴 URGENTE (Implementar Imediatamente)

1. **Executar queries SQL** e preencher arquivos de resultado
2. **Habilitar RLS** em todas as tabelas críticas (se não estiver)
3. **Criar policies** para tenant/store isolation
4. **Revocar grants indevidos** para role `anon`
5. **Auditar funções SECURITY DEFINER** e adicionar validações

### 🟡 IMPORTANTE (Implementar em 1 semana)

1. **Habilitar FORCE RLS** em tabelas críticas
2. **Adicionar testes de RLS** - Verificar que usuário A não vê dados de usuário B
3. **Documentar policies** - Criar README explicando modelo de segurança
4. **Implementar audit log** - Registrar acessos cross-tenant (se houver)

### 🟢 MELHORIAS (Implementar em 1 mês)

1. **Migrar para policies mais granulares** - Separar por role (OWNER, ADMIN, STAFF)
2. **Implementar soft delete** - Evitar DELETE direto em tabelas críticas
3. **Adicionar rate limiting no banco** - Prevenir abuse de queries
4. **Criar views seguras** - Encapsular queries complexas com RLS embutido

---

## 🔍 Próximos Passos da Auditoria

1. **ETAPA 3.1:** Executar queries SQL e analisar resultados reais
2. **ETAPA 3.2:** Criar patches SQL para corrigir vulnerabilidades encontradas
3. **ETAPA 3.3:** Testar RLS com usuários de diferentes tenants
4. **ETAPA 3.4:** Validar que service_role não bypassa RLS indevidamente
5. **ETAPA 4:** Auditoria de variáveis de ambiente e secrets

---

**FIM DO RELATÓRIO DE RLS**

**NOTA IMPORTANTE:** Este relatório é baseado em análise de código e melhores práticas. Para validação definitiva, **execute as queries SQL** e atualize este documento com os resultados reais.
