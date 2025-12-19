# Billing Enforcement Findings
**Auditoria de Enforcement de Billing e Prevenção de "Trial Infinito"**  
**Data:** 2024-12-19  
**Commit:** d410642

---

## 🎯 Objetivo

Validar e fechar o "Billing Enforcement" para prevenir:
1. **Trial infinito** - Usuários continuam usando após trial expirar
2. **Acesso após suspensão** - Tenants suspensos ainda acessam o sistema
3. **Bypass de billing** - Mutações sem verificar status de pagamento
4. **Abuse de recursos** - Uso sem pagamento

---

## 📊 Resumo Executivo

### Status Geral: 🔴 **ALTO RISCO**

| Categoria | Status | Observação |
|-----------|--------|------------|
| **Middleware Enforcement** | 🔴 Ausente | Não verifica status de subscription |
| **Server Actions Enforcement** | 🔴 Ausente | Não verifica trial/billing |
| **Cron Jobs** | 🟡 Parcial | Existe mas não é real-time |
| **Grace Period** | 🟢 Implementado | 3 dias configurável |
| **Idempotência** | ⚠️ Não verificado | Precisa validação |

---

## 🔴 VULN-BILL-001: Trial Infinito (Sem Enforcement Real-Time)

**Severidade:** 🔴 **CRÍTICA**

### Problema

**Usuários podem continuar usando o sistema indefinidamente após trial expirar.**

O sistema depende **exclusivamente** de um cron job para suspender tenants com trial expirado. Não há verificação em tempo real no middleware ou server actions.

### Evidência

#### 1. Middleware NÃO Verifica Status

**Arquivo:** `src/lib/supabase/middleware.ts:59-106`

```typescript
// Dashboard access control
const dashboardMatch = path.match(/^\/([^\/]+)\/dashboard/)
if (dashboardMatch) {
  const slug = dashboardMatch[1]

  // Buscar store pelo slug
  const { data: store, error: storeError } = await supabase
    .from('stores')
    .select('id, settings')  // ⚠️ NÃO busca tenant_id ou tenant.status
    .eq('slug', slug)
    .single()

  if (storeError || !store) {
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }

  // ⚠️ MISSING: Verificação de tenant.status e trial_ends_at
  // ⚠️ MISSING: Verificação de subscription status

  // Verificar se usuário tem acesso à loja
  const { data: storeUser, error: accessError } = await supabase
    .from('store_users')
    .select('id')
    .eq('store_id', store.id)
    .eq('user_id', user.id)
    .single()

  if (accessError || !storeUser) {
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }
}
```

**Análise:**
- ✅ Verifica autenticação (user logged in)
- ✅ Verifica acesso à loja (store_users)
- ❌ **NÃO verifica tenant.status**
- ❌ **NÃO verifica trial_ends_at**
- ❌ **NÃO verifica subscription status**

#### 2. Cron Job Suspende (Mas Não é Real-Time)

**Arquivo:** `src/app/api/cron/billing/route.ts:92-103`

```typescript
// 4. Verificar trials expirados
const { data: expiredTrials } = await supabase
  .from('tenants')
  .update({
    status: 'suspended',
    suspended_at: new Date().toISOString(),
    suspended_reason: 'Trial expirado'
  })
  .eq('status', 'trial')
  .lt('trial_ends_at', new Date().toISOString())
  .select()

results.expiredTrials = expiredTrials?.length || 0
```

**Análise:**
- ✅ Lógica de suspensão existe
- ✅ Marca tenant como 'suspended'
- ❌ **Executa apenas quando cron roda** (diário?)
- ❌ **Trial pode continuar por horas/dias após expirar**

#### 3. Server Actions NÃO Verificam Status

**Exemplo:** `src/lib/actions/orders.ts` (criar pedido)

Nenhuma verificação de:
- `tenant.status === 'suspended'`
- `trial_ends_at < NOW()`
- `subscription.status === 'past_due'`

### Cenário de Exploit

