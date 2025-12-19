# ETAPA 4A - Inventário Completo do SuperAdmin

**Data:** 2024-12-19  
**Objetivo:** Mapear todas as superfícies do SuperAdmin antes dos patches de segurança

---

## 📊 Resumo Executivo

| Categoria | Quantidade | Risco Crítico |
|-----------|------------|---------------|
| **Rotas UI SuperAdmin** | 18 páginas | 3 |
| **Server Actions** | 8 actions | 5 |
| **API Routes Internas** | 8 endpoints | 4 |
| **Operações Destrutivas** | 6 operações | 6 |
| **Tabelas com CASCADE** | 30+ tabelas | ALTO |

---

## 🎯 1. ROTAS UI DO SUPERADMIN

### Estrutura: `src/app/(super-admin)/admin/**`

| # | Rota | Página | Auth Atual | Risco | Guard Rails |
|---|------|--------|------------|-------|-------------|
| 1 | `/admin` | Dashboard principal | `isSuperAdmin(email)` | MÉDIO | ✅ Middleware |
| 2 | `/admin/tenants` | Gestão de Tenants | `isSuperAdmin(email)` | **CRÍTICO** | ❌ Sem confirmação delete |
| 3 | `/admin/stores` | Gestão de Stores | `isSuperAdmin(email)` | **CRÍTICO** | ❌ Sem confirmação delete |
| 4 | `/admin/users` | Gestão de Usuários | `isSuperAdmin(email)` | **CRÍTICO** | ❌ Sem confirmação delete |
| 5 | `/admin/plans` | Gestão de Planos | `isSuperAdmin(email)` | ALTO | ⚠️ Confirmação básica |
| 6 | `/admin/plans/[planId]` | Editar Plano | `isSuperAdmin(email)` | ALTO | ⚠️ Confirmação básica |
| 7 | `/admin/billing` | Cobrança/Faturas | `isSuperAdmin(email)` | ALTO | ❌ Não implementado |
| 8 | `/admin/analytics` | Analytics | `isSuperAdmin(email)` | BAIXO | ✅ Read-only |
| 9 | `/admin/audit` | Logs de Auditoria | `isSuperAdmin(email)` | BAIXO | ✅ Read-only |
| 10 | `/admin/logs` | System Logs | `isSuperAdmin(email)` | BAIXO | ✅ Read-only |
| 11 | `/admin/health` | Health Dashboard | `isSuperAdmin(email)` | MÉDIO | ⚠️ Alguns fixes |
| 12 | `/admin/health/database` | Database Health | `isSuperAdmin(email)` | BAIXO | ✅ Read-only |
| 13 | `/admin/health/monitor` | System Monitor | `isSuperAdmin(email)` | BAIXO | ✅ Read-only |
| 14 | `/admin/health/audit` | Health Audit | `isSuperAdmin(email)` | MÉDIO | ⚠️ Executa scripts |
| 15 | `/admin/integrations` | Integrações | `isSuperAdmin(email)` | MÉDIO | ⚠️ Tokens sensíveis |
| 16 | `/admin/features` | Feature Flags | `isSuperAdmin(email)` | ALTO | ❌ Não implementado |
| 17 | `/admin/automations` | Automações | `isSuperAdmin(email)` | ALTO | ❌ Não implementado |
| 18 | `/admin/partners` | Parceiros | `isSuperAdmin(email)` | MÉDIO | ❌ Não implementado |

---

## ⚙️ 2. SERVER ACTIONS (`use server`)

### `src/lib/superadmin/actions.ts`

| # | Action | Método | Tabelas Afetadas | Auth | Risco | Guard Rails | Audit Log |
|---|--------|--------|------------------|------|-------|-------------|-----------|
| 1 | `assignStoreOwnerAction` | INSERT/UPDATE | `users`, `store_users` | `isSuperAdmin(email)` | MÉDIO | ✅ Verifica existência | ❌ NÃO |
| 2 | `removeStoreUserAction` | DELETE | `store_users` | `isSuperAdmin(email)` | ALTO | ❌ Sem confirmação | ❌ NÃO |
| 3 | `deleteStoreAction` | DELETE | `stores` + **CASCADE** | `isSuperAdmin(email)` | **CRÍTICO** | ❌ Apenas `confirm()` JS | ❌ NÃO |
| 4 | `deleteTenantAction` | DELETE | `tenants` + **CASCADE** | `isSuperAdmin(email)` | **CRÍTICO** | ❌ Apenas `confirm()` JS | ❌ NÃO |

