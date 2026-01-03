# 📊 AUDIT_PLAN_TRUTH_TABLE - Planos de Assinatura

**Data:** 2026-01-03T04:45:00Z  
**Fonte de Verdade:** `supabase/migrations/20251221000003_stripe_billing_fields.sql:67-73`

---

## 🎯 PLANO: TRIAL

### Dados Declarados (DB)

| Campo | Valor | Fonte |
|-------|-------|-------|
| **ID** | `trial` | `subscription_plans.id` |
| **Nome** | Trial | `subscription_plans.name` |
| **Descrição** | Teste grátis por 10 dias | `subscription_plans.description` |
| **Preço Exibido** | R$ 0,00 | `subscription_plans.price_monthly_cents: 0` |
| **Preço Cobrado** | R$ 0,00 | N/A (trial não cobra) |
| **Periodicidade** | 10 dias (trial) | Hardcoded em lógica |
| **Moeda** | BRL | `subscription_plans.currency` (default) |
| **Provider** | Nenhum | N/A |
| **Stripe Price ID** | `null` | `subscription_plans.stripe_price_id` |
| **MP Preapproval ID** | N/A | Não aplicável |
| **Features Prometidas** | `["dashboard", "products", "orders", "settings"]` | `subscription_plans.features` (4 features) |
| **Limites Prometidos** | `{"orders_per_month": 100}` | `subscription_plans.limits` |
| **Limites Realmente Aplicados** | ❌ NENHUM | Ver evidência abaixo |
| **Módulos Habilitados (Real)** | ~15 módulos | Verificado em `src/lib/superadmin/plan-modules.ts` |

### 🔴 DIVERGÊNCIAS CRÍTICAS

**DIVERGE: Limite orders_per_month NÃO é enforced**

**Evidência:**
```typescript
// src/modules/orders/actions.ts:90-108
export async function createOrderAction(...) {
  const tenantId = await getTenantIdFromStore(storeId)
  if (tenantId) {
    const billingCheck = await enforceBillingInAction(tenantId)
    // ✅ Checa status (trial/active/suspended)
    // ❌ NÃO CHECA orders_per_month
  }
  // ... cria pedido sem verificar limite
}
```

**Impacto:** Cliente pode fazer pedidos ilimitados durante trial (deveria ser 100/mês).

**DIVERGE: Features declaradas vs habilitadas**

| Declarado no DB | Habilitado no Sistema |
|-----------------|----------------------|
| 4 features | ~15 módulos acessíveis |
| dashboard, products, orders, settings | + pos, kitchen, delivery, tables, coupons, reports, analytics, etc. |

**Evidência:**  
Trial tem acesso via `isDemoMode` que libera `getAllModules()` em `src/app/[slug]/dashboard/layout.tsx:67`.

**Impacto:** Trial oferece muito mais do que prometido (não é problema comercial, mas inconsistência técnica).

---

## 💼 PLANO: BÁSICO

### Dados Declarados (DB)

| Campo | Valor | Fonte |
|-------|-------|-------|
| **ID** | `basic` | `subscription_plans.id` |
| **Nome** | Básico | `subscription_plans.name` |
| **Descrição** | Plano básico para começar | `subscription_plans.description` |
| **Preço Exibido** | R$ 49,00 | `subscription_plans.price_monthly_cents: 4900` |
| **Preço Cobrado** | R$ 49,00 | Via PIX Mercado Pago |
| **Periodicidade** | Mensal | `subscription_plans` (implícito) |
| **Moeda** | BRL | `subscription_plans.currency` (default) |
| **Provider** | Mercado Pago | `billing_config.default_gateway: 'mercadopago'` |
| **Stripe Price ID** | `null` | `subscription_plans.stripe_price_id` |
| **MP Preapproval ID** | ⚠️ A CONFIGURAR | Não encontrado no código |
| **Features Prometidas** | `["dashboard", "products", "orders", "settings", "pos"]` | `subscription_plans.features` (5 features) |
| **Limites Prometidos** | `{"orders_per_month": 500}` | `subscription_plans.limits` |
| **Limites Realmente Aplicados** | ❌ NENHUM | Ver evidência abaixo |
| **Módulos Habilitados (Real)** | ~15 módulos | Sistema não restringe por plano |