1. **Dia 1:** Usuário cria conta com trial de 10 dias
2. **Dia 10:** Trial expira às 00:00
3. **Dia 10 às 08:00:** Cron ainda não rodou
4. **Usuário continua usando normalmente** (criar pedidos, produtos, etc)
5. **Dia 10 às 23:00:** Cron roda e suspende
6. **Total de abuse:** 23 horas de uso gratuito após expiração

### Impacto

- 🔴 **Trial infinito** se cron falhar
- 🔴 **Uso sem pagamento** entre expiração e cron
- 🔴 **Perda de receita** (MRR)
- 🔴 **Abuse de recursos** (storage, bandwidth, compute)

### Patch Recomendado

Ver seção "Patch Plan" abaixo.

---

## 🔴 VULN-BILL-002: Suspended Tenants Ainda Acessam Sistema

**Severidade:** 🔴 **CRÍTICA**

### Problema

Mesmo após cron job marcar tenant como `status = 'suspended'`, o middleware **não bloqueia** o acesso.

### Evidência

**Arquivo:** `src/lib/supabase/middleware.ts:71-80`

```typescript
const { data: store, error: storeError } = await supabase
  .from('stores')
  .select('id, settings')  // ⚠️ NÃO busca tenant
  .eq('slug', slug)
  .single()

// ⚠️ MISSING: Check if store.tenant_id has status = 'suspended'
```

**Nenhuma query para verificar:**
```sql
SELECT status FROM tenants WHERE id = store.tenant_id
```

### Cenário de Exploit

1. Cron suspende tenant (status = 'suspended')
2. Usuário continua logado
3. Middleware não verifica tenant.status
4. **Usuário continua acessando dashboard normalmente**
5. Pode criar pedidos, produtos, etc.

### Impacto

- 🔴 Suspensão ineficaz
- 🔴 Inadimplentes continuam usando
- 🔴 Perda de receita

---

## 🟡 VULN-BILL-003: Sem Enforcement em Server Actions

**Severidade:** 🟡 **MÉDIA a ALTA**

### Problema

Server Actions (criar pedido, produto, etc) **não verificam** status de billing antes de executar.

### Evidência

**Exemplo:** `src/modules/orders/actions.ts` (hipótese - não lido)

Nenhuma verificação de:
```typescript
// MISSING:
const { data: tenant } = await supabase
  .from('tenants')
  .select('status, trial_ends_at')
  .eq('id', store.tenant_id)
  .single()

if (tenant.status === 'suspended' || tenant.status === 'cancelled') {
  return { error: 'Subscription suspended' }
}

if (tenant.status === 'trial' && new Date(tenant.trial_ends_at) < new Date()) {
  return { error: 'Trial expired' }
}
```

### Impacto

- 🟡 Mutações permitidas mesmo com billing suspenso
- 🟡 Dados criados por tenants inadimplentes
- 🟡 Abuse de recursos

---

## 🟡 VULN-BILL-004: Idempotência Não Verificada

**Severidade:** 🟡 **MÉDIA**

### Problema

Não foi verificado se:
1. Criação de pedidos é idempotente (evita duplicatas)
2. Webhook MercadoPago processa pagamentos duplicados
3. Cron job pode rodar múltiplas vezes

### Evidência Necessária

Verificar:
- `src/modules/orders/actions.ts` - Usa idempotency key?
- `src/app/api/webhooks/mercadopago/route.ts` - Verifica se pagamento já foi processado?
- `src/app/api/cron/billing/route.ts` - Pode suspender tenant múltiplas vezes?

### Recomendação

Implementar idempotency keys em:
1. Criação de pedidos
2. Processamento de webhooks
3. Cron jobs (usar locks distribuídos)

---

## 📋 Estados de Subscription e Regras

### Estados Propostos

