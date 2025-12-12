# Matriz RLS (Row Level Security)

**Data:** 12 de Dezembro de 2025  
**Versão:** 1.0  
**Status:** Completo

---

## 📊 Resumo Executivo

- **Tabelas com RLS:** 11/14 (79%)
- **Policies Implementadas:** 43
- **Policies Faltantes:** 8
- **Cobertura:** 🟡 **OK** (precisa completar)

---

## 🗂️ Matriz Completa de Policies

### Legenda
- ✅ Policy implementada
- ❌ Policy faltante
- ⚠️ Policy incompleta
- 🔴 Tabela sem RLS

---

## 1. STORES

**RLS Status:** ✅ Habilitado

| Operação | Policy | Status | Descrição |
|----------|--------|--------|-----------|
| SELECT | ✅ | Implementada | Usuários veem lojas onde são membros |
| INSERT | ❌ | Faltante | Apenas super admin pode criar lojas |
| UPDATE | ❌ | Faltante | Apenas owners podem atualizar |
| DELETE | ❌ | Faltante | Apenas super admin pode deletar |

**Policy Atual:**
```sql
CREATE POLICY "Users can read their stores"
  ON stores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM store_users
      WHERE store_users.store_id = stores.id
        AND store_users.user_id = auth.uid()
    )
  );
```

**Policies Faltantes:**
```sql
-- INSERT: Apenas super admin
CREATE POLICY "Only super admins can create stores"
  ON stores FOR INSERT
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
  );

-- UPDATE: Apenas owners
CREATE POLICY "Store owners can update their stores"
  ON stores FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM store_users
      WHERE store_users.store_id = stores.id
        AND store_users.user_id = auth.uid()
        AND store_users.role = 'owner'
    )
  );

-- DELETE: Apenas super admin
CREATE POLICY "Only super admins can delete stores"
  ON stores FOR DELETE
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
  );
```

---

## 2. PRODUCTS

**RLS Status:** ✅ Habilitado

| Operação | Policy | Status | Descrição |
|----------|--------|--------|-----------|
| SELECT | ✅ | Implementada | Usuários veem produtos de suas lojas |
| INSERT | ✅ | Implementada | Usuários criam produtos em suas lojas |
| UPDATE | ✅ | Implementada | Usuários editam produtos de suas lojas |
| DELETE | ✅ | Implementada | Usuários deletam produtos de suas lojas |

**Policies:**
```sql
CREATE POLICY "Users can read products from their stores"
  ON products FOR SELECT
  USING (user_has_store_access(store_id));

CREATE POLICY "Users can insert products to their stores"
  ON products FOR INSERT
  WITH CHECK (user_has_store_access(store_id));

CREATE POLICY "Users can update products in their stores"
  ON products FOR UPDATE
  USING (user_has_store_access(store_id));

CREATE POLICY "Users can delete products from their stores"
  ON products FOR DELETE
  USING (user_has_store_access(store_id));
```

**Status:** ✅ **COMPLETO**

---

## 3. CATEGORIES

**RLS Status:** ✅ Habilitado

| Operação | Policy | Status | Descrição |
|----------|--------|--------|-----------|
| SELECT | ✅ | Implementada | Usuários veem categorias de suas lojas |
| INSERT | ✅ | Implementada | Usuários criam categorias em suas lojas |
| UPDATE | ✅ | Implementada | Usuários editam categorias de suas lojas |
| DELETE | ✅ | Implementada | Usuários deletam categorias de suas lojas |

**Status:** ✅ **COMPLETO**

---

## 4. ORDERS

**RLS Status:** ✅ Habilitado

| Operação | Policy | Status | Descrição |
|----------|--------|--------|-----------|
| SELECT | ✅ | Implementada | Usuários veem pedidos de suas lojas |
| INSERT | ✅ | Implementada | Usuários criam pedidos em suas lojas |
| UPDATE | ✅ | Implementada | Usuários editam pedidos de suas lojas |
| DELETE | ✅ | Implementada | Usuários deletam pedidos de suas lojas |

**Policies:**
```sql
CREATE POLICY "Users can read orders from their stores"
  ON orders FOR SELECT
  USING (user_has_store_access(store_id));

CREATE POLICY "Users can insert orders to their stores"
  ON orders FOR INSERT
  WITH CHECK (user_has_store_access(store_id));

CREATE POLICY "Users can update orders in their stores"
  ON orders FOR UPDATE
  USING (user_has_store_access(store_id));

CREATE POLICY "Users can delete orders from their stores"
  ON orders FOR DELETE
  USING (user_has_store_access(store_id));
```

