# ETAPA 5B - BILLING ENFORCEMENT - CHECKLIST DE VALIDAÇÃO

**Data:** 2024-12-19  
**Objetivo:** Validar que o billing enforcement está bloqueando tenants com billing inválido

---

## 📊 Resumo da Implementação

| Componente | Status |
|------------|--------|
| `src/lib/billing/enforcement.ts` | ✅ Criado |
| Middleware com billing check | ✅ Integrado |
| Server Actions com enforcement | ✅ Integrado |
| Páginas `/billing/*` | ✅ Criadas |

---

## 🧪 Testes Manuais (3 Tenants)

### Setup: Criar 3 Tenants de Teste

Execute no Supabase SQL Editor:

```sql
-- 1) Tenant ATIVO (tudo OK)
INSERT INTO public.tenants (id, name, status, trial_ends_at)
VALUES (
  gen_random_uuid(),
  'Tenant Ativo - Teste',
  'active',
  NULL
)
RETURNING id, name, status;

-- 2) Tenant TRIAL EXPIRADO
INSERT INTO public.tenants (id, name, status, trial_ends_at)
VALUES (
  gen_random_uuid(),
  'Tenant Trial Expirado - Teste',
  'trial',
  NOW() - INTERVAL '1 day' -- Expirou ontem
)
RETURNING id, name, status, trial_ends_at;

-- 3) Tenant SUSPENSO
INSERT INTO public.tenants (id, name, status, trial_ends_at)
VALUES (
  gen_random_uuid(),
  'Tenant Suspenso - Teste',
  'suspended',
  NULL
)
RETURNING id, name, status;
```

**Copie os 3 IDs retornados para usar nos testes.**

---

### Criar Stores para os 3 Tenants

```sql
-- Store do Tenant Ativo
INSERT INTO public.stores (tenant_id, name, slug, niche, mode, is_active)
VALUES (
  'TENANT_ATIVO_ID', -- ← Cole o ID do tenant ativo
  'Loja Ativa',
  'loja-ativa-teste',
  'burger',
  'store',
  true
)
RETURNING id, slug;

-- Store do Tenant Trial Expirado
INSERT INTO public.stores (tenant_id, name, slug, niche, mode, is_active)
VALUES (
  'TENANT_TRIAL_EXPIRADO_ID', -- ← Cole o ID do tenant trial expirado
  'Loja Trial Expirado',
  'loja-trial-teste',
  'burger',
  'store',
  true
)
RETURNING id, slug;

-- Store do Tenant Suspenso
INSERT INTO public.stores (tenant_id, name, slug, niche, mode, is_active)
VALUES (
  'TENANT_SUSPENSO_ID', -- ← Cole o ID do tenant suspenso
  'Loja Suspensa',
  'loja-suspensa-teste',
  'burger',
  'store',
  true
)
RETURNING id, slug;
```

---

## ✅ Teste 1: Tenant ATIVO (Deve Funcionar)

### 1.1. Acessar Dashboard

1. Logar com usuário vinculado ao tenant ativo
2. Acessar `/loja-ativa-teste/dashboard`

**Esperado:** ✅ Acessa normalmente

---

### 1.2. Criar Pedido (Mutação)

1. Tentar criar um pedido via API ou UI
2. Verificar que a operação é executada

**Esperado:** ✅ Pedido criado com sucesso

---

### 1.3. Verificar Logs

```sql
SELECT created_at, admin_email, action, target_type, metadata
FROM public.admin_audit_logs
WHERE metadata->>'tenant_id' = 'TENANT_ATIVO_ID'
ORDER BY created_at DESC
LIMIT 5;
```

**Esperado:** Logs de ações executadas (se houver)

---

## ❌ Teste 2: Tenant TRIAL EXPIRADO (Deve Bloquear)

### 2.1. Acessar Dashboard

1. Logar com usuário vinculado ao tenant trial expirado
2. Tentar acessar `/loja-trial-teste/dashboard`

**Esperado:** ❌ Redirect para `/billing/trial-expired`

---

### 2.2. Verificar Página de Trial Expirado

1. Verificar que a página `/billing/trial-expired` é exibida
2. Verificar mensagem e botões de ação

**Esperado:** ✅ Página exibida com mensagem clara

---

### 2.3. Tentar Criar Pedido (Deve Bloquear)

