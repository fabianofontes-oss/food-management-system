# SuperAdmin Security Findings
**Auditoria de Autorização, Operações Destrutivas e Guard Rails**  
**Data:** 2024-12-19  
**Commit:** d410642

---

## 🎯 Objetivo

Auditar a segurança do painel SuperAdmin, focando em:
1. **Autorização real** no servidor (não apenas client/middleware)
2. **Operações destrutivas** e guard rails necessários
3. **CSRF e side effects** em endpoints GET
4. **Audit log** para rastreabilidade

---

## 📊 Resumo Executivo

### Status Geral: 🟡 **MÉDIO RISCO**

| Categoria | Status | Observação |
|-----------|--------|------------|
| **Autorização** | 🟡 Parcial | Baseada em email (env var), não em tabela |
| **Guard Rails** | 🔴 Ausentes | Sem confirmação forte, cooldown ou soft delete |
| **Audit Log** | 🔴 Inexistente | Nenhum registro de ações destrutivas |
| **CSRF Protection** | 🟢 Adequado | Cron jobs protegidos por secret |
| **REST Compliance** | 🟡 Parcial | 2 endpoints GET com side effects |

---

## 🔐 VULN-SA-001: Autorização Baseada em Email (Não Escalável)

**Severidade:** 🟡 **MÉDIA**

### Evidência

**Arquivo:** `src/lib/auth/super-admin.ts:15-36`

```typescript
const HARDCODED_SUPER_ADMINS = [
  'admin@sistema.com',
  'fabiano@exemplo.com',
  'fabianofontes@me.com',
]

function getSuperAdminEmails(): string[] {
  const envEmails = process.env.SUPER_ADMIN_EMAILS

  if (envEmails) {
    return envEmails
      .split(',')
      .map(email => email.trim().toLowerCase())
      .filter(email => email.length > 0)
  }

  return HARDCODED_SUPER_ADMINS.map(email => email.toLowerCase())
}
```

**Arquivo:** `src/lib/auth/super-admin.ts:44-51`

```typescript
export function isSuperAdmin(email: string | null | undefined): boolean {
  if (!email) return false

  const normalizedEmail = email.trim().toLowerCase()
  const superAdminEmails = getSuperAdminEmails()

  return superAdminEmails.includes(normalizedEmail)
}
```

### Problemas

1. **Não escalável** - Adicionar/remover admins requer redeploy
2. **Sem granularidade** - Todos os admins têm os mesmos poderes
3. **Sem auditoria** - Não registra quem fez o quê
4. **Hardcoded emails** - Vazamento de informação no código
5. **Sem revogação** - Não dá para desabilitar um admin sem redeploy

### Impacto

- Dificuldade de gerenciar múltiplos admins
- Impossível revogar acesso rapidamente
- Sem rastreabilidade de ações

### Patch Recomendado

#### 1. Criar Tabela `super_admins`

```sql
-- Migration: create_super_admins_table.sql
CREATE TABLE super_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'admin', -- 'admin', 'owner', 'auditor'
  permissions JSONB DEFAULT '[]'::jsonb, -- ['delete_tenant', 'suspend_tenant', etc]
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES super_admins(id),
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES super_admins(id),
  revoked_reason TEXT,
  last_login_at TIMESTAMPTZ,
  CONSTRAINT valid_role CHECK (role IN ('admin', 'owner', 'auditor'))
);

-- Índices
CREATE INDEX idx_super_admins_user_id ON super_admins(user_id);
CREATE INDEX idx_super_admins_email ON super_admins(email);
CREATE INDEX idx_super_admins_active ON super_admins(is_active) WHERE is_active = true;

-- RLS
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;

-- Policy: Apenas super admins ativos podem ver a tabela
CREATE POLICY "super_admins_select_self" ON super_admins
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() AND is_active = true
  );

-- Seed: Migrar emails existentes
INSERT INTO super_admins (user_id, email, role, is_active)
SELECT 
  id, 
  email, 
  'owner', 
  true
FROM auth.users
WHERE email IN ('admin@sistema.com', 'fabiano@exemplo.com', 'fabianofontes@me.com')
ON CONFLICT (email) DO NOTHING;
```

