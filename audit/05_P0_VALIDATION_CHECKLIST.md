# ETAPA 5 - P0 BILLING ENFORCEMENT - CHECKLIST DE VALIDAÇÃO

**Data:** 2024-12-19  
**Objetivo:** Validar que o billing enforcement em tempo real está bloqueando corretamente

---

## 📊 Resumo da Implementação

| Componente | Status |
|------------|--------|
| `src/lib/billing/enforcement.ts` com `decideBilling()` | ✅ Criado |
| Middleware com enforcement em tempo real | ✅ Integrado |
| Server Actions bloqueando mutações | ✅ Integrado |
| Páginas `/billing/*` | ✅ Criadas |
| Proteção contra loop de redirect | ✅ Implementada |
| Suporte READ_ONLY mode (grace period) | ✅ Implementado |

---

## 🧪 Como o Sistema Identifica o Tenant

**Resposta:** Opção 2 - **Slug na URL**

O middleware:
1. Extrai o slug da URL (`/{slug}/dashboard`)
2. Busca a store pelo slug
3. Obtém o `tenant_id` da store
4. Aplica `decideBilling()` no tenant

---

## 🔍 Regras de Enforcement (decideBilling)

| Status Tenant | Decisão | Comportamento |
|---------------|---------|---------------|
| `active` | ALLOW | ✅ Acesso total + mutações permitidas |
| `trialing` (válido) | ALLOW | ✅ Acesso total + mutações permitidas |
| `trialing` (expirado) | BLOCK | ❌ Redirect → `/billing/trial-expired` |
| `past_due` (0-3 dias) | READ_ONLY | ⚠️ Acesso permitido + mutações BLOQUEADAS + banner |
| `past_due` (>3 dias) | BLOCK | ❌ Redirect → `/billing/overdue` |
| `unpaid` | BLOCK | ❌ Redirect → `/billing/overdue` |
| `suspended` | BLOCK | ❌ Redirect → `/billing/suspended` |
| Outro/desconhecido | BLOCK | ❌ Redirect → `/billing/overdue` (seguro) |

---

## ✅ Setup: Criar 4 Tenants de Teste

Execute no Supabase SQL Editor:

```sql
-- 1) Tenant ATIVO
INSERT INTO public.tenants (id, name, status, trial_ends_at, past_due_since)
VALUES (
  gen_random_uuid(),
  'Tenant Ativo - Teste P0',
  'active',
  NULL,
  NULL
)
RETURNING id, name, status;

-- 2) Tenant TRIAL EXPIRADO
INSERT INTO public.tenants (id, name, status, trial_ends_at, past_due_since)
VALUES (
  gen_random_uuid(),
  'Tenant Trial Expirado - Teste P0',
  'trial',
  NOW() - INTERVAL '1 day', -- Expirou ontem
  NULL
)
RETURNING id, name, status, trial_ends_at;

-- 3) Tenant PAST_DUE (Grace Period)
INSERT INTO public.tenants (id, name, status, trial_ends_at, past_due_since)
VALUES (
  gen_random_uuid(),
  'Tenant Past Due - Teste P0',
  'past_due',
  NULL,
  NOW() - INTERVAL '1 day' -- 1 dia atrás (dentro do grace period de 3 dias)
)
RETURNING id, name, status, past_due_since;

-- 4) Tenant SUSPENSO
INSERT INTO public.tenants (id, name, status, trial_ends_at, past_due_since)
VALUES (
  gen_random_uuid(),
  'Tenant Suspenso - Teste P0',
  'suspended',
  NULL,
  NULL
)
RETURNING id, name, status;
```

**Copie os 4 IDs retornados.**

---

### Criar Stores para os 4 Tenants