**CASCADE de `deleteStoreAction`:**
- ✅ `categories` (ON DELETE CASCADE)
- ✅ `products` (ON DELETE CASCADE)
- ✅ `customers` (ON DELETE CASCADE)
- ✅ `orders` (ON DELETE CASCADE)
- ✅ `order_items` (ON DELETE CASCADE)
- ✅ `tables` (ON DELETE CASCADE)
- ✅ `coupons` (ON DELETE CASCADE)
- ✅ `store_users` (ON DELETE CASCADE)
- ✅ `notifications` (ON DELETE CASCADE)
- ✅ `cash_registers` (ON DELETE CASCADE)
- ✅ **30+ tabelas afetadas**

**CASCADE de `deleteTenantAction`:**
- ✅ Todas as `stores` do tenant (ON DELETE CASCADE)
- ✅ **Todas as tabelas relacionadas às stores** (CASCADE em cadeia)
- ✅ **Potencialmente centenas de registros**

---

### `src/modules/admin/tenants/actions.ts`

| # | Action | Método | Tabelas Afetadas | Auth | Risco | Guard Rails | Audit Log |
|---|--------|--------|------------------|------|-------|-------------|-----------|
| 5 | `loadTenantsAction` | SELECT | `tenants`, `plans`, `tenant_subscriptions` | Nenhuma (!) | BAIXO | ⚠️ Sem auth check | ❌ NÃO |
| 6 | `createTenantAction` | INSERT | `tenants` | Nenhuma (!) | MÉDIO | ⚠️ Sem auth check | ❌ NÃO |
| 7 | `updateTenantAction` | UPDATE | `tenants` | Nenhuma (!) | ALTO | ⚠️ Sem auth check | ❌ NÃO |
| 8 | `deleteTenantAction` | DELETE | `tenants` + CASCADE | Nenhuma (!) | **CRÍTICO** | ⚠️ Sem auth check | ❌ NÃO |
| 9 | `changeTenantPlanAction` | INSERT/UPDATE | `tenant_subscriptions` | Nenhuma (!) | ALTO | ⚠️ Sem auth check | ❌ NÃO |

**⚠️ VULNERABILIDADE CRÍTICA:** Nenhuma das actions em `modules/admin/tenants/actions.ts` verifica autenticação!

---

### `src/lib/superadmin/users.ts`

| # | Action | Método | Tabelas Afetadas | Auth | Risco | Guard Rails | Audit Log |
|---|--------|--------|------------------|------|-------|-------------|-----------|
| 10 | `getSystemUsers` | SELECT | `users`, `store_users`, `stores`, `tenants` | Nenhuma (!) | BAIXO | ⚠️ Sem auth check | ❌ NÃO |
| 11 | `getUserStats` | SELECT | `users`, `store_users` | Nenhuma (!) | BAIXO | ⚠️ Sem auth check | ❌ NÃO |
| 12 | `deleteSystemUser` | DELETE | `users` + CASCADE | Nenhuma (!) | **CRÍTICO** | ⚠️ Sem auth check | ❌ NÃO |

**CASCADE de `deleteSystemUser`:**
- ✅ `store_users` (ON DELETE CASCADE)
- ✅ `auth.users` (via FK CASCADE)

---

## 🔌 3. API ROUTES INTERNAS

### `src/app/api/admin/**`