```typescript
type SubscriptionStatus = 
  | 'active'       // Pagando normalmente
  | 'trialing'     // Trial ativo (trial_ends_at no futuro)
  | 'past_due'     // Fatura vencida (dentro do grace period)
  | 'unpaid'       // Fatura vencida (fora do grace period)
  | 'cancelled'    // Cancelado pelo usuário
  | 'suspended'    // Suspenso por admin ou sistema

type TenantStatus = 
  | 'active'       // Funcionando normalmente
  | 'trial'        // Em período de trial
  | 'suspended'    // Suspenso (billing ou admin)
  | 'cancelled'    // Cancelado
```

### Regras de Acesso

| Status | Dashboard | Mutações | Leitura | Observação |
|--------|-----------|----------|---------|------------|
| `active` | ✅ Sim | ✅ Sim | ✅ Sim | Acesso total |
| `trialing` (válido) | ✅ Sim | ✅ Sim | ✅ Sim | Trial ativo |
| `trialing` (expirado) | ❌ Não | ❌ Não | ✅ Sim* | Redirecionar para billing |
| `past_due` | ✅ Sim | ⚠️ Limitado | ✅ Sim | Grace period (3 dias) |
| `unpaid` | ❌ Não | ❌ Não | ✅ Sim* | Redirecionar para billing |
| `suspended` | ❌ Não | ❌ Não | ✅ Sim* | Redirecionar para suspended page |
| `cancelled` | ❌ Não | ❌ Não | ✅ Sim* | Redirecionar para reactivate |

\* Leitura apenas para exportar dados ou reativar

### Grace Period

```typescript
interface BillingConfig {
  grace_period_days: number        // Default: 3
  auto_suspend_enabled: boolean    // Default: true
  allow_read_when_suspended: boolean // Default: true
}
```

**Regras:**
1. **past_due (0-3 dias):** Acesso total com banner de aviso
2. **unpaid (3+ dias):** Bloqueio total, redirecionar para billing
3. **suspended:** Bloqueio total, redirecionar para suspended page

---

## 🛠️ Patch Plan (Ordem de Implementação)

### FASE 1: Enforcement Básico (URGENTE - 1 dia)

#### 1.1. Criar Função de Verificação de Billing