**Status:** ✅ **COMPLETO**

---

## 5. ORDER_ITEMS

**RLS Status:** ✅ Habilitado

| Operação | Policy | Status | Descrição |
|----------|--------|--------|-----------|
| SELECT | ✅ | Implementada | Via join com orders |
| INSERT | ✅ | Implementada | Via join com orders |
| UPDATE | ✅ | Implementada | Via join com orders |
| DELETE | ✅ | Implementada | Via join com orders |

**Policies (exemplo SELECT):**
```sql
CREATE POLICY "Users can read order items from their stores"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND user_has_store_access(orders.store_id)
    )
  );
```

**Status:** ✅ **COMPLETO**

---

## 6. DELIVERIES

**RLS Status:** ✅ Habilitado

| Operação | Policy | Status | Descrição |
|----------|--------|--------|-----------|
| SELECT | ✅ | Implementada | Via join com orders |
| INSERT | ✅ | Implementada | Via join com orders |
| UPDATE | ✅ | Implementada | Via join com orders |
| DELETE | ✅ | Implementada | Via join com orders |

**Status:** ✅ **COMPLETO**

---

## 7. CUSTOMERS

**RLS Status:** ✅ Habilitado

| Operação | Policy | Status | Descrição |
|----------|--------|--------|-----------|
| SELECT | ✅ | Implementada | Usuários veem clientes de suas lojas |
| INSERT | ✅ | Implementada | Usuários criam clientes em suas lojas |
| UPDATE | ✅ | Implementada | Usuários editam clientes de suas lojas |
| DELETE | ✅ | Implementada | Usuários deletam clientes de suas lojas |

**Status:** ✅ **COMPLETO**

---

## 8. CUSTOMER_ADDRESSES

**RLS Status:** ✅ Habilitado

| Operação | Policy | Status | Descrição |
|----------|--------|--------|-----------|
| SELECT | ✅ | Implementada | Via join com customers |
| INSERT | ✅ | Implementada | Via join com customers |
| UPDATE | ✅ | Implementada | Via join com customers |
| DELETE | ✅ | Implementada | Via join com customers |

**Status:** ✅ **COMPLETO**

---

## 9. COUPONS

**RLS Status:** ✅ Habilitado

| Operação | Policy | Status | Descrição |
|----------|--------|--------|-----------|
| SELECT | ✅ | Implementada | Usuários veem cupons de suas lojas |
| INSERT | ✅ | Implementada | Usuários criam cupons em suas lojas |
| UPDATE | ✅ | Implementada | Usuários editam cupons de suas lojas |
| DELETE | ✅ | Implementada | Usuários deletam cupons de suas lojas |

**Status:** ✅ **COMPLETO**

---

## 10. MODIFIERS

**RLS Status:** ✅ Habilitado

| Operação | Policy | Status | Descrição |
|----------|--------|--------|-----------|
| SELECT | ✅ | Implementada | Usuários veem modificadores de suas lojas |
| INSERT | ✅ | Implementada | Usuários criam modificadores em suas lojas |
| UPDATE | ✅ | Implementada | Usuários editam modificadores de suas lojas |
| DELETE | ✅ | Implementada | Usuários deletam modificadores de suas lojas |

**Status:** ✅ **COMPLETO**

---

## 11. MODIFIER_OPTIONS

**RLS Status:** ✅ Habilitado

| Operação | Policy | Status | Descrição |
|----------|--------|--------|-----------|
| SELECT | ✅ | Implementada | Via join com modifiers |
| INSERT | ✅ | Implementada | Via join com modifiers |
| UPDATE | ✅ | Implementada | Via join com modifiers |
| DELETE | ✅ | Implementada | Via join com modifiers |

**Status:** ✅ **COMPLETO**

---

## 12. STORE_USERS

**RLS Status:** ⚠️ Habilitado (INCOMPLETO)

| Operação | Policy | Status | Descrição |
|----------|--------|--------|-----------|
| SELECT | ✅ | Implementada | Usuários veem membros de suas lojas |
| INSERT | ✅ | Implementada | Apenas owners podem adicionar membros |
| UPDATE | ❌ | **FALTANTE** | Apenas owners podem mudar roles |
| DELETE | ❌ | **FALTANTE** | Apenas owners podem remover membros |

**Policies Atuais:**
```sql
CREATE POLICY "Users can view store members"
  ON store_users FOR SELECT
  USING (user_has_store_access(store_id));

CREATE POLICY "Store owners can add members"
  ON store_users FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM store_users
      WHERE store_id = store_users.store_id
        AND user_id = auth.uid()
        AND role = 'owner'
    )
  );
```