```sql
-- Store do Tenant Ativo
INSERT INTO public.stores (tenant_id, name, slug, niche, mode, is_active)
VALUES (
  'TENANT_ATIVO_ID', -- ← Cole o ID
  'Loja Ativa P0',
  'loja-ativa-p0',
  'burger',
  'store',
  true
)
RETURNING id, slug;

-- Store do Tenant Trial Expirado
INSERT INTO public.stores (tenant_id, name, slug, niche, mode, is_active)
VALUES (
  'TENANT_TRIAL_EXPIRADO_ID', -- ← Cole o ID
  'Loja Trial Expirado P0',
  'loja-trial-p0',
  'burger',
  'store',
  true
)
RETURNING id, slug;

-- Store do Tenant Past Due
INSERT INTO public.stores (tenant_id, name, slug, niche, mode, is_active)
VALUES (
  'TENANT_PAST_DUE_ID', -- ← Cole o ID
  'Loja Past Due P0',
  'loja-pastdue-p0',
  'burger',
  'store',
  true
)
RETURNING id, slug;

-- Store do Tenant Suspenso
INSERT INTO public.stores (tenant_id, name, slug, niche, mode, is_active)
VALUES (
  'TENANT_SUSPENSO_ID', -- ← Cole o ID
  'Loja Suspensa P0',
  'loja-suspensa-p0',
  'burger',
  'store',
  true
)
RETURNING id, slug;
```

---

## ✅ Teste 1: Tenant ATIVO (ALLOW)

### 1.1. Acessar Dashboard

1. Logar com usuário vinculado ao tenant ativo
2. Acessar `/loja-ativa-p0/dashboard`

**Esperado:** ✅ Acessa normalmente

---

### 1.2. Criar Pedido (Mutação)

1. Tentar criar um pedido
2. Verificar que a operação é executada

**Esperado:** ✅ Pedido criado com sucesso

---

## ❌ Teste 2: Tenant TRIAL EXPIRADO (BLOCK)

### 2.1. Acessar Dashboard

1. Logar com usuário vinculado ao tenant trial expirado
2. Tentar acessar `/loja-trial-p0/dashboard`

**Esperado:** ❌ Redirect para `/billing/trial-expired`

---

### 2.2. Verificar Página

**Esperado:** ✅ Página exibida com mensagem clara e botão "Ver Planos"

---

### 2.3. Verificar Logs do Middleware

```
[Middleware] BILLING BLOCKED: tenant=TENANT_ID reason=TRIAL_EXPIRED
```

---

## ⚠️ Teste 3: Tenant PAST_DUE (READ_ONLY)

### 3.1. Acessar Dashboard

1. Logar com usuário vinculado ao tenant past_due
2. Acessar `/loja-pastdue-p0/dashboard`

**Esperado:** ✅ Acessa normalmente (READ_ONLY mode)

---

### 3.2. Verificar Headers da Response

Inspecionar no DevTools → Network:
- `x-billing-mode: read-only`
- `x-billing-grace-days: 2` (ou similar)

**Esperado:** ✅ Headers presentes

---

### 3.3. Tentar Criar Pedido (Deve Bloquear)

1. Tentar criar um pedido
2. Verificar erro retornado

**Esperado:** ❌ Erro: "Ação bloqueada: pagamento atrasado (X dias de grace period restantes)"

---

### 3.4. Verificar Logs

```
[Middleware] BILLING READ_ONLY: tenant=TENANT_ID (grace period: 2 dias)
[BILLING] Tenant TENANT_ID em READ_ONLY (past_due grace period: 2 dias) - BLOQUEANDO mutação
```

---

## ❌ Teste 4: Tenant SUSPENSO (BLOCK)

### 4.1. Acessar Dashboard

1. Logar com usuário vinculado ao tenant suspenso
2. Tentar acessar `/loja-suspensa-p0/dashboard`

**Esperado:** ❌ Redirect para `/billing/suspended`

---

### 4.2. Verificar Página

**Esperado:** ✅ Página exibida com alerta vermelho e botão "Regularizar Pagamento"

---

### 4.3. Tentar Criar Pedido (Deve Bloquear)