```typescript
// src/lib/billing/enforcement.ts
import 'server-only'

import { createClient } from '@/lib/supabase/server'

export interface BillingStatus {
  allowed: boolean
  status: 'active' | 'trialing' | 'past_due' | 'unpaid' | 'suspended' | 'cancelled'
  reason?: string
  trial_ends_at?: string
  grace_period_ends_at?: string
  redirect_to?: string
}

/**
 * Verifica status de billing de um tenant
 * @param tenantId - ID do tenant
 * @returns Status de billing e se acesso é permitido
 */
export async function checkBillingStatus(tenantId: string): Promise<BillingStatus> {
  const supabase = await createClient()

  // Buscar tenant
  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('status, trial_ends_at, suspended_at, suspended_reason')
    .eq('id', tenantId)
    .single()

  if (error || !tenant) {
    return {
      allowed: false,
      status: 'suspended',
      reason: 'Tenant not found',
      redirect_to: '/unauthorized'
    }
  }

  // 1. CANCELLED
  if (tenant.status === 'cancelled') {
    return {
      allowed: false,
      status: 'cancelled',
      reason: 'Subscription cancelled',
      redirect_to: '/billing/reactivate'
    }
  }

  // 2. SUSPENDED (por admin ou billing)
  if (tenant.status === 'suspended') {
    return {
      allowed: false,
      status: 'suspended',
      reason: tenant.suspended_reason || 'Account suspended',
      redirect_to: '/billing/suspended'
    }
  }

  // 3. TRIAL
  if (tenant.status === 'trial') {
    const trialEndsAt = new Date(tenant.trial_ends_at!)
    const now = new Date()

    if (trialEndsAt < now) {
      // Trial expirado
      return {
        allowed: false,
        status: 'trialing',
        reason: 'Trial expired',
        trial_ends_at: tenant.trial_ends_at!,
        redirect_to: '/billing/trial-expired'
      }
    }

    // Trial ativo
    return {
      allowed: true,
      status: 'trialing',
      trial_ends_at: tenant.trial_ends_at!
    }
  }

  // 4. ACTIVE - Verificar subscription
  const { data: subscription } = await supabase
    .from('tenant_subscriptions')
    .select('status, current_period_end')
    .eq('tenant_id', tenantId)
    .single()

  if (!subscription) {
    // Sem subscription ativa
    return {
      allowed: false,
      status: 'unpaid',
      reason: 'No active subscription',
      redirect_to: '/billing/subscribe'
    }
  }

  // 5. Verificar faturas vencidas
  const { data: overdueInvoices, count } = await supabase
    .from('invoices')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .eq('status', 'overdue')

  if (count && count > 0) {
    // Calcular grace period
    const oldestInvoice = overdueInvoices![0]
    const dueDate = new Date(oldestInvoice.due_date)
    const gracePeriodDays = 3 // TODO: Buscar de billing_config
    const gracePeriodEnd = new Date(dueDate.getTime() + gracePeriodDays * 24 * 60 * 60 * 1000)
    const now = new Date()

    if (now < gracePeriodEnd) {
      // Dentro do grace period - permite acesso com aviso
      return {
        allowed: true,
        status: 'past_due',
        reason: 'Invoice overdue (grace period)',
        grace_period_ends_at: gracePeriodEnd.toISOString()
      }
    } else {
      // Fora do grace period - bloqueia
      return {
        allowed: false,
        status: 'unpaid',
        reason: 'Invoice overdue (grace period expired)',
        redirect_to: '/billing/overdue'
      }
    }
  }

  // 6. ACTIVE - Tudo OK
  return {
    allowed: true,
    status: 'active'
  }
}

/**
 * Middleware helper: Verifica billing e redireciona se necessário
 */
export async function enforceBillingInMiddleware(
  tenantId: string,
  request: NextRequest
): Promise<NextResponse | null> {
  const billingStatus = await checkBillingStatus(tenantId)

  if (!billingStatus.allowed) {
    const redirectUrl = billingStatus.redirect_to || '/billing/suspended'
    return NextResponse.redirect(new URL(redirectUrl, request.url))
  }

  // Se past_due, adicionar header para mostrar banner
  if (billingStatus.status === 'past_due') {
    const response = NextResponse.next()
    response.headers.set('X-Billing-Status', 'past_due')
    response.headers.set('X-Grace-Period-Ends', billingStatus.grace_period_ends_at!)
    return response
  }

  return null // Permitir acesso
}

/**
 * Server Action helper: Verifica billing antes de mutação
 */
export async function enforceBillingInAction(tenantId: string): Promise<{
  allowed: boolean
  error?: string
}> {
  const billingStatus = await checkBillingStatus(tenantId)

  if (!billingStatus.allowed) {
    return {
      allowed: false,
      error: billingStatus.reason || 'Subscription inactive'
    }
  }

  // past_due permite acesso mas com aviso
  if (billingStatus.status === 'past_due') {
    // Log warning mas permite
    console.warn(`[Billing] Tenant ${tenantId} is past_due but within grace period`)
  }

  return { allowed: true }
}
```

#### 1.2. Integrar no Middleware

```typescript
// src/lib/supabase/middleware.ts (REFATORADO)
import { enforceBillingInMiddleware } from '@/lib/billing/enforcement'

export async function updateSession(request: NextRequest) {
  // ... código existente ...

  // Dashboard access control
  const dashboardMatch = path.match(/^\/([^\/]+)\/dashboard/)
  if (dashboardMatch) {
    const slug = dashboardMatch[1]

    // DEMO MODE bypass
    if (slug === 'demo') {
      return response
    }

    // Buscar store pelo slug
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, tenant_id, settings') // ✅ ADICIONAR tenant_id
      .eq('slug', slug)
      .single()

    if (storeError || !store) {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    // DEMO MODE via settings
    const settings = store.settings as any
    if (settings?.isDemo === true) {
      return response
    }

    // Autenticação
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Verificar acesso à loja
    const { data: storeUser, error: accessError } = await supabase
      .from('store_users')
      .select('id')
      .eq('store_id', store.id)
      .eq('user_id', user.id)
      .single()

    if (accessError || !storeUser) {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    // ✅ NOVO: Verificar billing status
    const billingResponse = await enforceBillingInMiddleware(store.tenant_id, request)
    if (billingResponse) {
      return billingResponse // Redireciona se bloqueado
    }
  }

  return response
}
```