### 🔴 DIVERGÊNCIAS CRÍTICAS

**DIVERGE: Limite orders_per_month NÃO é enforced**

**Evidência:** Mesma do Trial - `createOrderAction` não verifica limites.

**Impacto:** Cliente pode fazer 1000+ pedidos/mês pagando apenas R$ 49.

**Margem de Segurança:**
- Preço: R$ 49,00
- Taxa MP PIX (1,99%): R$ 0,98
- Receita líquida: R$ 48,02
- COGS estimado: R$ 0 (notificações não ativas)
- Margem: 98% (OK por enquanto)

**Risco:** Se cliente usar >500 pedidos/mês, não há bloqueio nem cobrança extra.

**DIVERGE: Features declaradas vs habilitadas**

Mesmo problema do Trial - sistema não aplica restrição de features por plano.

---

## 🚀 PLANO: PRO

### Dados Declarados (DB)

| Campo | Valor | Fonte |
|-------|-------|-------|
| **ID** | `pro` | `subscription_plans.id` |
| **Nome** | Pro | `subscription_plans.name` |
| **Descrição** | Plano completo para crescer | `subscription_plans.description` |
| **Preço Exibido** | R$ 149,00 | `subscription_plans.price_monthly_cents: 14900` |
| **Preço Cobrado** | R$ 149,00 | Via PIX Mercado Pago |
| **Periodicidade** | Mensal | `subscription_plans` (implícito) |
| **Moeda** | BRL | `subscription_plans.currency` (default) |
| **Provider** | Mercado Pago | `billing_config.default_gateway: 'mercadopago'` |
| **Stripe Price ID** | `null` | `subscription_plans.stripe_price_id` |
| **MP Preapproval ID** | ⚠️ A CONFIGURAR | Não encontrado no código |
| **Features Prometidas** | 10 features | Ver abaixo |
| **Limites Prometidos** | `{"orders_per_month": -1}` | **-1 = ILIMITADO** |
| **Limites Realmente Aplicados** | ❌ NENHUM (mas declarado ilimitado) | Consistente com DB |
| **Módulos Habilitados (Real)** | ~20 módulos | Sistema não restringe |

**Features Declaradas:**
```json
["dashboard", "products", "orders", "settings", "pos", "kitchen", 
 "delivery", "tables", "coupons", "reports"]
```

### ⚠️ WARNINGS

**WARNING: Ilimitado literal pode ser abusado**

**Problema:**  
`orders_per_month: -1` significa literalmente ilimitado. Cliente pode fazer 100.000 pedidos/mês pagando R$ 149.

**Margem de Segurança:**
- Preço: R$ 149,00
- Taxa MP PIX (1,99%): R$ 2,97
- Receita líquida: R$ 146,03
- COGS estimado: R$ 0 (sem notificações)
- Margem: 98%

**Recomendação:**  
Definir soft limit (ex: 10.000 pedidos/mês) com alerta ao atingir, ou implementar overage billing.

**DIVERGE: Features declaradas vs habilitadas**

10 features declaradas, mas ~20 módulos acessíveis no sistema real.

---

## 🏢 PLANO: ENTERPRISE

### Dados Declarados (DB)

| Campo | Valor | Fonte |
|-------|-------|-------|
| **ID** | `enterprise` | `subscription_plans.id` |
| **Nome** | Enterprise | `subscription_plans.name` |
| **Descrição** | Plano para redes e franquias | `subscription_plans.description` |
| **Preço Exibido** | R$ 299,00 | `subscription_plans.price_monthly_cents: 29900` |
| **Preço Cobrado** | R$ 299,00 | Via PIX Mercado Pago |
| **Periodicidade** | Mensal | `subscription_plans` (implícito) |
| **Moeda** | BRL | `subscription_plans.currency` (default) |
| **Provider** | Mercado Pago | `billing_config.default_gateway: 'mercadopago'` |
| **Stripe Price ID** | `null` | `subscription_plans.stripe_price_id` |
| **MP Preapproval ID** | ⚠️ A CONFIGURAR | Não encontrado no código |
| **Features Prometidas** | 16 features | Ver abaixo |
| **Limites Prometidos** | `{"orders_per_month": -1, "stores": -1}` | **ILIMITADO em tudo** |
| **Limites Realmente Aplicados** | ❌ NENHUM | Nenhum enforcement |
| **Módulos Habilitados (Real)** | ~25 módulos | Sistema não restringe |