#### 2. Refatorar `isSuperAdmin` para Usar Tabela

```typescript
// src/lib/auth/super-admin.ts (REFATORADO)
import { createClient } from '@/lib/supabase/server'

/**
 * Verifica se um usuário é Super Admin (versão com banco de dados)
 * @param userId - ID do usuário no auth.users
 * @returns true se o usuário é super admin ativo
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('super_admins')
      .select('id, is_active')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      return false
    }

    // Atualizar last_login_at (async, não bloqueia)
    supabase
      .from('super_admins')
      .update({ last_login_at: new Date().toISOString() })
      .eq('user_id', userId)
      .then(() => {})

    return true
  } catch (error) {
    console.error('Erro ao verificar Super Admin:', error)
    return false
  }
}

/**
 * Verifica se um usuário tem permissão específica
 * @param userId - ID do usuário
 * @param permission - Nome da permissão (ex: 'delete_tenant')
 * @returns true se tem a permissão
 */
export async function hasSuperAdminPermission(
  userId: string,
  permission: string
): Promise<boolean> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('super_admins')
      .select('permissions, role')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      return false
    }

    // Role 'owner' tem todas as permissões
    if (data.role === 'owner') {
      return true
    }

    // Verificar permissões específicas
    const permissions = data.permissions as string[]
    return permissions.includes(permission)
  } catch (error) {
    console.error('Erro ao verificar permissão:', error)
    return false
  }
}

/**
 * FALLBACK: Verifica por email (para migração gradual)
 * @deprecated Use isSuperAdmin(userId) com tabela
 */
export function isSuperAdminByEmail(email: string | null | undefined): boolean {
  if (!email) return false
  
  const envEmails = process.env.SUPER_ADMIN_EMAILS
  if (!envEmails) return false
  
  const normalizedEmail = email.trim().toLowerCase()
  const superAdminEmails = envEmails
    .split(',')
    .map(e => e.trim().toLowerCase())
  
  return superAdminEmails.includes(normalizedEmail)
}
```

#### 3. Atualizar Server Actions

```typescript
// src/lib/superadmin/actions.ts (EXEMPLO)
export async function deleteStoreAction(
  storeId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Verificar autenticação
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser) {
    return { success: false, error: 'Usuário não autenticado' }
  }

  // Verificar se é Super Admin (nova versão)
  const isAdmin = await isSuperAdmin(currentUser.id)
  if (!isAdmin) {
    return { success: false, error: 'Acesso não autorizado - apenas Super Admins' }
  }

  // Verificar permissão específica
  const hasPermission = await hasSuperAdminPermission(currentUser.id, 'delete_store')
  if (!hasPermission) {
    return { success: false, error: 'Sem permissão para deletar lojas' }
  }

  // ... resto da lógica
}
```

---

## 🔴 VULN-SA-002: Operações Destrutivas sem Guard Rails

**Severidade:** 🔴 **CRÍTICA**

### Operações Identificadas

#### 1. `deleteTenantAction` - Deleta Tenant Inteiro

**Arquivo:** `src/lib/superadmin/actions.ts:185-203`

```typescript
export async function deleteTenantAction(
  tenantId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Verificar se o usuário atual é Super Admin
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser || !isSuperAdmin(currentUser.email)) {
    return { success: false, error: 'Acesso não autorizado - apenas Super Admins' }
  }

  try {
    // O banco tem ON DELETE CASCADE, então excluir o tenant exclui todas as lojas
    const { error } = await supabase
      .from('tenants')
      .delete()
      .eq('id', tenantId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/tenants')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
```