**Policies Faltantes:**
```sql
-- UPDATE: Apenas owners podem mudar roles
CREATE POLICY "Store owners can update member roles"
  ON store_users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM store_users su
      WHERE su.store_id = store_users.store_id
        AND su.user_id = auth.uid()
        AND su.role = 'owner'
    )
  );

-- DELETE: Apenas owners podem remover membros
CREATE POLICY "Store owners can remove members"
  ON store_users FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM store_users su
      WHERE su.store_id = store_users.store_id
        AND su.user_id = auth.uid()
        AND su.role = 'owner'
    )
  );
```

**Severidade:** 🔴 **HIGH**  
**Prazo:** 1 dia

---

## 13. TENANTS

**RLS Status:** 🔴 **NÃO HABILITADO**

| Operação | Policy | Status | Descrição |
|----------|--------|--------|-----------|
| SELECT | ❌ | **FALTANTE** | Apenas super admin |
| INSERT | ❌ | **FALTANTE** | Apenas super admin |
| UPDATE | ❌ | **FALTANTE** | Apenas super admin |
| DELETE | ❌ | **FALTANTE** | Apenas super admin |

**Policies Necessárias:**
```sql
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Apenas super admins podem acessar
CREATE POLICY "Only super admins can access tenants"
  ON tenants FOR ALL
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
  );
```

**Severidade:** 🔴 **HIGH**  
**Prazo:** 1 dia

---

## 14. PLANS

**RLS Status:** 🔴 **NÃO HABILITADO**

| Operação | Policy | Status | Descrição |
|----------|--------|--------|-----------|
| SELECT | ❌ | **FALTANTE** | Todos podem ler |
| INSERT | ❌ | **FALTANTE** | Apenas super admin |
| UPDATE | ❌ | **FALTANTE** | Apenas super admin |
| DELETE | ❌ | **FALTANTE** | Apenas super admin |

**Policies Necessárias:**
```sql
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- Todos podem ler planos
CREATE POLICY "Everyone can read plans"
  ON plans FOR SELECT
  USING (true);

-- Apenas super admins podem gerenciar
CREATE POLICY "Only super admins can manage plans"
  ON plans FOR INSERT, UPDATE, DELETE
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
  );
```

**Severidade:** 🔴 **HIGH**  
**Prazo:** 1 dia

---

## 15. SUBSCRIPTIONS

**RLS Status:** 🔴 **NÃO HABILITADO**

| Operação | Policy | Status | Descrição |
|----------|--------|--------|-----------|
| SELECT | ❌ | **FALTANTE** | Usuários veem suas subscriptions |
| INSERT | ❌ | **FALTANTE** | Apenas super admin |
| UPDATE | ❌ | **FALTANTE** | Apenas super admin |
| DELETE | ❌ | **FALTANTE** | Apenas super admin |

**Policies Necessárias:**
```sql
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Usuários podem ler suas subscriptions
CREATE POLICY "Users can read their subscriptions"
  ON subscriptions FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM stores
      WHERE id IN (
        SELECT store_id FROM store_users
        WHERE user_id = auth.uid()
      )
    )
  );

-- Apenas super admins podem gerenciar
CREATE POLICY "Only super admins can manage subscriptions"
  ON subscriptions FOR INSERT, UPDATE, DELETE
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
  );
```

**Severidade:** 🔴 **HIGH**  
**Prazo:** 1 dia

---

## 🔍 Função Helper

### user_has_store_access()

**Implementação:**
```sql
CREATE OR REPLACE FUNCTION user_has_store_access(p_store_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM store_users
    WHERE user_id = auth.uid()
      AND store_id = p_store_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION user_has_store_access(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_store_access(UUID) TO anon;
```

**Uso:**
- Usada em 11 tabelas principais
- Simplifica policies
- Performance: O(1) com índice em store_users

**Otimização Sugerida:**
```sql
-- Adicionar índice composto para melhor performance
CREATE INDEX IF NOT EXISTS idx_store_users_lookup 
  ON store_users(user_id, store_id);
```

---

## 📊 Estatísticas

### Por Tabela