**Esperado:** ❌ Erro: "Ação bloqueada: billing inválido"

---

## 🔍 Queries de Validação

### Query 1: Verificar Status de Todos os Tenants

```sql
SELECT 
  t.id,
  t.name,
  t.status,
  t.trial_ends_at,
  t.past_due_since,
  CASE 
    WHEN t.status = 'active' THEN '✅ ALLOW'
    WHEN t.status = 'trial' AND t.trial_ends_at >= NOW() THEN '✅ ALLOW'
    WHEN t.status = 'trial' AND t.trial_ends_at < NOW() THEN '❌ BLOCK (trial expirado)'
    WHEN t.status = 'past_due' AND t.past_due_since >= NOW() - INTERVAL '3 days' THEN '⚠️ READ_ONLY (grace period)'
    WHEN t.status = 'past_due' THEN '❌ BLOCK (grace expirado)'
    WHEN t.status = 'suspended' THEN '❌ BLOCK (suspenso)'
    WHEN t.status = 'unpaid' THEN '❌ BLOCK (unpaid)'
    ELSE '❌ BLOCK (desconhecido)'
  END as enforcement_mode
FROM public.tenants t
ORDER BY t.created_at DESC
LIMIT 10;
```

---

### Query 2: Verificar Stores por Enforcement Mode

```sql
SELECT 
  s.slug,
  s.name as store_name,
  t.name as tenant_name,
  t.status as tenant_status,
  t.trial_ends_at,
  t.past_due_since,
  CASE 
    WHEN t.status = 'active' THEN '✅ ALLOW'
    WHEN t.status = 'trial' AND t.trial_ends_at >= NOW() THEN '✅ ALLOW'
    WHEN t.status = 'trial' AND t.trial_ends_at < NOW() THEN '❌ BLOCK'
    WHEN t.status = 'past_due' AND t.past_due_since >= NOW() - INTERVAL '3 days' THEN '⚠️ READ_ONLY'
    WHEN t.status IN ('past_due', 'suspended', 'unpaid') THEN '❌ BLOCK'
    ELSE '❌ BLOCK'
  END as enforcement
FROM public.stores s
JOIN public.tenants t ON t.id = s.tenant_id
WHERE s.slug LIKE '%-p0'
ORDER BY s.created_at DESC;
```

---

## 📋 Checklist de Conclusão

- [ ] Tenant ATIVO acessa dashboard e cria pedidos
- [ ] Tenant TRIAL EXPIRADO é bloqueado → `/billing/trial-expired`
- [ ] Tenant PAST_DUE acessa dashboard (READ_ONLY)
- [ ] Tenant PAST_DUE NÃO consegue criar pedidos
- [ ] Headers `x-billing-mode` e `x-billing-grace-days` presentes
- [ ] Tenant SUSPENSO é bloqueado → `/billing/suspended`
- [ ] Logs do middleware mostram BLOCK/READ_ONLY
- [ ] Server Actions retornam erro de billing
- [ ] Rotas `/billing/*` não entram em loop
- [ ] Lint passou sem erros

---

## 🚀 Próximas Etapas

Após validação da ETAPA 5 P0:

1. **ETAPA 5C - Idempotência + Locks**
   - `orders.idempotency_key` UNIQUE
   - `webhook_events` (dedupe MercadoPago)
   - `cron_locks` (lock distribuído)

2. **ETAPA 5D - UI de Billing**
   - Grace Period Banner (ler headers `x-billing-mode`)
   - Página de planos
   - Página de faturas

---

## 🔒 Lembrete de Segurança

**CRÍTICO:** Rotacione `SUPABASE_SERVICE_ROLE_KEY`:

1. Supabase → Settings → API
2. Reset `service_role` key
3. Atualizar no deploy (Vercel/Railway)
4. Atualizar no `.env.local`

---

**ETAPA 5 P0 IMPLEMENTADA!** ✅ (aguardando validação dos 4 testes)