#### 1.3. Integrar em Server Actions Críticas

```typescript
// src/modules/orders/actions.ts (EXEMPLO)
import { enforceBillingInAction } from '@/lib/billing/enforcement'

export async function createOrderAction(
  storeId: string,
  orderData: OrderData,
  idempotencyKey: string
) {
  const supabase = await createClient()

  // Buscar tenant_id
  const { data: store } = await supabase
    .from('stores')
    .select('tenant_id')
    .eq('id', storeId)
    .single()

  if (!store) {
    return { error: 'Store not found' }
  }

  // ✅ NOVO: Verificar billing antes de criar pedido
  const billingCheck = await enforceBillingInAction(store.tenant_id)
  if (!billingCheck.allowed) {
    return { error: billingCheck.error }
  }

  // ... resto da lógica de criar pedido ...
}
```

### FASE 2: Páginas de Billing (1-2 dias)

#### 2.1. Criar Páginas de Status

```typescript
// src/app/billing/trial-expired/page.tsx
export default function TrialExpiredPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          Trial Expirado
        </h1>
        <p className="text-gray-700 mb-6">
          Seu período de teste expirou. Para continuar usando o sistema,
          escolha um plano.
        </p>
        <Button href="/billing/plans">Ver Planos</Button>
      </div>
    </div>
  )
}

// src/app/billing/suspended/page.tsx
// src/app/billing/overdue/page.tsx
// src/app/billing/plans/page.tsx
```

#### 2.2. Banner de Grace Period

```typescript
// src/components/billing/GracePeriodBanner.tsx
'use client'

export function GracePeriodBanner() {
  const headers = useHeaders() // Next.js 14
  const billingStatus = headers.get('X-Billing-Status')
  const gracePeriodEnds = headers.get('X-Grace-Period-Ends')

  if (billingStatus !== 'past_due') return null

  const daysRemaining = calculateDaysRemaining(gracePeriodEnds)

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 p-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="text-yellow-600" />
          <p className="text-sm text-yellow-800">
            <strong>Fatura vencida.</strong> Você tem {daysRemaining} dias
            para regularizar antes do bloqueio.
          </p>
        </div>
        <Button href="/billing/invoices" variant="warning">
          Pagar Agora
        </Button>
      </div>
    </div>
  )
}
```

### FASE 3: Idempotência (2-3 dias)

#### 3.1. Idempotency Keys em Pedidos

```typescript
// src/modules/orders/actions.ts
export async function createOrderAction(
  storeId: string,
  orderData: OrderData,
  idempotencyKey: string // ✅ Obrigatório
) {
  const supabase = await createClient()

  // Verificar se pedido já foi criado com este idempotency key
  const { data: existingOrder } = await supabase
    .from('orders')
    .select('id, status, total_amount')
    .eq('idempotency_key', idempotencyKey)
    .single()

  if (existingOrder) {
    // Pedido já existe - retornar o existente (idempotente)
    return {
      success: true,
      order: existingOrder,
      message: 'Order already created (idempotent)'
    }
  }

  // Criar pedido com idempotency key
  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      ...orderData,
      idempotency_key: idempotencyKey
    })
    .select()
    .single()

  return { success: true, order }
}
```

#### 3.2. Idempotência em Webhook