**Problemas:**
- ❌ Sem confirmação forte (apenas browser `confirm()`)
- ❌ Sem cooldown period
- ❌ Sem soft delete
- ❌ Sem backup antes de deletar
- ❌ Sem audit log
- ❌ Cascata deleta TUDO (stores, orders, products, customers, etc)

**Impacto:**
- Perda irreversível de dados
- Impossível recuperar após delete acidental
- Sem rastreabilidade de quem deletou

#### 2. `deleteStoreAction` - Deleta Loja Inteira

**Arquivo:** `src/lib/superadmin/actions.ts:149-177`

```typescript
export async function deleteStoreAction(
  storeId: string
): Promise<{ success: boolean; error?: string }> {
  // ... auth check ...

  try {
    // O banco tem ON DELETE CASCADE, então excluir a loja exclui tudo relacionado
    const { error } = await supabase
      .from('stores')
      .delete()
      .eq('id', storeId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/stores')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
```

**Mesmos problemas** do deleteTenantAction.

#### 3. Client-Side Confirmation (Inadequado)

**Arquivo:** `src/app/(super-admin)/admin/stores/page.tsx:157-159`

```typescript
async function handleDelete(id: string, name: string) {
  if (!confirm(`Tem certeza que deseja excluir a loja "${name}"? Esta ação não pode ser desfeita.`)) return

  try {
    await deleteStoreAction(id)
    toast.success('Loja excluída com sucesso')
    await loadData()
  } catch (error: any) {
    toast.error(error.message || 'Erro ao excluir loja')
  }
}
```

**Problemas:**
- ⚠️ `confirm()` é facilmente bypassado (console, automation)
- ⚠️ Não valida que o usuário realmente leu a mensagem
- ⚠️ Sem confirmação dupla

### Patch Recomendado

#### 1. Implementar Soft Delete

```sql
-- Migration: add_soft_delete_columns.sql

-- Adicionar colunas de soft delete
ALTER TABLE tenants ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE tenants ADD COLUMN deleted_by UUID REFERENCES super_admins(id);
ALTER TABLE tenants ADD COLUMN deleted_reason TEXT;

ALTER TABLE stores ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE stores ADD COLUMN deleted_by UUID REFERENCES super_admins(id);
ALTER TABLE stores ADD COLUMN deleted_reason TEXT;

-- Índices para performance
CREATE INDEX idx_tenants_deleted_at ON tenants(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_stores_deleted_at ON stores(deleted_at) WHERE deleted_at IS NOT NULL;

-- View para dados ativos (sem soft deleted)
CREATE VIEW active_tenants AS
SELECT * FROM tenants WHERE deleted_at IS NULL;

CREATE VIEW active_stores AS
SELECT * FROM stores WHERE deleted_at IS NULL;
```

#### 2. Refatorar Actions com Guard Rails

