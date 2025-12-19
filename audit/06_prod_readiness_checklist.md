# ETAPA 6 - Checklist de Prontidão para Produção

**Data:** 2024-12-19  
**Status:** [EM PROGRESSO / CONCLUÍDO]

---

## 🎯 Objetivo

Validar que o sistema está pronto para produção com segurança, isolamento multi-tenant e funcionalidades core operacionais.

---

## ✅ ETAPA 3 - Supabase Security (CONCLUÍDO)

### RLS/Policies/Grants
- [x] ✅ RLS habilitado em 8 tabelas críticas
- [x] ✅ RLS forçado em 8 tabelas críticas
- [x] ✅ Policies criadas para customers (4)
- [x] ✅ Policies criadas para orders (4)
- [x] ✅ Policies criadas para order_items (1)
- [x] ✅ Policies criadas para users (2)
- [x] ✅ Policies criadas para tenants (2)
- [x] ✅ Policies criadas para invoices (1)
- [x] ✅ Policies criadas para payment_history (1)
- [x] ✅ Policies criadas para tenant_subscriptions (1)
- [x] ✅ Grants excessivos de anon revogados

### Functions SECURITY DEFINER
- [x] ✅ search_path='pg_catalog, public' em 15 functions
- [x] ✅ create_order_atomic hardenizada
- [x] ✅ get_user_stores hardenizada
- [x] ✅ update_cash_session_on_order hardenizada

**Status ETAPA 3:** ✅ **CONCLUÍDO**

---

## 🧪 ETAPA 6.1 - Testes E2E Multi-Tenant (P0)

### Pré-requisitos
- [ ] Ambiente de staging configurado
- [ ] 2 tenants criados (Tenant A, Tenant B)
- [ ] 2 stores criadas (Store A1, Store B1)
- [ ] 2 usuários criados (User A, User B)
- [ ] Dados de teste criados (produtos, customers, orders)

### SUITE A - Leitura Cross-Tenant
- [ ] A1. Listar stores - isolamento OK
- [ ] A2. Consultar customers - isolamento OK
- [ ] A3. Consultar orders - isolamento OK
- [ ] A4. Consultar order_items - isolamento OK
- [ ] A5. Consultar dados financeiros - isolamento OK (CRÍTICO)
- [ ] A6. Testes invertidos (User B → Tenant A) - isolamento OK

### SUITE B - Escrita Cross-Tenant
- [ ] B1. Criar order em outra store - bloqueado
- [ ] B2. Inserir customer em outra store - bloqueado
- [ ] B3. Atualizar customer de outra store - bloqueado
- [ ] B4. Deletar order de outra store - bloqueado

### SUITE C - SECURITY DEFINER Functions
- [ ] C1. get_user_stores() - retorna apenas stores próprias
- [ ] C2. create_order_atomic() - bloqueia store_id de outro tenant
- [ ] C3. user_has_store_access() - retorna false para outras stores
- [ ] C4. user_is_store_owner() - retorna false para outras stores

### SUITE D - Fluxo Normal
- [ ] D1. User A opera Store A1 normalmente - tudo funciona

**Status ETAPA 6.1:** [ ] **PENDENTE**

---

## 🔐 ETAPA 4 - SuperAdmin Hardening (P0)

### Vulnerabilidades Identificadas (ETAPA 2)
- [ ] VULN-SA-001: SuperAdmin hardcoded em env (CRÍTICO)
- [ ] VULN-SA-002: Sem soft delete em operações destrutivas (ALTO)
- [ ] VULN-SA-003: Sem audit log em ações críticas (ALTO)
- [ ] VULN-SA-004: Sem confirmação forte em hard deletes (MÉDIO)

### Correções Recomendadas
- [ ] Criar tabela `super_admins` com roles/permissions
- [ ] Implementar soft delete em stores/tenants
- [ ] Criar tabela `admin_audit_log` append-only
- [ ] Implementar confirmação forte (two-step) para hard deletes
- [ ] Adicionar motivo obrigatório em operações destrutivas

**Status ETAPA 4:** [ ] **PENDENTE**

---

## 💰 ETAPA 5 - Billing Enforcement (P0)

### Vulnerabilidades Identificadas (ETAPA 2)
- [ ] VULN-BILL-001: Trial infinito (sem enforcement) (CRÍTICO)
- [ ] VULN-BILL-002: Suspended ainda acessa dashboard (CRÍTICO)
- [ ] VULN-BILL-003: Sem idempotência em webhooks/cron (ALTO)