Se conseguir chamar a API diretamente (bypass do middleware):

```bash
curl -X POST https://SEU_DOMINIO/api/orders \
  -H "Content-Type: application/json" \
  -d '{"store_id":"STORE_TRIAL_EXPIRADO_ID",...}'
```

**Esperado:** ❌ Erro: "Ação bloqueada: billing inválido"

---

## ❌ Teste 3: Tenant SUSPENSO (Deve Bloquear)

### 3.1. Acessar Dashboard

1. Logar com usuário vinculado ao tenant suspenso
2. Tentar acessar `/loja-suspensa-teste/dashboard`

**Esperado:** ❌ Redirect para `/billing/suspended`

---

### 3.2. Verificar Página de Suspensão

1. Verificar que a página `/billing/suspended` é exibida
2. Verificar mensagem de suspensão

**Esperado:** ✅ Página exibida com alerta vermelho

---

### 3.3. Tentar Criar Pedido (Deve Bloquear)

**Esperado:** ❌ Erro: "Ação bloqueada: billing inválido"

---

## 🔍 Validação de Código

### Query 1: Verificar Billing Status de Todos os Tenants

```sql
SELECT 
  t.id,
  t.name,
  t.status,
  t.trial_ends_at,
  CASE 
    WHEN t.status = 'cancelled' THEN 'BLOQUEADO'
    WHEN t.status = 'suspended' THEN 'BLOQUEADO'
    WHEN t.status = 'trial' AND t.trial_ends_at < NOW() THEN 'BLOQUEADO (trial expirado)'
    WHEN t.status = 'trial' AND t.trial_ends_at >= NOW() THEN 'PERMITIDO (trial válido)'
    WHEN t.status = 'active' THEN 'PERMITIDO'
    ELSE 'DESCONHECIDO'
  END as billing_status
FROM public.tenants t
ORDER BY t.created_at DESC
LIMIT 10;
```

---

### Query 2: Verificar Stores por Status de Billing

```sql
SELECT 
  s.slug,
  s.name as store_name,
  t.name as tenant_name,
  t.status as tenant_status,
  t.trial_ends_at,
  CASE 
    WHEN t.status IN ('cancelled', 'suspended') THEN '❌ BLOQUEADO'
    WHEN t.status = 'trial' AND t.trial_ends_at < NOW() THEN '❌ BLOQUEADO'
    WHEN t.status = 'trial' AND t.trial_ends_at >= NOW() THEN '✅ PERMITIDO'
    WHEN t.status = 'active' THEN '✅ PERMITIDO'
    ELSE '⚠️ DESCONHECIDO'
  END as acesso
FROM public.stores s
JOIN public.tenants t ON t.id = s.tenant_id
ORDER BY s.created_at DESC
LIMIT 10;
```

---

## 📋 Checklist de Conclusão

- [ ] Tenant ATIVO acessa dashboard normalmente
- [ ] Tenant ATIVO cria pedidos normalmente
- [ ] Tenant TRIAL EXPIRADO é bloqueado no middleware
- [ ] Tenant TRIAL EXPIRADO vê página `/billing/trial-expired`
- [ ] Tenant TRIAL EXPIRADO não consegue criar pedidos
- [ ] Tenant SUSPENSO é bloqueado no middleware
- [ ] Tenant SUSPENSO vê página `/billing/suspended`
- [ ] Tenant SUSPENSO não consegue criar pedidos
- [ ] Logs do middleware mostram bloqueios
- [ ] Server Actions retornam erro de billing

---

## 🚀 Próximas Etapas

Após validação da ETAPA 5B:

1. **ETAPA 5C - Idempotência + Locks**
   - `orders.idempotency_key` UNIQUE
   - `webhook_events` (dedupe MercadoPago)
   - `cron_locks` (lock distribuído)

2. **ETAPA 5D - UI de Billing**
   - Grace Period Banner
   - Página de planos
   - Página de faturas

---

## 🔒 Lembrete de Segurança

**CRÍTICO:** Rotacione `SUPABASE_SERVICE_ROLE_KEY` que foi exposta:

1. Supabase → Settings → API
2. Reset `service_role` key
3. Atualizar no deploy (Vercel/Railway)
4. Atualizar no `.env.local`

---

**ETAPA 5B CONCLUÍDA!** ✅ (após validação dos 3 testes)