```typescript
// src/lib/superadmin/actions.ts (REFATORADO)

/**
 * Soft delete de tenant com guard rails
 */
export async function deleteTenantAction(
  tenantId: string,
  confirmation: {
    tenantName: string,      // Usuário deve digitar o nome
    reason: string,           // Motivo obrigatório
    understands: boolean      // Checkbox "Entendo que isso não pode ser desfeito"
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // 1. Verificar autenticação
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser) {
    return { success: false, error: 'Usuário não autenticado' }
  }

  // 2. Verificar se é Super Admin
  const isAdmin = await isSuperAdmin(currentUser.id)
  if (!isAdmin) {
    return { success: false, error: 'Acesso não autorizado' }
  }

  // 3. Verificar permissão específica
  const hasPermission = await hasSuperAdminPermission(currentUser.id, 'delete_tenant')
  if (!hasPermission) {
    return { success: false, error: 'Sem permissão para deletar tenants' }
  }

  try {
    // 4. Buscar tenant para validar nome
    const { data: tenant, error: fetchError } = await supabase
      .from('tenants')
      .select('id, name')
      .eq('id', tenantId)
      .single()

    if (fetchError || !tenant) {
      return { success: false, error: 'Tenant não encontrado' }
    }

    // 5. GUARD RAIL: Validar que o nome digitado está correto
    if (confirmation.tenantName.trim().toLowerCase() !== tenant.name.trim().toLowerCase()) {
      return { success: false, error: 'Nome do tenant não corresponde. Digite exatamente o nome para confirmar.' }
    }

    // 6. GUARD RAIL: Validar que o usuário entendeu
    if (!confirmation.understands) {
      return { success: false, error: 'Você deve confirmar que entende a ação' }
    }

    // 7. GUARD RAIL: Validar motivo
    if (!confirmation.reason || confirmation.reason.trim().length < 10) {
      return { success: false, error: 'Motivo deve ter pelo menos 10 caracteres' }
    }

    // 8. SOFT DELETE (não hard delete)
    const { error: deleteError } = await supabase
      .from('tenants')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: currentUser.id,
        deleted_reason: confirmation.reason,
        status: 'deleted' // Marca como deletado
      })
      .eq('id', tenantId)

    if (deleteError) {
      return { success: false, error: deleteError.message }
    }

    // 9. AUDIT LOG
    await logAdminAction({
      action: 'delete_tenant',
      target_type: 'tenant',
      target_id: tenantId,
      target_name: tenant.name,
      admin_id: currentUser.id,
      admin_email: currentUser.email!,
      reason: confirmation.reason,
      metadata: {
        confirmation_name: confirmation.tenantName,
        ip_address: await getClientIP(), // Implementar
        user_agent: await getUserAgent()  // Implementar
      }
    })

    revalidatePath('/admin/tenants')
    return { success: true }
  } catch (error: any) {
    console.error('Erro ao deletar tenant:', error)
    return { success: false, error: error.message }
  }
}

/**
 * HARD DELETE permanente (apenas para owner, com cooldown)
 */
export async function permanentlyDeleteTenantAction(
  tenantId: string,
  confirmation: {
    tenantName: string,
    reason: string,
    twoPersonApproval?: string // Token de aprovação de outro admin
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser) {
    return { success: false, error: 'Não autenticado' }
  }

  // 1. Apenas role 'owner' pode fazer hard delete
  const { data: adminData } = await supabase
    .from('super_admins')
    .select('role')
    .eq('user_id', currentUser.id)
    .single()

  if (adminData?.role !== 'owner') {
    return { success: false, error: 'Apenas owners podem fazer delete permanente' }
  }

  // 2. GUARD RAIL: Verificar que já foi soft deleted há pelo menos 7 dias
  const { data: tenant } = await supabase
    .from('tenants')
    .select('deleted_at, name')
    .eq('id', tenantId)
    .single()

  if (!tenant?.deleted_at) {
    return { success: false, error: 'Tenant deve ser soft deleted primeiro (cooldown de 7 dias)' }
  }

  const deletedDate = new Date(tenant.deleted_at)
  const cooldownEnd = new Date(deletedDate.getTime() + 7 * 24 * 60 * 60 * 1000)
  
  if (new Date() < cooldownEnd) {
    const daysRemaining = Math.ceil((cooldownEnd.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    return { 
      success: false, 
      error: `Cooldown ativo. Aguarde ${daysRemaining} dias para delete permanente.` 
    }
  }

  // 3. GUARD RAIL: Two-person rule (opcional, mas recomendado)
  if (process.env.REQUIRE_TWO_PERSON_RULE === 'true') {
    if (!confirmation.twoPersonApproval) {
      return { success: false, error: 'Aprovação de segundo admin necessária' }
    }

    // Validar token de aprovação (implementar sistema de tokens)
    const isValidApproval = await validateTwoPersonApproval(
      confirmation.twoPersonApproval,
      'delete_tenant',
      tenantId
    )

    if (!isValidApproval) {
      return { success: false, error: 'Token de aprovação inválido ou expirado' }
    }
  }

  // 4. Validar nome
  if (confirmation.tenantName.trim().toLowerCase() !== tenant.name.trim().toLowerCase()) {
    return { success: false, error: 'Nome não corresponde' }
  }

  // 5. HARD DELETE (irreversível)
  const { error } = await supabase
    .from('tenants')
    .delete()
    .eq('id', tenantId)

  if (error) {
    return { success: false, error: error.message }
  }

  // 6. AUDIT LOG
  await logAdminAction({
    action: 'permanent_delete_tenant',
    target_type: 'tenant',
    target_id: tenantId,
    target_name: tenant.name,
    admin_id: currentUser.id,
    admin_email: currentUser.email!,
    reason: confirmation.reason,
    severity: 'critical',
    metadata: {
      cooldown_days: 7,
      two_person_approval: !!confirmation.twoPersonApproval
    }
  })

  revalidatePath('/admin/tenants')
  return { success: true }
}
```

