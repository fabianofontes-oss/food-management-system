# ETAPA 4B - CHECKLIST DE VALIDAÇÃO

**Data:** 2024-12-19  
**Objetivo:** Validar que o P0 Hardening foi aplicado corretamente

---

## ⚠️ CRÍTICO: Rotacionar SUPABASE_SERVICE_ROLE_KEY

**ANTES DE COMEÇAR:**

1. Abrir Supabase → Settings → API
2. Clicar em "Reset" na `service_role` key
3. Copiar a nova chave
4. Atualizar no deploy (Vercel/Railway)
5. Atualizar no `.env.local`

**Motivo:** A chave antiga foi exposta nesta sessão.

---

## 1️⃣ Aplicar SQL no Supabase

### Passo a Passo

1. Abrir **Supabase Dashboard** do projeto
2. Ir em **SQL Editor**
3. Colar o conteúdo de: **`supabase/migrations/20241219000001_04b_p0_superadmin_security.sql`**
4. Clicar **Run**

### ✅ Validação Imediata

**Query 1: Verificar se as tabelas foram criadas**

```sql
SELECT
  to_regclass('public.super_admins') as super_admins,
  to_regclass('public.admin_permissions') as admin_permissions,
  to_regclass('public.admin_audit_logs') as admin_audit_logs;
```

**Esperado:** As 3 tabelas devem existir (não `null`)

---

**Query 2: Verificar RLS e Policies**

```sql
SELECT
  n.nspname as schema,
  c.relname as table,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced,
  (SELECT count(*) FROM pg_policies p WHERE p.schemaname=n.nspname AND p.tablename=c.relname) as policy_count
FROM pg_class c
JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public'
  AND c.relkind='r'
  AND c.relname IN ('super_admins','admin_permissions','admin_audit_logs')
ORDER BY 1,2;
```

**Esperado:**
- `rls_enabled` = `true`
- `rls_forced` = `true`
- `policy_count` > 0

---

## 2️⃣ Bootstrap do 1º Super Admin

### Passo a Passo

1. Abrir **Supabase → Authentication → Users**
2. Clicar no seu usuário
3. Copiar o **User UID** (UUID)
4. Ir em **SQL Editor**
5. Colar o conteúdo de: **`audit/04B_RESET_AND_SETUP.sql`** (já tem seu user_id!)
6. Clicar **Run**

**OU** se já executou a migration, use:

```sql
INSERT INTO public.super_admins (user_id, email, notes)
VALUES (
  'e0913bb8-35ff-49db-a3b7-818d6018bba2', -- Fabiano Braga
  'fabianobraga@me.com',
  'bootstrap - Fabiano Braga - primeiro super admin do sistema'
);
```

### ✅ Validação do Bootstrap

```sql
SELECT user_id, email, granted_at, revoked_at
FROM public.super_admins
ORDER BY granted_at DESC;
```

**Esperado:** 1 linha com seu email e `revoked_at` = `null`

---

## 3️⃣ Dar Permissões Granulares (Recomendado)

Se o código exigir `requirePermission()`, execute:

```sql
INSERT INTO public.admin_permissions (user_id, permission)
VALUES
  ('e0913bb8-35ff-49db-a3b7-818d6018bba2','delete_tenant'),
  ('e0913bb8-35ff-49db-a3b7-818d6018bba2','delete_store'),
  ('e0913bb8-35ff-49db-a3b7-818d6018bba2','delete_user'),
  ('e0913bb8-35ff-49db-a3b7-818d6018bba2','change_plan'),
  ('e0913bb8-35ff-49db-a3b7-818d6018bba2','suspend_tenant'),
  ('e0913bb8-35ff-49db-a3b7-818d6018bba2','execute_fixes'),
  ('e0913bb8-35ff-49db-a3b7-818d6018bba2','view_audit_logs')
ON CONFLICT (user_id, permission) DO NOTHING;
```

### ✅ Validação de Permissões

```sql
SELECT * FROM public.admin_permissions
WHERE user_id='e0913bb8-35ff-49db-a3b7-818d6018bba2'
ORDER BY permission;
```

**Esperado:** 7 permissões listadas

---

## 4️⃣ Testes Funcionais

### Teste 1: Usuário Comum (Não Admin)

1. Fazer logout
2. Logar com um usuário comum (não super admin)
3. Tentar acessar `/admin`

**Esperado:** ❌ Bloqueado (redirect/403/404)

---

### Teste 2: Você (Super Admin)

1. Logar com `fabianobraga@me.com`
2. Acessar `/admin/tenants`

**Esperado:** ✅ Lista tenants normalmente

---

### Teste 3: Delete com Confirmação Forte

1. Tentar deletar um tenant/store
2. Verificar se pede para **digitar o nome exato**
3. Executar delete

**Esperado:** ✅ Só deleta após confirmação forte

---

### ✅ Verificar Audit Log

Após qualquer ação (create/update/delete), execute:

```sql
SELECT created_at, admin_email, action, target_type, target_name, metadata
FROM public.admin_audit_logs
ORDER BY created_at DESC
LIMIT 50;
```

**Esperado:** Logs de todas as ações executadas

---

## 5️⃣ Confirmar Bloqueios em Produção (P0.4 e P0.10)

No ambiente **Production** (Vercel/Railway), testar:

### Teste 1: E2E Seed Bloqueado

```bash
curl -X POST https://SEU_DOMINIO/api/internal/e2e/seed
```

**Esperado:** ❌ 403/404 (bloqueado)

---

### Teste 2: Health Fix Bloqueado

```bash
curl -X POST https://SEU_DOMINIO/api/health/fix
```

**Esperado:** ❌ 403/404 (bloqueado)

---

## 6️⃣ GO/NO-GO Final da ETAPA 4B

Execute estas 2 queries e cole os resultados:

### Query 1: Super Admins

```sql
SELECT user_id, email, granted_at, revoked_at, notes
FROM public.super_admins
ORDER BY granted_at DESC;
```

### Query 2: Audit Logs (últimos 10)

```sql
SELECT created_at, admin_email, action, target_type, target_name, metadata
FROM public.admin_audit_logs
ORDER BY created_at DESC
LIMIT 10;
```

---

## ✅ Checklist de Conclusão

- [ ] SQL migration aplicada no Supabase
- [ ] Tabelas criadas com RLS habilitado
- [ ] Super admin bootstrapped (você)
- [ ] Permissões granulares configuradas
- [ ] Teste 1: Usuário comum bloqueado em `/admin`
- [ ] Teste 2: Super admin acessa `/admin/tenants`
- [ ] Teste 3: Delete com confirmação forte funciona
- [ ] Audit logs sendo gerados
- [ ] E2E seed bloqueado em produção
- [ ] Health fix bloqueado em produção
- [ ] `SUPABASE_SERVICE_ROLE_KEY` rotacionada

---

## 🚀 Próximas Etapas (Ordem Recomendada)

1. **ETAPA 5 - Billing Enforcement (P0)**
   - Bloquear "trial infinito"
   - Bloquear `suspended` acessando
   - Enforcement em server actions

2. **ETAPA 6.2/6.4 - Observabilidade/Alertas**
   - Monitorar falhas
   - Auditoria
   - Métricas e logs

---

**ETAPA 4B CONCLUÍDA!** ✅ (após validação)