| # | Endpoint | Método | O Que Faz | Auth Atual | Risco | Bloqueado Prod | Audit Log |
|---|----------|--------|-----------|------------|-------|----------------|-----------|
| 1 | `/api/admin/demo-setup` | POST | Cria loja demo | `requireInternalAuth` | MÉDIO | ❌ NÃO | ❌ NÃO |
| 2 | `/api/admin/demo-setup` | GET | Verifica loja demo | `requireInternalAuth` | BAIXO | ❌ NÃO | ❌ NÃO |
| 3 | `/api/admin/audit/run` | POST | Executa script Python | `requireInternalAuth` + `blockInProduction` | ALTO | ✅ SIM | ❌ NÃO |
| 4 | `/api/admin/audit/fix` | POST | Executa fixes automáticos | `requireInternalAuth` | ALTO | ❌ NÃO | ❌ NÃO |
| 5 | `/api/admin/audit/fix-localhost` | POST | Fix de URLs localhost | `requireInternalAuth` | MÉDIO | ❌ NÃO | ❌ NÃO |

---

### `src/app/api/internal/**`

| # | Endpoint | Método | O Que Faz | Auth Atual | Risco | Bloqueado Prod | Audit Log |
|---|----------|--------|-----------|------------|-------|----------------|-----------|
| 6 | `/api/internal/e2e/seed` | POST | Seed dados E2E | `requireInternalAuth` | ALTO | ❌ NÃO | ❌ NÃO |

**⚠️ ATENÇÃO:** Endpoint de seed **DEVE** ser bloqueado em produção!

---

### `src/app/api/health/**`

| # | Endpoint | Método | O Que Faz | Auth Atual | Risco | Side Effects | Audit Log |
|---|----------|--------|-----------|------------|-------|--------------|-----------|
| 7 | `/api/health/status` | GET | Status do sistema | `requireInternalAuth` | BAIXO | ❌ NÃO | ❌ NÃO |
| 8 | `/api/health/database` | GET | Status do banco | `requireInternalAuth` | BAIXO | ❌ NÃO | ❌ NÃO |
| 9 | `/api/health/diagnostic` | GET | Diagnóstico completo | `requireInternalAuth` | BAIXO | ❌ NÃO | ❌ NÃO |
| 10 | `/api/health/audit` | GET | Audit report | `requireInternalAuth` | BAIXO | ❌ NÃO | ❌ NÃO |
| 11 | `/api/health/fix` | POST | **Executa fixes no banco** | `requireInternalAuth` | **CRÍTICO** | ✅ SIM (UPDATE) | ❌ NÃO |
| 12 | `/api/health/files` | GET | Lista arquivos | `requireInternalAuth` | BAIXO | ❌ NÃO | ❌ NÃO |
| 13 | `/api/health/pages` | GET | Lista páginas | `requireInternalAuth` | BAIXO | ❌ NÃO | ❌ NÃO |

**⚠️ CRÍTICO:** `/api/health/fix` executa UPDATEs em massa sem confirmação!

---

## 💥 4. OPERAÇÕES DESTRUTIVAS / CRÍTICAS

### Operações DELETE com CASCADE

| # | Operação | Arquivo | Tabelas Afetadas | Confirmação | Cooldown | Audit Log | Risco |
|---|----------|---------|------------------|-------------|----------|-----------|-------|
| 1 | **Delete Tenant** | `lib/superadmin/actions.ts:185` | `tenants` + 30+ CASCADE | ❌ `confirm()` JS | ❌ NÃO | ❌ NÃO | **P0** |
| 2 | **Delete Store** | `lib/superadmin/actions.ts:149` | `stores` + 30+ CASCADE | ❌ `confirm()` JS | ❌ NÃO | ❌ NÃO | **P0** |
| 3 | **Delete User** | `lib/superadmin/users.ts:124` | `users` + `auth.users` | ❌ Nenhuma | ❌ NÃO | ❌ NÃO | **P0** |
| 4 | **Delete Plan** | `lib/superadmin/plans.ts:100` | `plans` | ⚠️ Verifica FK | ❌ NÃO | ❌ NÃO | **P1** |
| 5 | **Remove Store User** | `lib/superadmin/actions.ts:113` | `store_users` | ❌ Nenhuma | ❌ NÃO | ❌ NÃO | **P1** |
| 6 | **Delete Tenant (módulo)** | `modules/admin/tenants/actions.ts:125` | `tenants` + CASCADE | ❌ Nenhuma | ❌ NÃO | ❌ NÃO | **P0** |