#### 3. Componente de Confirmação Forte (Client)

```typescript
// src/components/admin/DeleteConfirmationModal.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'

interface DeleteConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (confirmation: {
    tenantName: string
    reason: string
    understands: boolean
  }) => Promise<void>
  targetName: string
  targetType: 'tenant' | 'store'
  impactWarning: string
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  targetName,
  targetType,
  impactWarning
}: DeleteConfirmationModalProps) {
  const [nameInput, setNameInput] = useState('')
  const [reason, setReason] = useState('')
  const [understands, setUnderstands] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const isValid = 
    nameInput.trim().toLowerCase() === targetName.trim().toLowerCase() &&
    reason.trim().length >= 10 &&
    understands

  async function handleConfirm() {
    if (!isValid) return

    setIsDeleting(true)
    try {
      await onConfirm({
        tenantName: nameInput,
        reason,
        understands
      })
      onClose()
    } catch (error) {
      // Error handling
    } finally {
      setIsDeleting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold text-red-600 mb-4">
          ⚠️ Confirmar Exclusão de {targetType === 'tenant' ? 'Tenant' : 'Loja'}
        </h2>

        <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
          <p className="text-sm text-red-800 font-medium mb-2">
            ATENÇÃO: Esta ação irá:
          </p>
          <p className="text-sm text-red-700">{impactWarning}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Digite o nome exato para confirmar: <strong>{targetName}</strong>
            </label>
            <Input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder={targetName}
              className={nameInput && nameInput !== targetName ? 'border-red-500' : ''}
            />
            {nameInput && nameInput.trim().toLowerCase() !== targetName.trim().toLowerCase() && (
              <p className="text-xs text-red-600 mt-1">Nome não corresponde</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Motivo da exclusão (mínimo 10 caracteres)
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Cliente solicitou cancelamento via ticket #123"
              rows={3}
              className={reason && reason.length < 10 ? 'border-red-500' : ''}
            />
            <p className="text-xs text-gray-500 mt-1">
              {reason.length}/10 caracteres
            </p>
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              checked={understands}
              onCheckedChange={(checked) => setUnderstands(checked as boolean)}
              id="understands"
            />
            <label htmlFor="understands" className="text-sm">
              Eu entendo que esta ação não pode ser desfeita e todos os dados relacionados serão perdidos permanentemente.
            </label>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isValid || isDeleting}
            className="flex-1"
          >
            {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
          </Button>
        </div>
      </div>
    </div>
  )
}
```

---

## 🔴 VULN-SA-003: Ausência de Audit Log

**Severidade:** 🔴 **CRÍTICA**

### Problema

**Nenhuma ação administrativa é registrada:**
- Não sabemos quem deletou um tenant
- Não sabemos quando foi deletado
- Não sabemos o motivo
- Impossível investigar incidentes
- Sem compliance (LGPD, SOC2, ISO 27001)

### Evidência

Nenhum arquivo de audit log encontrado no código.

### Patch Recomendado

#### 1. Criar Tabela `admin_audit_log`