```typescript
// src/app/api/webhooks/mercadopago/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json()
  
  if (body.type === 'payment' && body.data?.id) {
    const paymentId = body.data.id.toString()
    
    // Verificar se webhook já foi processado
    const { data: existingWebhook } = await supabase
      .from('webhook_events')
      .select('id, status')
      .eq('external_id', paymentId)
      .eq('provider', 'mercadopago')
      .single()

    if (existingWebhook) {
      // Já processado - retornar sucesso (idempotente)
      return NextResponse.json({ 
        success: true, 
        message: 'Webhook already processed' 
      })
    }

    // Registrar webhook
    await supabase
      .from('webhook_events')
      .insert({
        external_id: paymentId,
        provider: 'mercadopago',
        event_type: 'payment',
        payload: body,
        status: 'processing'
      })

    // Processar pagamento
    const success = await processPaymentWebhook(paymentId)

    // Atualizar status
    await supabase
      .from('webhook_events')
      .update({ status: success ? 'processed' : 'failed' })
      .eq('external_id', paymentId)

    return NextResponse.json({ success })
  }

  return NextResponse.json({ success: true })
}
```

#### 3.3. Lock Distribuído em Cron

```typescript
// src/app/api/cron/billing/route.ts
export async function GET(request: NextRequest) {
  // Auth check...

  const supabase = createClient(...)

  // Tentar adquirir lock
  const lockKey = 'cron:billing'
  const lockTTL = 300 // 5 minutos

  const { data: lock } = await supabase
    .from('cron_locks')
    .select('id, locked_at')
    .eq('key', lockKey)
    .single()

  if (lock) {
    const lockedAt = new Date(lock.locked_at)
    const now = new Date()
    const elapsed = (now.getTime() - lockedAt.getTime()) / 1000

    if (elapsed < lockTTL) {
      // Lock ainda ativo - cron já está rodando
      return NextResponse.json({
        success: false,
        message: 'Cron job already running'
      })
    }
  }

  // Adquirir/renovar lock
  await supabase
    .from('cron_locks')
    .upsert({
      key: lockKey,
      locked_at: new Date().toISOString()
    })

  try {
    // Executar cron job...
    const results = await runBillingCron()

    // Liberar lock
    await supabase
      .from('cron_locks')
      .delete()
      .eq('key', lockKey)

    return NextResponse.json({ success: true, results })
  } catch (error) {
    // Liberar lock em caso de erro
    await supabase
      .from('cron_locks')
      .delete()
      .eq('key', lockKey)

    throw error
  }
}
```

### FASE 4: Melhorias (1 semana)

#### 4.1. Mudar Cron Jobs para POST

```typescript
// src/app/api/cron/billing/route.ts
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Use POST to execute billing cron'
  })
}

export async function POST(request: NextRequest) {
  // Lógica existente...
}
```

#### 4.2. Adicionar Monitoring

```typescript
// src/lib/billing/monitoring.ts
export async function logBillingEvent(event: {
  type: 'trial_expired' | 'tenant_suspended' | 'invoice_overdue'
  tenant_id: string
  metadata?: any
}) {
  // Log para sistema de monitoramento (Sentry, DataDog, etc)
  console.log('[Billing Event]', event)
  
  // Enviar alerta se crítico
  if (event.type === 'tenant_suspended') {
    await sendSlackAlert(`Tenant ${event.tenant_id} suspended`)
  }
}
```

#### 4.3. Dashboard de Billing (Admin)

```typescript
// src/app/(super-admin)/admin/billing/dashboard/page.tsx
export default async function BillingDashboardPage() {
  const stats = await getBillingStats()

  return (
    <div>
      <h1>Billing Dashboard</h1>
      
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          title="MRR"
          value={formatCurrency(stats.mrr)}
          trend="+12%"
        />
        <MetricCard
          title="Trials Ativos"
          value={stats.activeTrials}
          subtitle={`${stats.expiringTrials} expirando em 3 dias`}
        />
        <MetricCard
          title="Past Due"
          value={stats.pastDueCount}
          trend="warning"
        />
        <MetricCard
          title="Suspensos"
          value={stats.suspendedCount}
          trend="danger"
        />
      </div>

      <TrialsExpiringTable trials={stats.expiringTrialsList} />
      <OverdueInvoicesTable invoices={stats.overdueInvoices} />
    </div>
  )
}
```

