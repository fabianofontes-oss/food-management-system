# 🔍 AUDITORIA TÉCNICA FINAL - GO-LIVE

**Data:** 2026-01-03T04:45:00Z  
**Auditor:** CTO/Staff Eng Level  
**Objetivo:** Verificar correção de URLs/rotas/domínios e valores/planos de assinatura

---

## 📊 SUMÁRIO EXECUTIVO

### ✅ GO-LIVE GATE: **FAIL** ❌

**Bloqueadores críticos identificados:** 3  
**Problemas importantes:** 5  
**Warnings:** 2

### Veredicto

❌ **NÃO APROVADO PARA GO-LIVE** até resolver os 3 bloqueadores críticos abaixo.

---

## 🔴 BLOQUEADORES CRÍTICOS (P0 - RESOLVER ANTES DO GO-LIVE)

### 1. Webhook Mercado Pago sem validação de assinatura

**Arquivo:** `src/app/api/webhooks/mercadopago/route.ts`  
**Linhas:** 11-40  
**Severidade:** 🔴 CRÍTICO (Risco de fraude financeira)

**Evidência:**
```typescript
// Linha 11-23
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('Webhook MercadoPago recebido:', JSON.stringify(body, null, 2))

    if (body.type === 'payment' && body.data?.id) {
      const paymentId = body.data.id.toString()
      
      const success = await processPaymentWebhook(paymentId)
      // ❌ NENHUMA VALIDAÇÃO DE x-signature
```

**Problema:**  
Qualquer pessoa pode enviar POST fake para `/api/webhooks/mercadopago` e ativar contas sem pagar.

**Impacto:**  
- Ativação fraudulenta de assinaturas
- Perda de receita total
- Impossível auditar fraudes