```sql
-- Migration: create_admin_audit_log.sql

CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Quem fez a ação
  admin_id UUID NOT NULL REFERENCES super_admins(id),
  admin_email TEXT NOT NULL,
  
  -- O que foi feito
  action TEXT NOT NULL, -- 'delete_tenant', 'suspend_tenant', 'update_plan', etc
  severity TEXT NOT NULL DEFAULT 'info', -- 'info', 'warning', 'critical'
  
  -- Onde foi feito
  target_type TEXT NOT NULL, -- 'tenant', 'store', 'user', 'plan', etc
  target_id UUID,
  target_name TEXT,
  
  -- Por que foi feito
  reason TEXT,
  
  -- Detalhes adicionais
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Contexto da requisição
  ip_address INET,
  user_agent TEXT,
  request_id TEXT,
  
  -- Resultado
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_action CHECK (action ~ '^[a-z_]+$'),
  CONSTRAINT valid_severity CHECK (severity IN ('info', 'warning', 'critical')),
  CONSTRAINT valid_target_type CHECK (target_type ~ '^[a-z_]+$')
);

-- Índices para performance
CREATE INDEX idx_admin_audit_log_admin_id ON admin_audit_log(admin_id);
CREATE INDEX idx_admin_audit_log_action ON admin_audit_log(action);
CREATE INDEX idx_admin_audit_log_target ON admin_audit_log(target_type, target_id);
CREATE INDEX idx_admin_audit_log_created_at ON admin_audit_log(created_at DESC);
CREATE INDEX idx_admin_audit_log_severity ON admin_audit_log(severity) WHERE severity IN ('warning', 'critical');

-- RLS: Apenas super admins podem ler
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_audit_log_select" ON admin_audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE super_admins.user_id = auth.uid()
        AND super_admins.is_active = true
    )
  );

-- Ninguém pode UPDATE ou DELETE (append-only log)
CREATE POLICY "admin_audit_log_no_update" ON admin_audit_log
  FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY "admin_audit_log_no_delete" ON admin_audit_log
  FOR DELETE
  TO authenticated
  USING (false);

-- Apenas sistema pode INSERT (via função SECURITY DEFINER)
CREATE POLICY "admin_audit_log_no_direct_insert" ON admin_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (false);
```

#### 2. Função para Registrar Ações

```typescript
// src/lib/audit/admin-audit-log.ts
import 'server-only'

import { createClient } from '@/lib/supabase/server'

export interface AdminAuditLogEntry {
  action: string
  target_type: string
  target_id?: string
  target_name?: string
  admin_id: string
  admin_email: string
  reason?: string
  severity?: 'info' | 'warning' | 'critical'
  metadata?: Record<string, any>
  ip_address?: string
  user_agent?: string
  request_id?: string
  success?: boolean
  error_message?: string
}

/**
 * Registra uma ação administrativa no audit log
 * IMPORTANTE: Esta função NUNCA deve falhar (não bloqueia a operação principal)
 */
export async function logAdminAction(entry: AdminAuditLogEntry): Promise<void> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('admin_audit_log')
      .insert({
        action: entry.action,
        target_type: entry.target_type,
        target_id: entry.target_id,
        target_name: entry.target_name,
        admin_id: entry.admin_id,
        admin_email: entry.admin_email,
        reason: entry.reason,
        severity: entry.severity || 'info',
        metadata: entry.metadata || {},
        ip_address: entry.ip_address,
        user_agent: entry.user_agent,
        request_id: entry.request_id,
        success: entry.success !== false,
        error_message: entry.error_message
      })

    if (error) {
      // Log erro mas não falha a operação
      console.error('❌ Falha ao registrar audit log:', error)
      
      // Enviar para sistema de monitoramento (Sentry, etc)
      // captureException(error, { extra: entry })
    }
  } catch (error) {
    // Nunca deixar o audit log quebrar a operação principal
    console.error('❌ Exceção ao registrar audit log:', error)
  }
}

/**
 * Busca logs de auditoria com filtros
 */
export async function getAuditLogs(filters: {
  adminId?: string
  action?: string
  targetType?: string
  targetId?: string
  severity?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}) {
  const supabase = await createClient()

  let query = supabase
    .from('admin_audit_log')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (filters.adminId) {
    query = query.eq('admin_id', filters.adminId)
  }

  if (filters.action) {
    query = query.eq('action', filters.action)
  }

  if (filters.targetType) {
    query = query.eq('target_type', filters.targetType)
  }

  if (filters.targetId) {
    query = query.eq('target_id', filters.targetId)
  }

  if (filters.severity) {
    query = query.eq('severity', filters.severity)
  }

  if (filters.startDate) {
    query = query.gte('created_at', filters.startDate.toISOString())
  }

  if (filters.endDate) {
    query = query.lte('created_at', filters.endDate.toISOString())
  }

  const limit = filters.limit || 50
  const offset = filters.offset || 0

  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    throw error
  }

  return {
    logs: data || [],
    total: count || 0,
    limit,
    offset
  }
}
```