---

## 📋 Checklist de Implementação

### FASE 1: Enforcement Básico (URGENTE)
- [ ] Criar `src/lib/billing/enforcement.ts`
- [ ] Implementar `checkBillingStatus()`
- [ ] Implementar `enforceBillingInMiddleware()`
- [ ] Implementar `enforceBillingInAction()`
- [ ] Integrar no middleware
- [ ] Integrar em `createOrderAction`
- [ ] Integrar em outras server actions críticas
- [ ] Testar com tenant trial expirado
- [ ] Testar com tenant suspended

### FASE 2: Páginas de Billing
- [ ] Criar `/billing/trial-expired`
- [ ] Criar `/billing/suspended`
- [ ] Criar `/billing/overdue`
- [ ] Criar `/billing/plans`
- [ ] Criar `GracePeriodBanner` component
- [ ] Adicionar banner no layout do dashboard

### FASE 3: Idempotência
- [ ] Adicionar coluna `idempotency_key` em `orders`
- [ ] Criar tabela `webhook_events`
- [ ] Criar tabela `cron_locks`
- [ ] Implementar idempotency em `createOrderAction`
- [ ] Implementar idempotency em webhook MercadoPago
- [ ] Implementar lock distribuído em cron jobs
- [ ] Testar duplicação de pedidos
- [ ] Testar duplicação de webhooks

### FASE 4: Melhorias
- [ ] Mudar cron jobs para POST
- [ ] Atualizar `vercel.json` com cron schedule
- [ ] Implementar monitoring/logging
- [ ] Criar dashboard de billing (admin)
- [ ] Adicionar alertas (Slack/email)
- [ ] Documentar fluxo de billing
- [ ] Criar testes automatizados

---

## 🎯 Resumo de Vulnerabilidades

| ID | Vulnerabilidade | Severidade | Impacto | Patch |
|----|-----------------|------------|---------|-------|
| VULN-BILL-001 | Trial infinito | 🔴 CRÍTICA | Uso sem pagamento | Enforcement em middleware |
| VULN-BILL-002 | Suspended ainda acessa | 🔴 CRÍTICA | Suspensão ineficaz | Verificar tenant.status |
| VULN-BILL-003 | Sem enforcement em actions | 🟡 MÉDIA | Mutações sem billing | Verificar em server actions |
| VULN-BILL-004 | Idempotência não verificada | 🟡 MÉDIA | Duplicatas possíveis | Idempotency keys |

---

## 📊 Impacto Estimado

### Antes dos Patches:
- ⚠️ Trial pode continuar indefinidamente se cron falhar
- ⚠️ Uso gratuito entre expiração e cron (horas/dias)
- ⚠️ Suspended tenants ainda acessam sistema
- ⚠️ Perda de receita (MRR)
- ⚠️ Abuse de recursos

### Depois dos Patches:
- ✅ Enforcement real-time no middleware
- ✅ Bloqueio imediato ao expirar trial
- ✅ Grace period configurável (3 dias)
- ✅ Suspended tenants bloqueados
- ✅ Idempotência em pedidos e webhooks
- ✅ Monitoring e alertas
- ✅ Proteção de receita

---

## 🚀 Ordem de Implementação Recomendada

1. **DIA 1 (URGENTE):**
   - Criar `enforcement.ts`
   - Integrar no middleware
   - Testar com trial expirado

2. **DIA 2:**
   - Criar páginas de billing
   - Integrar em server actions críticas
   - Adicionar banner de grace period

3. **DIA 3-4:**
   - Implementar idempotency keys
   - Criar tabelas necessárias
   - Testar duplicatas

4. **DIA 5-7:**
   - Mudar cron para POST
   - Adicionar monitoring
   - Criar dashboard de billing
   - Documentação

---

**FIM DO RELATÓRIO DE BILLING ENFORCEMENT**