### Correções Recomendadas
- [ ] Enforcement no middleware (verificar status do tenant)
- [ ] Enforcement em server actions (bloquear mutações)
- [ ] Criar páginas de status (/billing/trial-expired, /billing/suspended)
- [ ] Implementar idempotência em orders (idempotency_key)
- [ ] Implementar idempotência em webhooks (webhook_events)
- [ ] Implementar locks em cron jobs (cron_locks)

**Status ETAPA 5:** [ ] **PENDENTE**

---

## 📊 ETAPA 6.4 - Observabilidade (P1)

### Logging e Monitoring
- [ ] Log de request_id em todas as requisições
- [ ] Log de tenant_id/store_id quando aplicável
- [ ] Alertas para eventos críticos (suspensão, delete)
- [ ] Alertas para falhas de autenticação
- [ ] Rate limiting em endpoints internos
- [ ] Rate limiting em flows de onboarding

### Métricas de Segurança
- [ ] Dashboard de acessos por tenant
- [ ] Dashboard de operações críticas (deletes, suspensões)
- [ ] Dashboard de falhas de autenticação
- [ ] Dashboard de tentativas de acesso cross-tenant

**Status ETAPA 6.4:** [ ] **PENDENTE**

---

## 🚀 Decisão GO/NO-GO para Produção

### Bloqueadores (DEVE estar 100% antes de produção)

#### ETAPA 3 - Supabase Security
- [x] ✅ RLS habilitado e forçado em tabelas críticas
- [x] ✅ Policies criadas para isolamento multi-tenant
- [x] ✅ Functions SECURITY DEFINER protegidas

#### ETAPA 6.1 - Testes E2E
- [ ] ⏳ 100% dos testes de isolamento aprovados
- [ ] ⏳ 0 vazamentos cross-tenant detectados
- [ ] ⏳ Fluxo normal funcional sem regressões

**Status Bloqueadores:** [ ] **PENDENTE**

---

### Recomendado (DEVE estar antes de produção se funcionalidades existirem)

#### ETAPA 4 - SuperAdmin
- [ ] ⏳ SuperAdmin em tabela (não hardcoded)
- [ ] ⏳ Soft delete implementado
- [ ] ⏳ Audit log implementado

#### ETAPA 5 - Billing
- [ ] ⏳ Enforcement de trial/suspended
- [ ] ⏳ Idempotência em orders/webhooks
- [ ] ⏳ Páginas de status de billing

**Status Recomendado:** [ ] **PENDENTE**

---

### Desejável (P1 - pode ser pós-produção inicial)

#### ETAPA 6.4 - Observabilidade
- [ ] ⏳ Logging estruturado
- [ ] ⏳ Alertas configurados
- [ ] ⏳ Rate limiting
- [ ] ⏳ Dashboards de segurança

**Status Desejável:** [ ] **PENDENTE**

---

## 📋 Decisão Final

**Data da Decisão:** [PREENCHER]  
**Decisão:** [✅ GO / ❌ NO-GO]

### Justificativa
[PREENCHER]

### Riscos Aceitos (se GO com pendências)
[PREENCHER]

### Plano de Mitigação (se GO com pendências)
[PREENCHER]

### Ações Bloqueadoras (se NO-GO)
1. [Ação 1]
2. [Ação 2]

---

## 📅 Timeline Recomendado

| Etapa | Prioridade | Tempo Estimado | Status |
|-------|------------|----------------|--------|
| ETAPA 3 - Supabase | P0 | 2-3 dias | ✅ CONCLUÍDO |
| ETAPA 6.1 - Testes E2E | P0 | 1 dia | ⏳ PENDENTE |
| ETAPA 4 - SuperAdmin | P0 | 1-2 dias | ⏳ PENDENTE |
| ETAPA 5 - Billing | P0 | 2-4 dias | ⏳ PENDENTE |
| ETAPA 6.4 - Observabilidade | P1 | 3-7 dias | ⏳ PENDENTE |

**Total Estimado (P0):** 6-10 dias  
**Total Estimado (P0 + P1):** 9-17 dias

---

**FIM DO CHECKLIST**

**Próxima Ação:** Executar ETAPA 6.1 (Testes E2E Multi-Tenant)