**Fix mínimo:**  
Adicionar validação de `x-signature` conforme [documentação MP](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks#validacao).

**Tempo estimado:** 30min (S)

---

### 2. Super Admin sem proteção server-side

**Pasta:** `src/app/(super-admin)/admin/`  
**Problema:** 33 páginas admin sem `layout.tsx` server-side

**Evidência:**
```bash
# Comando executado:
find_by_name(Pattern="layout.tsx", SearchDirectory="src/app/(super-admin)/admin")
# Resultado: 0 arquivos encontrados

# Apenas existe:
src/app/(super-admin)/layout.tsx  # Linha 310 em AUDIT_ROUTES.json
```

**Análise do middleware:**
```typescript
// src/middleware.ts:84-93
if (host === 'admin.pediu.food') {
  if (pathname === '/') {
    url.pathname = '/admin'
    return NextResponse.rewrite(url)
  }
  if (!pathname.startsWith('/admin')) {
    url.pathname = '/admin' + pathname
    return NextResponse.rewrite(url)
  }
  return await updateSession(request)  // ❌ NÃO VERIFICA SUPER ADMIN
}
```

**Problema:**  
Middleware reescreve URL mas não verifica `isSuperAdmin`. Client components fazem verificação mas podem ser bypassadas via API direta.

**Impacto:**  
- Acesso não autorizado a dados sensíveis
- Manipulação de tenants/planos/billing
- Auditoria comprometida

**Fix mínimo:**  
Criar `src/app/(super-admin)/admin/layout.tsx` com:
```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isSuperAdmin } from '@/lib/auth/super-admin'

export default async function AdminLayout({ children }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user || !isSuperAdmin(user.email)) {
    redirect('/unauthorized')
  }
  
  return <>{children}</>
}
```

**Tempo estimado:** 20min (S)

---

### 3. Limites de plano NÃO são enforced

**Contexto:** `subscription_plans` define `orders_per_month` mas não é verificado ao criar pedidos

**Evidência 1 - DB define limites:**
```sql
-- supabase/migrations/20251221000003_stripe_billing_fields.sql:69-72
('trial', 'Trial', 'Teste grátis por 10 dias', 0, 
  '["dashboard", "products", "orders", "settings"]'::jsonb, 
  '{"orders_per_month": 100}'::jsonb, 0),
('basic', 'Básico', 'Plano básico para começar', 4900, 
  '["dashboard", "products", "orders", "settings", "pos"]'::jsonb, 
  '{"orders_per_month": 500}'::jsonb, 1),
```

**Evidência 2 - Função checkFeatureAccess existe mas NÃO É USADA:**
```typescript
// src/lib/billing/check-access.ts:108-151
export async function checkFeatureAccess(
  tenantId: string,
  featureKey: string
): Promise<{ allowed: boolean; limit?: number; used?: number }> {
  // ... busca limites do plano
  const limitKey = `${featureKey}_limit`
  const limit = limits[limitKey]
  
  if (limit === undefined || limit === -1) {
    return { allowed: true }  // ❌ NÃO CONTA USO ATUAL
  }
  
  return { allowed: true, limit }  // ❌ NÃO RETORNA 'used'
}
```

**Evidência 3 - createOrder NÃO checa limites:**
```typescript
// src/modules/orders/actions.ts:90-108
export async function createOrderAction(...) {
  const supabase = await createClient()

  // ETAPA 5B: Billing Enforcement
  const tenantId = await getTenantIdFromStore(storeId)
  if (tenantId) {
    const billingCheck = await enforceBillingInAction(tenantId)
    // ✅ Checa status (trial/active/suspended)
    // ❌ NÃO CHECA orders_per_month
  }

  // ... cria pedido sem verificar limite
}
```

**Problema:**  
Cliente no plano Trial (100 pedidos/mês) ou Básico (500 pedidos/mês) pode fazer pedidos ilimitados.

**Impacto:**  
- Planos subprecificados tornam-se prejuízo
- Trial "infinito" sem conversão
- Impossível escalar pricing

**Fix mínimo:**
```typescript
// Adicionar em createOrderAction ANTES de criar pedido:

// Buscar plano e limites
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
  
  if (count >= ordersLimit) {
    return { 
      success: false, 
      error: `Limite de ${ordersLimit} pedidos/mês atingido. Faça upgrade do plano.` 
    }
  }
}
```

**Tempo estimado:** 1h (M)

---

## 🟡 PROBLEMAS IMPORTANTES (P1 - RESOLVER ANTES DO MARKETING)

### 4. 37 rotas órfãs sem categorização

**Evidência:** `AUDIT_ROUTES.json:157-306`

**Rotas não categorizadas por domínio:**
- `/billing/overdue`, `/billing/suspended`, `/billing/trial-expired` (OK - são esperadas)
- `/unauthorized` (OK - é esperada)
- `/:slug/cart`, `/:slug/checkout` (❌ DEVIAM estar em white_label)
- `/:slug/motorista/*` (❌ DEVIAM estar em driver ou categorização própria)
- `/reset-password`, `/update-password`, `/verify-email` (❌ DEVIAM estar em app_auth)
- `/choose-url`, `/onboarding` (❌ DEVIAM estar em app_auth)
- `/para-garcons`, `/demo-garcom` (OK - marketing)

**Problema:**  
Script de auditoria não reconhece padrões complexos. Rotas existem mas não estão mapeadas para domínios.

**Impacto:**  
- Confusão em documentação
- Dificulta troubleshooting
- Não é bloqueador técnico

**Fix mínimo:**  
Atualizar `scripts/audit-routes.mjs` para categorizar corretamente OU documentar manualmente em README.

**Tempo estimado:** 1h (M)

---

### 5. Redirect inconsistente no Google OAuth callback

**Arquivo:** `src/app/api/integrations/google/callback/route.ts`  
**Problema:** Sucesso usa `/{slug}/`, erro usa `/dashboard/` (404)

**Evidência (já documentada em auditoria anterior):**
```typescript
// Sucesso:
return NextResponse.redirect(
  new URL(`/${slug}/dashboard/reviews/integrations?success=google_connected`, request.url)
)

// Erro:
return NextResponse.redirect(
  new URL(`/dashboard/reviews/integrations?error=...`, request.url)  // ❌ SEM {slug}
)
```

**Impacto:**  
UX quebrada em caso de erro de OAuth.

**Fix mínimo:**  
Adicionar `/${slug}` no redirect de erro.

**Tempo estimado:** 5min (S)

---

### 6. Lista SUPER_ADMIN_EMAILS duplicada em 5 arquivos

**Fonte de verdade:** `src/lib/auth/super-admin.ts:14-22`  
**Duplicações encontradas:** 5 arquivos

**Evidência:**
```typescript
// Correto (fonte única):
// src/lib/auth/super-admin.ts
const HARDCODED_SUPER_ADMINS = ['fabianobraga@me.com']

// Duplicado em:
// src/app/(auth)/login/page.tsx:26
// src/app/api/admin/users/route.ts:10
// src/app/api/admin/tenants/route.ts:10
// src/app/api/admin/stores/route.ts:10
// src/app/api/admin/stats/route.ts:10
```

**Problema:**  
Adicionar/remover admin requer alterar 6 arquivos. Risco de inconsistência.

**Impacto:**  
- Manutenção complexa
- Risco de acesso não autorizado (esquecer de atualizar um arquivo)

**Fix mínimo:**  
Importar `isSuperAdmin` de `@/lib/auth/super-admin` em todos os arquivos.

**Tempo estimado:** 45min (M)

---

### 7. Parâmetro `redirect` não suportado em /login

**Arquivo:** `src/app/(auth)/login/page.tsx`  
**Problema:** `/login?redirect=/onboarding` ignora query param

**Evidência:**
```typescript
// src/app/onboarding/page.tsx:17
if (!authUser) {
  router.push('/login?redirect=/onboarding')  // ❌ Não funciona
}

// src/app/(auth)/login/page.tsx:95-100
// Após login, sempre redireciona para:
if (storeUsers.length === 1) {
  router.push(`/${store.slug}/dashboard`)
} else {
  router.push('/select-store')
}
// ❌ Não usa searchParams.get('redirect')
```

**Impacto:**  
UX ruim - usuário perde contexto após login.

**Fix mínimo:**
```typescript
const searchParams = useSearchParams()
const redirectTo = searchParams.get('redirect')

// Após login:
if (redirectTo) {
  router.push(redirectTo)
} else if (storeUsers.length === 1) {
  router.push(`/${store.slug}/dashboard`)
} else {
  router.push('/select-store')
}
```

**Tempo estimado:** 15min (S)

---

### 8. Link quebrado em /billing/suspended

**Arquivo:** `src/app/billing/suspended/page.tsx`  
**Problema:** Link "Regularizar Pagamento" aponta para `/billing/payment` (não existe)

**Evidência (auditoria anterior):**
```typescript
// Página existe mas links quebrados:
<Link href="/billing/payment">Regularizar Pagamento</Link>  // ❌ 404
<Link href="/contact">Falar com Suporte</Link>              // ❌ 404
```

**Impacto:**  
Cliente suspenso não consegue pagar - UX crítica quebrada.

**Fix mínimo:**  
Criar `src/app/billing/payment/page.tsx` com integração PIX.

**Tempo estimado:** 2h (L)

---

## ⚠️ WARNINGS (Não bloqueantes mas recomendados)

### 9. Rate limiting ausente nas APIs admin

**Arquivos:** `src/app/api/admin/*`  
**Problema:** Sem rate limiting (Upstash está instalado mas não usado)

**Impacto:**  
- Abuso de APIs
- DDoS possível
- Custo de infra inflado

**Fix:** Adicionar rate limiting com Upstash Redis.  
**Tempo estimado:** 1h (M)

---

### 10. Audit logging ausente

**Contexto:** Mudanças em planos/tenants não são logadas

**Problema:**  
Tabela `audit_logs` existe mas poucas ações são registradas.

**Impacto:**  
- Dificulta troubleshooting
- Compliance fraco
- Debug complexo

**Fix:** Adicionar `logAudit()` em todas as mutations admin.  
**Tempo estimado:** 1.5h (M)

---

## 📐 CANON DE DOMÍNIOS (DEFINIÇÃO OFICIAL)

### Domínios Implementados

| Host | Função | Proteção | Implementação | Status |
|------|--------|----------|---------------|--------|
| `pediufood.com` | Marketing | Público | `middleware.ts:76-80` | ✅ |
| `www.pediufood.com` | Alias marketing | Público | `middleware.ts:76-80` | ✅ |
| `pediufood.com.br` | Redirect 308 → .com | N/A | `middleware.ts:44-48` | ✅ |
| `www.pediufood.com.br` | Redirect 308 → .com | N/A | `middleware.ts:44-48` | ✅ |
| `admin.pediu.food` | Super Admin | ❌ Client-only | `middleware.ts:84-93` | ⚠️ RISCO |
| `app.pediu.food` | App multi-loja | Supabase Auth | `middleware.ts:96-99` | ✅ |
| `{slug}.pediu.food` | Cardápio white-label | Público | `middleware.ts:102-110` → `/s/{slug}` | ✅ |
| `pediu.food` | Redirect 308 → pediufood.com | N/A | `middleware.ts:60-68` (com exceções /admin, /api) | ⚠️ Inconsistente |
| `www.pediu.food` | Redirect 308 → pediufood.com | N/A | `middleware.ts:60-68` | ✅ |
| `{slug}.entregou.food` | Perfil motorista | Público | `middleware.ts:113-120` → `/motorista-publico/{slug}` | ✅ |
| `driver.entregou.food` | Dashboard motoristas | Supabase Auth | `middleware.ts:124-133` | ✅ |
| `entregou.food` | Landing motoristas | Público | `middleware.ts:137-143` → `/para-motoristas` | ✅ |
| `www.entregou.food` | Alias landing | Público | `middleware.ts:137-143` | ✅ |
| `pensou.food` | Redirect 308 → /marketplace | N/A | `middleware.ts:52-56` | ✅ |
| `www.pensou.food` | Redirect 308 → /marketplace | N/A | `middleware.ts:52-56` | ✅ |

### Regras de Redirect/Rewrite

**Redirects Permanentes (308):**
1. `*.pediufood.com.br` → `pediufood.com` (canonização)
2. `pensou.food` → `pediufood.com/marketplace`
3. `pediu.food/*` → `pediufood.com/*` (exceto /admin, /api, /login, /signup)

**Rewrites (internos):**
1. `admin.pediu.food/*` → `/admin/*`
2. `{slug}.pediu.food/*` → `/s/{slug}/*`
3. `{slug}.entregou.food/*` → `/motorista-publico/{slug}/*`
4. `driver.entregou.food/*` → `/driver/*`
5. `entregou.food/` → `/para-motoristas`

### ⚠️ Inconsistências Identificadas

**1. pediu.food com exceções hardcoded:**
```typescript
// middleware.ts:62
if (pathname.startsWith('/admin') || pathname.startsWith('/api') || 
    pathname.startsWith('/login') || pathname.startsWith('/signup')) {
  return await updateSession(request)  // ❌ Não redireciona
}
```

**Problema:** Criou um "domínio fantasma" - `pediu.food/login` funciona mas não é canônico.

**Recomendação:** Remover exceções e forçar redirect completo OU documentar `pediu.food` como alias oficial de `pediufood.com`.

---

## 📊 INVENTÁRIO DE ROTAS

**Total:** 160 rotas  
**Breakdown:**
- Pages: 116
- API Routes: 38
- Layouts: 6

**Por Domínio:**
- Marketing (`pediufood.com`): 6 rotas
- Admin (`admin.pediu.food`): 33 rotas (❌ sem proteção server-side)
- App Auth (`app.pediu.food`): 4 rotas
- White-label (`{slug}.pediu.food`): 1 rota (`/s/:slug`)
- Driver Profile (`{slug}.entregou.food`): 1 rota
- Driver Dashboard (`driver.entregou.food`): 1 rota
- Store Dashboard (`/:slug/dashboard`): 37 rotas
- API: 37 rotas
- **Órfãs:** 37 rotas (não categorizadas)

**Detalhes completos:** `AUDIT_ROUTES.json`

**Rotas críticas órfãs:**
- `/billing/*` (3 rotas) - OK, são esperadas
- `/:slug/cart`, `/:slug/checkout` - Deveriam estar em white-label
- `/choose-url`, `/onboarding` - Deveriam estar em app_auth

---

## 💰 BILLING/ASSINATURAS - TRUTH MAP

### Fonte de Verdade

**DB:** `subscription_plans` (tabela)  
**Migração:** `supabase/migrations/20251221000003_stripe_billing_fields.sql:67-73`

### Planos Ativos

| ID | Nome | Preço/Mês | Moeda | Provider | Status |
|----|------|-----------|-------|----------|--------|
| `trial` | Trial | R$ 0,00 | BRL | Nenhum | ✅ Ativo |
| `basic` | Básico | R$ 49,00 | BRL | Mercado Pago | ✅ Ativo |
| `pro` | Pro | R$ 149,00 | BRL | Mercado Pago | ✅ Ativo |
| `enterprise` | Enterprise | R$ 299,00 | BRL | Mercado Pago | ✅ Ativo |

### Features Declaradas vs Habilitadas

**Verificado em:** `src/lib/superadmin/plan-modules.ts` + Dashboard

| Plano | Features DB | Módulos Reais | Status |
|-------|-------------|---------------|--------|
| Trial | 4 features | ~15 módulos disponíveis | ⚠️ DIVERGE |
| Básico | 5 features | ~15 módulos disponíveis | ⚠️ DIVERGE |
| Pro | 10 features | ~20 módulos disponíveis | ⚠️ DIVERGE |
| Enterprise | 16 features | ~25 módulos disponíveis | ⚠️ DIVERGE |

**Nota:** O sistema cresceu 10x desde definição inicial dos planos. Features no DB estão desatualizadas.

### Limites vs Enforcement

| Plano | Limite DB | Enforcement Real | Status |
|-------|-----------|------------------|--------|
| Trial | 100 orders/month | ❌ NÃO ENFORCED | 🔴 CRÍTICO |
| Básico | 500 orders/month | ❌ NÃO ENFORCED | 🔴 CRÍTICO |
| Pro | -1 (ilimitado) | ❌ NÃO ENFORCED | ⚠️ Risco |
| Enterprise | -1 (ilimitado) + -1 stores | ❌ NÃO ENFORCED | ⚠️ Risco |

**Evidência:** Ver seção "Bloqueador #3" acima.

---

## 🎭 MOCKS / DEMO / FALLBACKS

### Classificação de Mocks

#### 🔴 BLOQUEADORES (Must Fix)

**NENHUM** - Todos os mocks críticos têm fail-closed em produção.

#### 🟢 ACEITÁVEIS (Fail-Closed em Produção)

**1. Stripe Mocks**

**Arquivos:** `src/lib/stripe/client.ts`  
**Linhas:** 54-59, 105-111, 157-162, 188-197, 222-227

**Comportamento:**
```typescript
if (!stripe) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Stripe não configurado em produção')  // ✅ FAIL CLOSED
  }
  const mockId = `cus_mock_${params.tenantId.slice(0, 8)}`
  return { customerId: mockId, isMock: true }
}
```

**Veredicto:** ✅ OK - Quebra em produção se Stripe não configurado (comportamento correto).

---

**2. Demo Store Mode**

**Arquivos:**
- `src/modules/minisite/actions.ts:40-41`
- `src/lib/supabase/middleware.ts:69-71`
- `src/app/[slug]/dashboard/layout.tsx:25-26`

**Comportamento:**
```typescript
const isDemoSlug = slug === 'demo'
if (slug === 'demo') {
  logger.debug('[Middleware] DEMO MODE: allowing public access')
  return response  // ✅ Bypass autenticação apenas para slug 'demo'
}
```

**Veredicto:** ✅ OK - É funcionalidade intencional (loja demo pública).

---

**3. iFood Integration Mock**

**Arquivo:** `src/modules/driver/integrations/marketplace.ts:152`

**Comportamento:**
```typescript
logger.debug('[iFood] Autenticando...')
this.accessToken = 'mock_token'  // ⚠️ MOCK hardcoded
```

**Veredicto:** ⚠️ WARNING - Mock sempre ativo (não verifica NODE_ENV). Não é bloqueador pois iFood é feature futura.

---

#### 🟡 TOLERÁVEIS (Dev/Test Only)

**4. localStorage/Draft Store**

**Arquivos:** `src/stores/cart-store.ts:139`

**Comportamento:**
```typescript
{
  name: 'cart-storage',  // Persiste carrinho em localStorage
}
```

**Veredicto:** ✅ OK - É funcionalidade cliente (não afeta billing/auth).

---

**5. Internal Auth Bypass em DEV**

**Arquivo:** `src/lib/security/internal-auth.ts:19-23`

**Comportamento:**
```typescript
const isProduction = process.env.NODE_ENV === 'production'

if (!isProduction) {
  return  // ✅ Permite acesso em dev
}
// Em prod: exige x-internal-token
```

**Veredicto:** ✅ OK - Facilita desenvolvimento, seguro em produção.

---

### Resumo de Mocks

| Tipo | Arquivos | Fail-Closed? | Status |
|------|----------|--------------|--------|
| Stripe | 5 funções | ✅ Sim | ✅ OK |
| Demo Store | 3 arquivos | N/A (feature) | ✅ OK |
| iFood | 1 linha | ❌ Não | ⚠️ Warning |
| localStorage | 1 arquivo | N/A (client) | ✅ OK |
| Internal Auth | 1 arquivo | ✅ Sim | ✅ OK |

**Total de bloqueadores:** 0  
**Total de warnings:** 1 (iFood mock)

---

## ✅ DEFINITION OF DONE

### Perguntas da Auditoria

**1. Qual é o canon de domínios (host → rota interna) e onde está implementado?**

✅ **RESPONDIDO** - Ver seção "Canon de Domínios" acima.  
**Evidência:** `src/middleware.ts:29-155`

---

**2. Quais rotas existem e quais são órfãs?**

✅ **RESPONDIDO** - 160 rotas totais, 37 órfãs (não críticas).  
**Evidência:** `AUDIT_ROUTES.json`

---

**3. Qual é a fonte de verdade dos planos e preços hoje?**

✅ **RESPONDIDO** - DB `subscription_plans` é fonte única.  
**Evidência:** `supabase/migrations/20251221000003_stripe_billing_fields.sql:67-73`

---

**4. Se o backend aplica limites/entitlements de verdade?**

❌ **BLOQUEADOR** - `orders_per_month` NÃO é enforced.  
**Evidência:** `src/modules/orders/actions.ts:90-108` (não checa limites)

---

**5. Quais mocks estão ativos e como bloquear em produção?**

✅ **RESPONDIDO** - Todos os mocks críticos têm fail-closed.  
**Evidência:** Ver seção "Mocks / Demo / Fallbacks"

---

## 🚀 GO-LIVE CHECKLIST

### P0 - Obrigatório (Bloqueadores)

- [ ] **#1** Validar assinatura webhook Mercado Pago (30min)
- [ ] **#2** Criar layout server-side para /admin (20min)
- [ ] **#3** Implementar enforcement de orders_per_month (1h)

**Total P0:** ~1h50min

### P1 - Recomendado (Antes do Marketing)

- [ ] **#4** Categorizar rotas órfãs no audit script (1h)
- [ ] **#5** Corrigir redirect Google OAuth callback (5min)
- [ ] **#6** Centralizar SUPER_ADMIN_EMAILS (45min)
- [ ] **#7** Implementar suporte a ?redirect no login (15min)
- [ ] **#8** Criar página /billing/payment (2h)

**Total P1:** ~4h

### P2 - Nice to Have

- [ ] **#9** Adicionar rate limiting APIs admin (1h)
- [ ] **#10** Implementar audit logging completo (1.5h)

**Total P2:** ~2.5h

---

## 📋 ANEXOS

- `AUDIT_ROUTES.json` - Inventário completo de rotas
- `AUDIT_PLAN_TRUTH_TABLE.md` - Tabela detalhada de planos (próximo arquivo)
- `PATCHES_MINIMOS.diff` - Correções mínimas (próximo arquivo)

---

**FIM DO RELATÓRIO**