---

### Operações UPDATE Críticas

| # | Operação | Arquivo | O Que Altera | Auth Check | Audit Log | Risco |
|---|----------|---------|--------------|------------|-----------|-------|
| 7 | **Update Tenant** | `modules/admin/tenants/actions.ts:91` | `tenants` (status, billing) | ❌ NÃO | ❌ NÃO | **P0** |
| 8 | **Change Tenant Plan** | `modules/admin/tenants/actions.ts:143` | `tenant_subscriptions` | ❌ NÃO | ❌ NÃO | **P0** |
| 9 | **Update Store Settings** | `api/health/fix` | `stores.settings` (em massa) | ✅ Token | ❌ NÃO | **P1** |
| 10 | **Suspend Tenant** | `modules/admin/tenants/actions.ts:91` | `tenants.status = 'suspended'` | ❌ NÃO | ❌ NÃO | **P0** |

---

### Operações com Side Effects em GET

| # | Endpoint | Método | Side Effect | Risco |
|---|----------|--------|-------------|-------|
| 1 | Nenhum detectado | - | - | ✅ OK |

---

## 🔐 5. MODELO DE PERMISSÃO ATUAL

### Autenticação SuperAdmin

**Arquivo:** `src/lib/auth/super-admin.ts`

```typescript
export function isSuperAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  const normalizedEmail = email.trim().toLowerCase()
  const superAdminEmails = getSuperAdminEmails()
  return superAdminEmails.includes(normalizedEmail)
}
```

**Fontes de Super Admins:**
1. **Variável de ambiente:** `SUPER_ADMIN_EMAILS` (CSV)
2. **Hardcoded fallback:**
   - `admin@sistema.com`
   - `fabiano@exemplo.com`
   - `fabianobraga@me.com`

---

### Problemas Identificados

| # | Problema | Impacto | Prioridade |
|---|----------|---------|------------|
| 1 | **Auth baseada em EMAIL, não USER_ID** | Spoofing de email | **P0** |
| 2 | **Nenhum audit log** | Impossível rastrear ações | **P0** |
| 3 | **Actions sem auth check** (`modules/admin/tenants/`) | Qualquer um pode chamar | **P0** |
| 4 | **Sem confirmação forte para DELETE** | Apenas `confirm()` JS | **P0** |
| 5 | **Sem cooldown para operações críticas** | Ações instantâneas | **P1** |
| 6 | **Sem permissões granulares** | Tudo ou nada | **P1** |
| 7 | **Sem rate limiting** | Abuso possível | **P1** |
| 8 | **Endpoint E2E não bloqueado em prod** | Seed em produção | **P0** |

---

### Permissões Granulares Necessárias

| Permissão | Descrição | Tabela Futura |
|-----------|-----------|---------------|
| `delete_tenant` | Deletar tenant e todas as stores | `admin_permissions` |
| `delete_store` | Deletar store e dados relacionados | `admin_permissions` |
| `delete_user` | Deletar usuário do sistema | `admin_permissions` |
| `suspend_tenant` | Suspender tenant (billing) | `admin_permissions` |
| `change_plan` | Alterar plano de tenant | `admin_permissions` |
| `view_audit_logs` | Ver logs de auditoria | `admin_permissions` |
| `execute_fixes` | Executar fixes automáticos | `admin_permissions` |
| `manage_plans` | Criar/editar/deletar planos | `admin_permissions` |

---

## 🗄️ 6. TABELAS COM CASCADE

### Cascades Críticos (Banco de Dados)