**Features Declaradas:**
```json
["dashboard", "products", "orders", "settings", "pos", "kitchen", 
 "delivery", "tables", "coupons", "reports", "analytics", "team", 
 "inventory", "financial", "crm", "marketing"]
```

### 🔴 DIVERGÊNCIAS CRÍTICAS

**DIVERGE: "stores: -1" permite abuso extremo**

**Problema:**  
Cliente pode criar 1000 lojas pagando R$ 299/mês (deveria ser por loja adicional).

**Evidência:**  
Não há verificação de `stores` limit em nenhum lugar do código.

**Impacto:**  
1 tenant, 100 lojas, pagando R$ 299. Custo de infra pode ser 10x o preço.

**Recomendação:**  
- Definir limite real (ex: 10 lojas incluídas)
- Cobrar R$ 50/loja adicional
- Ou exigir negociação comercial acima de N lojas

**Margem de Segurança:**
- Preço: R$ 299,00
- Taxa MP PIX (1,99%): R$ 5,95
- Receita líquida: R$ 293,05
- COGS estimado: R$ 0 (sem notificações)
- Margem: 98%

Margem é boa para 1 loja, mas se cliente criar 50 lojas:
- Custo de infra/storage/DB queries pode ultrapassar receita
- Sem mecanismo de proteção

---

## 📋 RESUMO DE DIVERGÊNCIAS

### Críticas (Bloqueiam Go-Live)

| Plano | Divergência | Impacto | Severidade |
|-------|-------------|---------|------------|
| **Trial** | orders_per_month (100) não enforced | Trial "infinito" | 🔴 CRÍTICO |
| **Básico** | orders_per_month (500) não enforced | Prejuízo se >500 pedidos | 🔴 CRÍTICO |
| **Pro** | orders_per_month ilimitado sem soft limit | Risco de abuso | ⚠️ WARNING |
| **Enterprise** | stores ilimitado sem controle | Risco de prejuízo | 🔴 CRÍTICO |
| **Todos** | Features DB vs Sistema desalinhadas | Inconsistência docs/produto | 🟡 IMPORTANTE |

### Por Categoria

**Pricing Correctness:**
- ✅ Preços no DB batem com valores exibidos
- ✅ Moeda consistente (BRL)
- ✅ Provider definido (Mercado Pago)
- ❌ Provider IDs não configurados (stripe_price_id, mp_preapproval_id)

**Enforcement:**
- ❌ orders_per_month: NÃO enforced (Trial, Básico)
- ❌ stores: NÃO enforced (Enterprise)
- ❌ Features: NÃO enforced (todos os planos)
- ✅ Billing status: enforced (trial expiration, suspension)

**Truth Map:**
- ✅ Fonte única: `subscription_plans` (DB)
- ✅ UI lê de DB
- ✅ Backend lê de DB
- ❌ Backend NÃO aplica limites lidos

---

## 🛠️ AÇÕES CORRETIVAS MÍNIMAS

### 1. Implementar Enforcement de orders_per_month

**Arquivo:** `src/modules/orders/actions.ts`  
**Localização:** Linha 98 (antes de criar pedido)

**Código a adicionar:**
```typescript
// Verificar limite de pedidos (se definido no plano)
const { data: subscription } = await supabase
  .from('subscriptions')
  .select('plan_id, subscription_plans!inner(limits)')
  .eq('tenant_id', tenantId)
  .single()

const limits = subscription?.subscription_plans?.limits || {}
const ordersLimit = limits.orders_per_month

if (ordersLimit && ordersLimit !== -1) {
  // Contar pedidos do mês atual
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  
  const { count } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('store_id', storeId)
    .gte('created_at', startOfMonth.toISOString())
  
  if (count && count >= ordersLimit) {
    return { 
      success: false, 
      error: `Limite de ${ordersLimit} pedidos/mês atingido. Faça upgrade do plano.`,
      errorCode: 'PLAN_LIMIT_REACHED'
    }
  }
}
```