#### 3. Integrar em Todas as Actions

```typescript
// Exemplo: src/lib/superadmin/actions.ts
export async function deleteStoreAction(storeId: string, confirmation: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // ... validações ...

  try {
    // Buscar dados antes de deletar (para audit log)
    const { data: store } = await supabase
      .from('stores')
      .select('name, tenant_id')
      .eq('id', storeId)
      .single()

    // Executar delete
    const { error } = await supabase
      .from('stores')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', storeId)

    if (error) {
      // Log de falha
      await logAdminAction({
        action: 'delete_store',
        target_type: 'store',
        target_id: storeId,
        target_name: store?.name,
        admin_id: user!.id,
        admin_email: user!.email!,
        reason: confirmation.reason,
        severity: 'critical',
        success: false,
        error_message: error.message
      })

      return { success: false, error: error.message }
    }

    // Log de sucesso
    await logAdminAction({
      action: 'delete_store',
      target_type: 'store',
      target_id: storeId,
      target_name: store?.name,
      admin_id: user!.id,
      admin_email: user!.email!,
      reason: confirmation.reason,
      severity: 'critical',
      success: true,
      metadata: {
        tenant_id: store?.tenant_id,
        confirmation_name: confirmation.tenantName
      }
    })

    return { success: true }
  } catch (error: any) {
    // Log de exceção
    await logAdminAction({
      action: 'delete_store',
      target_type: 'store',
      target_id: storeId,
      admin_id: user!.id,
      admin_email: user!.email!,
      severity: 'critical',
      success: false,
      error_message: error.message
    })

    return { success: false, error: error.message }
  }
}
```

---

## 🟡 VULN-SA-004: GET com Side Effects (REST Violation)

**Severidade:** 🟡 **MÉDIA**

### Evidência

**Arquivo:** `src/app/api/cron/billing/route.ts:18`

```typescript
export async function GET(request: NextRequest) {
  // Verificar autenticação do cron
  const authHeader = request.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // ... código que faz UPDATE em invoices e tenants ...
    
    // 1. Marcar faturas vencidas como 'overdue'
    const { data: overdueData } = await supabase
      .from('invoices')
      .update({ status: 'overdue', updated_at: new Date().toISOString() })
      .eq('status', 'pending')
      .lt('due_date', new Date().toISOString().slice(0, 10))
      .select()

    // ... mais UPDATEs ...
  }
}
```

**Arquivo:** `src/app/api/cron/clean-expired-drafts/route.ts:15`

```typescript
export async function GET(req: NextRequest) {
  // ... auth check ...

  // Deletar drafts expirados
  const { data, error } = await supabaseAdmin
    .from('draft_stores')
    .delete()
    .lt('expires_at', new Date().toISOString())
    .select('slug');
}
```

### Problema