| Tabela Pai | Tabela Filha | Tipo CASCADE | Impacto |
|------------|--------------|--------------|---------|
| `tenants` | `stores` | ON DELETE CASCADE | **CRÍTICO** - Deleta todas as stores |
| `stores` | `categories` | ON DELETE CASCADE | ALTO - Deleta categorias |
| `stores` | `products` | ON DELETE CASCADE | **CRÍTICO** - Deleta produtos |
| `stores` | `customers` | ON DELETE CASCADE | **CRÍTICO** - Deleta clientes |
| `stores` | `orders` | ON DELETE CASCADE | **CRÍTICO** - Deleta pedidos |
| `stores` | `tables` | ON DELETE CASCADE | ALTO - Deleta mesas |
| `stores` | `coupons` | ON DELETE CASCADE | MÉDIO - Deleta cupons |
| `stores` | `store_users` | ON DELETE CASCADE | ALTO - Remove vínculos |
| `orders` | `order_items` | ON DELETE CASCADE | ALTO - Deleta itens |
| `order_items` | `order_item_modifiers` | ON DELETE CASCADE | MÉDIO - Deleta modificadores |
| `users` | `store_users` | ON DELETE CASCADE | ALTO - Remove vínculos |
| `auth.users` | `users` | ON DELETE CASCADE | **CRÍTICO** - Deleta usuário público |

**Total:** 30+ tabelas com CASCADE configurado

---

## 🚨 7. TOP 10 PATCHES P0 (PRIORIDADE MÁXIMA)

### P0.1 - Adicionar Auth Check em `modules/admin/tenants/actions.ts`

**Problema:** Nenhuma das 5 actions verifica autenticação  
**Impacto:** Qualquer usuário pode criar/editar/deletar tenants  
**Solução:**
```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { isSuperAdmin } from '@/lib/auth/super-admin'

export async function deleteTenantAction(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user || !isSuperAdmin(user.email)) {
    return { success: false, error: 'Acesso não autorizado' }
  }
  
  // ... resto do código
}
```

**Arquivos:**
- `src/modules/admin/tenants/actions.ts` (5 actions)

---

### P0.2 - Implementar Audit Log para Operações Destrutivas

**Problema:** Nenhuma operação crítica é registrada  
**Impacto:** Impossível rastrear quem deletou o quê  
**Solução:**
```sql
CREATE TABLE admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES users(id),
  admin_email VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL, -- 'delete_tenant', 'delete_store', etc
  target_type VARCHAR(50) NOT NULL, -- 'tenant', 'store', 'user'
  target_id UUID NOT NULL,
  target_name VARCHAR(255),
  metadata JSONB, -- dados adicionais
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_admin ON admin_audit_logs(admin_user_id);
CREATE INDEX idx_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX idx_audit_logs_created ON admin_audit_logs(created_at DESC);
```

**Função helper:**
```typescript
// src/lib/superadmin/audit-log.ts
export async function logAdminAction(params: {
  action: string
  targetType: string
  targetId: string
  targetName?: string
  metadata?: Record<string, any>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  await supabase.from('admin_audit_logs').insert({
    admin_user_id: user!.id,
    admin_email: user!.email,
    action: params.action,
    target_type: params.targetType,
    target_id: params.targetId,
    target_name: params.targetName,
    metadata: params.metadata
  })
}
```

---

### P0.3 - Confirmação Forte para DELETE (2FA-like)

**Problema:** Apenas `confirm()` JS para deletar tenant/store  
**Impacto:** Deleção acidental de dados críticos  
**Solução:**
```typescript
// Modal de confirmação com digitação do nome
export async function deleteTenantAction(id: string, confirmationName: string) {
  const supabase = await createClient()
  
  // 1. Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isSuperAdmin(user.email)) {
    return { success: false, error: 'Acesso não autorizado' }
  }
  
  // 2. Buscar tenant
  const { data: tenant } = await supabase
    .from('tenants')
    .select('name')
    .eq('id', id)
    .single()
  
  // 3. Validar confirmação
  if (tenant.name !== confirmationName) {
    return { success: false, error: 'Nome não corresponde' }
  }
  
  // 4. Audit log ANTES
  await logAdminAction({
    action: 'delete_tenant',
    targetType: 'tenant',
    targetId: id,
    targetName: tenant.name
  })
  
  // 5. Executar delete
  const { error } = await supabase.from('tenants').delete().eq('id', id)
  
  if (error) {
    await logAdminAction({
      action: 'delete_tenant_failed',
      targetType: 'tenant',
      targetId: id,
      metadata: { error: error.message }
    })
    return { success: false, error: error.message }
  }
  
  return { success: true }
}
```

---

### P0.4 - Bloquear Endpoint E2E em Produção