**Tempo:** 1h (M)

---

### 2. Implementar Soft Limit para Ilimitados

**Arquivo:** `src/modules/orders/actions.ts`  
**Localização:** Após enforcement acima

**Lógica:**
```typescript
// Soft limit para planos "ilimitados"
if (ordersLimit === -1) {
  const SOFT_LIMIT = 10000 // Ajustar conforme análise
  
  const { count } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('store_id', storeId)
    .gte('created_at', startOfMonth.toISOString())
  
  if (count && count >= SOFT_LIMIT) {
    // Apenas log/alerta, não bloqueia
    logger.warn('[Billing] Tenant ${tenantId} atingiu soft limit', {
      count,
      limit: SOFT_LIMIT,
      planId: subscription.plan_id
    })
    // TODO: Enviar alerta para admin/tenant
  }
}
```

**Tempo:** 30min (S)

---

### 3. Definir Limite Real para Enterprise Stores

**Arquivo:** `supabase/migrations/20251221000003_stripe_billing_fields.sql`  
**Alteração:**

```sql
-- Atual (linha 72):
('enterprise', 'Enterprise', 'Plano para redes e franquias', 29900, 
 '...'::jsonb, 
 '{"orders_per_month": -1, "stores": -1}'::jsonb, 3)

-- Proposto:
('enterprise', 'Enterprise', 'Plano para redes e franquias', 29900, 
 '...'::jsonb, 
 '{"orders_per_month": -1, "stores": 10}'::jsonb, 3)
-- Ou: '{"orders_per_month": -1, "stores": 50}'::jsonb dependendo do negócio
```

**E implementar enforcement ao criar loja:**

```typescript
// src/app/api/onboarding/store/publish/route.ts (ou onde loja é criada)

const { data: storesCount } = await supabase
  .from('stores')
  .select('id', { count: 'exact', head: true })
  .eq('tenant_id', tenantId)

const { data: subscription } = await supabase
  .from('subscriptions')
  .select('subscription_plans!inner(limits)')
  .eq('tenant_id', tenantId)
  .single()

const storesLimit = subscription?.subscription_plans?.limits?.stores

if (storesLimit && storesLimit !== -1 && storesCount >= storesLimit) {
  return NextResponse.json({
    error: `Limite de ${storesLimit} lojas atingido. Faça upgrade ou entre em contato.`
  }, { status: 403 })
}
```

**Tempo:** 1h (M)

---

### 4. Atualizar Features no DB

**Opção A:** Atualizar DB para refletir sistema real  
**Opção B:** Implementar restrição de features por plano

**Recomendação:** Opção A (atualizar DB) - mais rápido para go-live.

**Migration SQL:**
```sql
UPDATE subscription_plans 
SET features = '["dashboard", "products", "orders", "settings", "pos", 
                "kitchen", "delivery", "tables", "coupons", "reports", 
                "analytics", "team", "inventory", "financial"]'::jsonb
WHERE id = 'enterprise';

-- Ajustar também trial, basic, pro conforme sistema real
```

**Tempo:** 30min (S)

---

## 📊 COMPARAÇÃO: DB vs UI vs Backend vs Provider

| Componente | Trial | Básico | Pro | Enterprise |
|------------|-------|--------|-----|------------|
| **Preço (DB)** | R$ 0 | R$ 49 | R$ 149 | R$ 299 |
| **Preço (UI)** | R$ 0 | R$ 49 | R$ 149 | R$ 299 |
| **Preço (Cobrado)** | N/A | R$ 49 | R$ 149 | R$ 299 |
| **Provider ID (DB)** | null | null | null | null |
| **Provider ID (Real)** | N/A | ⚠️ FALTA | ⚠️ FALTA | ⚠️ FALTA |
| **Features (DB)** | 4 | 5 | 10 | 16 |
| **Features (Real)** | ~15 | ~15 | ~20 | ~25 |
| **Limites (DB)** | 100 | 500 | -1 | -1/-1 |
| **Limites (Enforced)** | ❌ | ❌ | ❌ | ❌ |

**Legenda:**
- ✅ = Alinhado
- ⚠️ = Precisa configurar
- ❌ = Divergente/Não implementado

---

**FIM DA TABELA DE VERDADE**