| Tabela | RLS | SELECT | INSERT | UPDATE | DELETE | Status |
|--------|-----|--------|--------|--------|--------|--------|
| stores | ✅ | ✅ | ❌ | ❌ | ❌ | ⚠️ 25% |
| products | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ 100% |
| categories | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ 100% |
| orders | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ 100% |
| order_items | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ 100% |
| deliveries | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ 100% |
| customers | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ 100% |
| customer_addresses | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ 100% |
| coupons | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ 100% |
| modifiers | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ 100% |
| modifier_options | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ 100% |
| store_users | ✅ | ✅ | ✅ | ❌ | ❌ | ⚠️ 50% |
| tenants | ❌ | ❌ | ❌ | ❌ | ❌ | 🔴 0% |
| plans | ❌ | ❌ | ❌ | ❌ | ❌ | 🔴 0% |
| subscriptions | ❌ | ❌ | ❌ | ❌ | ❌ | 🔴 0% |

### Resumo

- **Tabelas com RLS:** 12/15 (80%)
- **Policies Implementadas:** 43/59 (73%)
- **Policies Faltantes:** 16
- **Tabelas 100% completas:** 9/15 (60%)

---

## 🚨 Findings Priorizados

### 🔴 BLOCKER (0)
Nenhum blocker identificado.

### 🔴 HIGH (4)

1. **store_users falta UPDATE/DELETE**
   - **Impacto:** Membros não podem ser gerenciados
   - **Fix:** Adicionar 2 policies
   - **Prazo:** 1 dia

2. **tenants sem RLS**
   - **Impacto:** Dados sensíveis expostos
   - **Fix:** Habilitar RLS + 1 policy
   - **Prazo:** 1 dia

3. **plans sem RLS**
   - **Impacto:** Planos podem ser alterados
   - **Fix:** Habilitar RLS + 2 policies
   - **Prazo:** 1 dia

4. **subscriptions sem RLS**
   - **Impacto:** Dados financeiros expostos
   - **Fix:** Habilitar RLS + 2 policies
   - **Prazo:** 1 dia

### ⚠️ MEDIUM (1)

5. **stores falta INSERT/UPDATE/DELETE**
   - **Impacto:** Lojas podem ser manipuladas
   - **Fix:** Adicionar 3 policies
   - **Prazo:** 2 dias

---

## 🎯 Migration Script Completo

```sql
-- ============================================
-- MIGRATION: Complete RLS Policies
-- ============================================

-- 1. STORE_USERS: Adicionar UPDATE/DELETE
CREATE POLICY "Store owners can update member roles"
  ON store_users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM store_users su
      WHERE su.store_id = store_users.store_id
        AND su.user_id = auth.uid()
        AND su.role = 'owner'
    )
  );

CREATE POLICY "Store owners can remove members"
  ON store_users FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM store_users su
      WHERE su.store_id = store_users.store_id
        AND su.user_id = auth.uid()
        AND su.role = 'owner'
    )
  );

-- 2. TENANTS: Habilitar RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only super admins can access tenants"
  ON tenants FOR ALL
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
  );

-- 3. PLANS: Habilitar RLS
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read plans"
  ON plans FOR SELECT
  USING (true);

CREATE POLICY "Only super admins can manage plans"
  ON plans FOR INSERT, UPDATE, DELETE
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
  );

-- 4. SUBSCRIPTIONS: Habilitar RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their subscriptions"
  ON subscriptions FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM stores
      WHERE id IN (
        SELECT store_id FROM store_users
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Only super admins can manage subscriptions"
  ON subscriptions FOR INSERT, UPDATE, DELETE
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
  );

-- 5. STORES: Adicionar INSERT/UPDATE/DELETE
CREATE POLICY "Only super admins can create stores"
  ON stores FOR INSERT
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
  );

CREATE POLICY "Store owners can update their stores"
  ON stores FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM store_users
      WHERE store_users.store_id = stores.id
        AND store_users.user_id = auth.uid()
        AND store_users.role = 'owner'
    )
  );

CREATE POLICY "Only super admins can delete stores"
  ON stores FOR DELETE
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
  );

-- 6. OTIMIZAÇÃO: Índice composto
CREATE INDEX IF NOT EXISTS idx_store_users_lookup 
  ON store_users(user_id, store_id);
```

---

## 🎯 Plano de Ação

### Dia 1
- ✅ Executar migration script completo
- ✅ Testar todas as policies
- ✅ Verificar performance

### Dia 2
- ✅ Adicionar testes automatizados
- ✅ Documentar policies
- ✅ Code review

---

## ✅ Conclusão

O sistema tem **boa cobertura de RLS** (73%), mas precisa completar policies críticas em:
1. store_users (gerenciamento de membros)
2. tenants, plans, subscriptions (dados admin)
3. stores (operações de criação/edição)

**Após correções:** Cobertura esperada de **100%** 🟢