**Problema:** `/api/internal/e2e/seed` não está bloqueado  
**Impacto:** Seed de dados de teste em produção  
**Solução:**
```typescript
// src/app/api/internal/e2e/seed/route.ts
import { blockInProduction, requireInternalAuth } from '@/lib/security/internal-auth'

export async function POST(request: Request) {
  // CRITICAL: Bloquear em produção
  try {
    blockInProduction()
    requireInternalAuth(request)
  } catch (error) {
    if (error instanceof Response) return error
    throw error
  }
  
  // ... resto do código
}
```

---

### P0.5 - Migrar Auth de EMAIL para USER_ID

**Problema:** `isSuperAdmin(email)` vulnerável a spoofing  
**Impacto:** Possível bypass de autenticação  
**Solução:**
```sql
-- Nova tabela de Super Admins
CREATE TABLE super_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP NOT NULL DEFAULT now(),
  revoked_at TIMESTAMP,
  notes TEXT
);

CREATE INDEX idx_super_admins_user ON super_admins(user_id) WHERE revoked_at IS NULL;
```

```typescript
// src/lib/auth/super-admin.ts
export async function isSuperAdminByUserId(userId: string): Promise<boolean> {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('super_admins')
    .select('id')
    .eq('user_id', userId)
    .is('revoked_at', null)
    .single()
  
  return !!data
}
```

---

### P0.6 - Cooldown para Operações Críticas

**Problema:** Sem cooldown entre operações destrutivas  
**Impacto:** Possível abuso/erro em massa  
**Solução:**
```typescript
// src/lib/superadmin/cooldown.ts
const COOLDOWN_MS = 5000 // 5 segundos

const lastActions = new Map<string, number>()

export function checkCooldown(userId: string, action: string): boolean {
  const key = `${userId}:${action}`
  const lastTime = lastActions.get(key) || 0
  const now = Date.now()
  
  if (now - lastTime < COOLDOWN_MS) {
    return false // Em cooldown
  }
  
  lastActions.set(key, now)
  return true // OK para executar
}
```

---

### P0.7 - Rate Limiting para API Routes

**Problema:** Sem rate limiting em endpoints críticos  
**Impacto:** Abuso de APIs internas  
**Solução:**
```typescript
// src/lib/rate-limit.ts (já existe, aplicar em mais endpoints)
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  // Rate limit: 10 requests por minuto
  const limiter = rateLimit({
    interval: 60 * 1000,
    uniqueTokenPerInterval: 500
  })
  
  try {
    await limiter.check(10, 'ADMIN_ACTION')
  } catch {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }
  
  // ... resto do código
}
```

---

### P0.8 - Validação de Permissões Granulares

**Problema:** Modelo "tudo ou nada" (isSuperAdmin)  
**Impacto:** Sem controle fino de permissões  
**Solução:**
```sql
CREATE TABLE admin_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission VARCHAR(100) NOT NULL, -- 'delete_tenant', 'delete_store', etc
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP NOT NULL DEFAULT now(),
  revoked_at TIMESTAMP,
  UNIQUE(user_id, permission)
);

CREATE INDEX idx_admin_perms_user ON admin_permissions(user_id) WHERE revoked_at IS NULL;
```

```typescript
export async function hasPermission(userId: string, permission: string): Promise<boolean> {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('admin_permissions')
    .select('id')
    .eq('user_id', userId)
    .eq('permission', permission)
    .is('revoked_at', null)
    .single()
  
  return !!data
}
```

---

### P0.9 - Soft Delete para Tenants/Stores

**Problema:** DELETE permanente sem possibilidade de recuperação  
**Impacto:** Perda irreversível de dados  
**Solução:**
```sql
-- Adicionar colunas de soft delete
ALTER TABLE tenants ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE tenants ADD COLUMN deleted_by UUID REFERENCES auth.users(id);
ALTER TABLE tenants ADD COLUMN deleted_reason TEXT;

ALTER TABLE stores ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE stores ADD COLUMN deleted_by UUID REFERENCES auth.users(id);
ALTER TABLE stores ADD COLUMN deleted_reason TEXT;

-- Índices
CREATE INDEX idx_tenants_deleted ON tenants(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_stores_deleted ON stores(deleted_at) WHERE deleted_at IS NOT NULL;
```