- **Violação de REST** - GET não deve ter side effects
- **Não idempotente** - Múltiplas chamadas podem causar problemas
- **Cache issues** - Browsers/proxies podem cachear GET
- **Logs confusos** - GET geralmente não é logado como mutação

### Impacto

- 🟡 Baixo (protegido por CRON_SECRET)
- Mas viola princípios HTTP e pode causar confusão

### Patch Recomendado

```typescript
// src/app/api/cron/billing/route.ts (REFATORADO)

// Manter GET apenas para health check
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    service: 'billing-cron',
    message: 'Use POST para executar o cron job'
  })
}

// Mover lógica para POST
export async function POST(request: NextRequest) {
  // Verificar autenticação do cron
  const authHeader = request.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // ... lógica de billing ...
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

**Atualizar Vercel Cron Config:**

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/billing",
      "schedule": "0 0 * * *",
      "method": "POST"
    },
    {
      "path": "/api/cron/clean-expired-drafts",
      "schedule": "0 */6 * * *",
      "method": "POST"
    }
  ]
}
```

---

## 📋 Checklist de Implementação

### 🔴 URGENTE (Implementar Imediatamente)

- [ ] Criar tabela `super_admins`
- [ ] Criar tabela `admin_audit_log`
- [ ] Migrar autorização de email para tabela
- [ ] Implementar soft delete em `tenants` e `stores`
- [ ] Adicionar audit log em todas as operações destrutivas
- [ ] Implementar confirmação forte (digitar nome)
- [ ] Adicionar campo `reason` obrigatório em deletes

### 🟡 IMPORTANTE (Implementar em 1 semana)

- [ ] Implementar cooldown period (7 dias) para hard delete
- [ ] Adicionar permissões granulares (roles)
- [ ] Implementar two-person rule (opcional)
- [ ] Criar página de audit log no admin
- [ ] Adicionar filtros e busca no audit log
- [ ] Implementar step-up authentication para ações críticas
- [ ] Mudar cron jobs de GET para POST

### 🟢 MELHORIAS (Implementar em 1 mês)

- [ ] Implementar backup automático antes de delete
- [ ] Adicionar export de dados antes de delete
- [ ] Criar sistema de aprovação de dois admins
- [ ] Implementar rate limiting em operações destrutivas
- [ ] Adicionar alertas (email/Slack) para ações críticas
- [ ] Criar dashboard de auditoria com gráficos
- [ ] Implementar retention policy para audit log
- [ ] Adicionar IP whitelisting para super admins

---

## 🎯 Resumo de Vulnerabilidades

| ID | Vulnerabilidade | Severidade | Status | Patch |
|----|-----------------|------------|--------|-------|
| VULN-SA-001 | Autorização baseada em email | 🟡 MÉDIA | Identificada | Migrar para tabela `super_admins` |
| VULN-SA-002 | Operações destrutivas sem guard rails | 🔴 CRÍTICA | Identificada | Soft delete + confirmação forte + cooldown |
| VULN-SA-003 | Ausência de audit log | 🔴 CRÍTICA | Identificada | Criar `admin_audit_log` + integrar em actions |
| VULN-SA-004 | GET com side effects | 🟡 MÉDIA | Identificada | Mudar para POST |

---

## 📊 Impacto Estimado

### Antes dos Patches:
- ⚠️ Delete acidental pode destruir tenant inteiro
- ⚠️ Impossível rastrear quem fez o quê
- ⚠️ Sem possibilidade de recuperação
- ⚠️ Não compliance com regulações

### Depois dos Patches:
- ✅ Soft delete com cooldown de 7 dias
- ✅ Confirmação forte (digitar nome + motivo)
- ✅ Audit log completo de todas as ações
- ✅ Possibilidade de recuperação dentro do período
- ✅ Compliance com LGPD/SOC2/ISO 27001
- ✅ Rastreabilidade total

---

**FIM DO RELATÓRIO DE SUPERADMIN**
