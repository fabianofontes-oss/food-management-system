# BILLING ENFORCEMENT - GUIA DE TESTE (ETAPA 5 P0)

## 📋 PRÉ-REQUISITOS

### 1. Aplicar Migrations no Supabase SQL Editor

Execute na ordem:

```sql
-- 1. Migration: Campo past_due_since
-- Arquivo: supabase/migrations/20251219000003_tenant_past_due_since.sql
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS past_due_since TIMESTAMPTZ NULL;
CREATE INDEX IF NOT EXISTS idx_tenants_past_due ON tenants(past_due_since) WHERE past_due_since IS NOT NULL;
COMMENT ON COLUMN tenants.past_due_since IS 'Data desde quando o tenant está com pagamento atrasado (para calcular grace period)';
```

### 2. Criar Cenários de Teste

**IMPORTANTE:** Antes de executar, descubra seu `user_id`:

```sql
SELECT id, email FROM auth.users WHERE email = 'seu@email.com';
```

Depois, execute o arquivo `supabase/seeds/billing_test_scenarios.sql` **DESCOMENTANDO** as linhas 138-150 e substituindo `'SEU_USER_ID'` pelo seu ID real.

Isso criará 4 lojas de teste:
- `test-active` → ACTIVE (tudo funciona)
- `test-trial-expired` → TRIAL EXPIRED (bloqueado)
- `test-past-due` → PAST DUE (read-only)
- `test-suspended` → SUSPENDED (bloqueado)

---

## 🧪 TESTES NO PREVIEW/PRODUCTION

### URLs para Testar

Substitua `{VERCEL_URL}` pela URL do seu deploy:

1. **ACTIVE** → `https://{VERCEL_URL}/test-active/dashboard`
2. **TRIAL EXPIRED** → `https://{VERCEL_URL}/test-trial-expired/dashboard`
3. **PAST DUE** → `https://{VERCEL_URL}/test-past-due/dashboard`
4. **SUSPENDED** → `https://{VERCEL_URL}/test-suspended/dashboard`

---

## ✅ COMPORTAMENTO ESPERADO

### 1. ACTIVE (test-active)
- ✅ Entra no dashboard normalmente
- ✅ Consegue criar/editar produtos
- ✅ Consegue criar pedidos
- ✅ Sem banners de aviso

**Middleware:** `mode: 'ALLOW'`

---

### 2. TRIAL EXPIRED (test-trial-expired)
- ❌ Redireciona para `/billing/trial-expired`
- ❌ Não consegue acessar dashboard
- ✅ Página mostra mensagem de trial expirado

**Middleware:** `mode: 'BLOCK'`, `reason: 'trial_expired'`

---

### 3. PAST DUE (test-past-due)
- ✅ Entra no dashboard (read-only)
- ⚠️ Banner amarelo: "Pagamento em atraso - X dias restantes"
- ❌ Não consegue criar/editar produtos (botão desabilitado ou erro)
- ❌ Não consegue criar pedidos (bloqueado)
- ✅ Consegue visualizar dados

**Middleware:** `mode: 'READ_ONLY'`, `reason: 'past_due_grace'`

**Teste crítico:** Tente criar um produto → deve falhar com erro de billing

---

### 4. SUSPENDED (test-suspended)
- ❌ Redireciona para `/billing/suspended`
- ❌ Não consegue acessar dashboard
- ✅ Página mostra mensagem de conta suspensa

**Middleware:** `mode: 'BLOCK'`, `reason: 'suspended'`

---

## 🔍 COMO VALIDAR

### 1. Verificar Logs do Middleware

Abra o console do navegador (F12) e veja os logs:

```
[Billing Enforcement] Store: test-active
[Billing Enforcement] Tenant: {...}
[Billing Enforcement] Decision: { mode: 'ALLOW', ... }
```

### 2. Testar Mutações (PAST DUE)

No cenário `test-past-due`, tente:

1. Criar um produto novo
2. Editar um produto existente
3. Criar um pedido

**Resultado esperado:** Erro de billing ou botão desabilitado

### 3. Capturar Prints

Para cada cenário, tire um print mostrando:
- URL na barra de endereço
- Conteúdo da página (dashboard ou página de bloqueio)
- Console do navegador (logs do middleware)

---

## 📊 CHECKLIST DE VALIDAÇÃO

- [ ] Migration `past_due_since` aplicada no Supabase
- [ ] 4 cenários de teste criados no banco
- [ ] Seu `user_id` vinculado como OWNER das 4 lojas
- [ ] Deploy na Vercel está "Ready"
- [ ] Variáveis de ambiente configuradas na Vercel:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_APP_URL`

### Resultados dos Testes:

- [ ] **ACTIVE:** Acessa dashboard normalmente
- [ ] **TRIAL EXPIRED:** Redireciona para `/billing/trial-expired`
- [ ] **PAST DUE:** Entra em read-only + banner amarelo
- [ ] **PAST DUE:** Mutações bloqueadas (criar produto falha)
- [ ] **SUSPENDED:** Redireciona para `/billing/suspended`

---

## 🚀 APÓS VALIDAÇÃO

Quando todos os testes passarem:

```bash
git add -A
git commit -m "feat: ETAPA 5 P0 - billing enforcement validated on vercel"
git push
```

---

## 🌐 PRÓXIMO: DOMÍNIO

### Configurar pediu.food

1. **Vercel Dashboard** → Settings → Domains
2. Adicionar domínio: `pediu.food`
3. Configurar DNS:
   - Tipo: `A` ou `CNAME`
   - Valor: (fornecido pela Vercel)
4. Configurar redirect 301:
   - `www.pediu.food` → `pediu.food`
   - Outros domínios → `pediu.food`
5. Atualizar variável de ambiente:
   - `NEXT_PUBLIC_APP_URL=https://pediu.food`

### Estrutura de URLs

- **Loja:** `https://pediu.food/{slug}`
- **Dashboard:** `https://pediu.food/{slug}/dashboard`
- **Admin:** `https://pediu.food/admin`
- **Onboarding:** `https://pediu.food/onboarding`

---

## 📝 NOTAS

- Grace period: **3 dias** (configurado em `src/lib/billing/enforcement.ts`)
- Trial: **10 dias** (configurado no onboarding)
- Middleware: `src/lib/supabase/middleware.ts`
- Enforcement: `src/lib/billing/enforcement.ts`