```typescript
export async function softDeleteTenant(id: string, reason?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { error } = await supabase
    .from('tenants')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: user!.id,
      deleted_reason: reason
    })
    .eq('id', id)
  
  if (!error) {
    await logAdminAction({
      action: 'soft_delete_tenant',
      targetType: 'tenant',
      targetId: id,
      metadata: { reason }
    })
  }
  
  return { success: !error, error: error?.message }
}
```

---

### P0.10 - Proteção de Produção em `/api/health/fix`

**Problema:** Endpoint executa UPDATEs em massa sem proteção  
**Impacto:** Alterações não intencionais em produção  
**Solução:**
```typescript
// src/app/api/health/fix/route.ts
import { blockInProduction, requireInternalAuth } from '@/lib/security/internal-auth'

export async function POST(request: Request) {
  // CRITICAL: Bloquear em produção
  try {
    blockInProduction()
    requireInternalAuth(request)
  } catch (error) {
    if (error instanceof Response) return error
    throw error
  }
  
  // Audit log
  await logAdminAction({
    action: 'execute_health_fixes',
    targetType: 'system',
    targetId: 'health-fix',
    metadata: { timestamp: new Date().toISOString() }
  })
  
  // ... resto do código
}
```

---

## 📋 8. CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1 - Segurança Crítica (P0)

- [ ] **P0.1** - Auth check em `modules/admin/tenants/actions.ts`
- [ ] **P0.2** - Criar tabela `admin_audit_logs` e função helper
- [ ] **P0.3** - Confirmação forte (digitação do nome) para DELETE
- [ ] **P0.4** - Bloquear `/api/internal/e2e/seed` em produção
- [ ] **P0.5** - Criar tabela `super_admins` e migrar auth
- [ ] **P0.6** - Implementar cooldown para operações críticas
- [ ] **P0.7** - Rate limiting em todos os endpoints admin
- [ ] **P0.8** - Criar tabela `admin_permissions` e sistema granular
- [ ] **P0.9** - Soft delete para `tenants` e `stores`
- [ ] **P0.10** - Bloquear `/api/health/fix` em produção

### Fase 2 - Melhorias (P1)

- [ ] Adicionar audit log em TODAS as Server Actions
- [ ] UI para visualizar audit logs (`/admin/audit`)
- [ ] UI para gerenciar permissões (`/admin/permissions`)
- [ ] Notificação por email para ações críticas
- [ ] Backup automático antes de DELETE
- [ ] Restauração de soft deletes
- [ ] Dashboard de atividade de admins
- [ ] Alertas de ações suspeitas

### Fase 3 - Observabilidade (P2)

- [ ] Métricas de uso do painel admin
- [ ] Logs de performance
- [ ] Alertas de falhas
- [ ] Dashboard de saúde do sistema

---

## 🎯 9. PRÓXIMOS PASSOS

1. ✅ **ETAPA 4A concluída** - Inventário completo gerado
2. ⏳ **ETAPA 4B** - Implementar patches P0.1 a P0.10
3. ⏳ **ETAPA 4C** - Testes E2E de segurança SuperAdmin
4. ⏳ **ETAPA 4D** - Documentação de permissões

---

## 📊 10. ESTATÍSTICAS FINAIS

| Métrica | Valor |
|---------|-------|
| **Rotas UI mapeadas** | 18 |
| **Server Actions mapeadas** | 12 |
| **API Routes mapeadas** | 13 |
| **Operações destrutivas** | 10 |
| **Tabelas com CASCADE** | 30+ |
| **Vulnerabilidades P0** | 10 |
| **Auth checks faltando** | 8 |
| **Audit logs faltando** | 100% |
| **Confirmações fortes** | 0 |
| **Soft deletes** | 0 |

---

**FIM DO INVENTÁRIO - ETAPA 4A CONCLUÍDA** ✅

**Próximo:** Implementar patches P0.1 a P0.10 (ETAPA 4B)
