# GO / NO-GO CHECKLIST - AUDITORIA 08
**Data:** 2024-12-19 23:34 (atualizado)  
**Projeto:** food-management-system  
**Objetivo:** Validar se o sistema está pronto para produção

---

## 🚦 DECISÃO FINAL: **CONDITIONAL GO**

O sistema pode ir para produção com as seguintes condições:
1. ✅ Scripts de migrations de afiliados prontos → `audit/08A_APPLY_AFFILIATES.sql`
2. ✅ Script de verificação de afiliados pronto → `audit/08A_VERIFY_AFFILIATES.sql`
3. ✅ Script de verificação de billing pronto → `scripts/verify-billing.mjs`
4. ⬜ **AÇÃO:** Executar SQL no Supabase
5. ⬜ **AÇÃO:** Testar billing no navegador (logado)

---

## ✅ CHECKLIST DE PRODUÇÃO

### INFRAESTRUTURA
| # | Item | Status | Bloqueador? |
|---|------|--------|-------------|
| 1 | Build passa sem erros | ✅ GO | - |
| 2 | TypeScript sem erros | ✅ GO | - |
| 3 | Lint passa | ✅ GO | - |
| 4 | Domínios configurados na Vercel | ✅ GO | - |
| 5 | DNS propagado | ✅ GO | - |
| 6 | SSL/HTTPS ativo | ✅ GO | - |
| 7 | Envs configuradas na Vercel | ⚠️ VERIFICAR | - |

### SEGURANÇA
| # | Item | Status | Bloqueador? |
|---|------|--------|-------------|
| 8 | RLS habilitado em tabelas críticas | ⚠️ VERIFICAR | Sim |
| 9 | SuperAdmin guards funcionando | ✅ GO | - |
| 10 | Audit log append-only | ✅ GO | - |
| 11 | Secrets não expostos em logs | ✅ GO | - |
| 12 | CORS configurado | ✅ GO | - |

### BILLING
| # | Item | Status | Bloqueador? |
|---|------|--------|-------------|
| 13 | `decideBilling()` implementado | ✅ GO | - |
| 14 | Middleware billing check | ✅ GO | - |
| 15 | Server actions bloqueiam mutação | ✅ GO | - |
| 16 | Páginas de bloqueio existem | ✅ GO | - |
| 17 | **Teste manual 4 URLs** | ❌ NO-GO | **SIM** |
| 18 | Gateway de pagamento | ❌ NO-GO | Não (P1) |

### MULTI-TENANT
| # | Item | Status | Bloqueador? |
|---|------|--------|-------------|
| 19 | Isolamento por tenant_id | ✅ GO | - |
| 20 | RLS por store_id | ✅ GO | - |
| 21 | Usuário só vê suas lojas | ✅ GO | - |

### FUNCIONALIDADES CORE
| # | Item | Status | Bloqueador? |
|---|------|--------|-------------|
| 22 | Onboarding slug-first | ✅ GO | - |
| 23 | Cardápio público | ✅ GO | - |
| 24 | Dashboard lojista | ✅ GO | - |
| 25 | Pedidos | ✅ GO | - |
| 26 | SuperAdmin | ✅ GO | - |

### AFILIADOS
| # | Item | Status | Bloqueador? |
|---|------|--------|-------------|
| 27 | UI SuperAdmin | ✅ GO | - |
| 28 | UI Lojista | ✅ GO | - |
| 29 | UI Driver | ✅ GO | - |
| 30 | **Migrations executadas** | ❌ NO-GO | **SIM** |
| 31 | Integração checkout | ❌ NO-GO | Não (P1) |

### OBSERVABILIDADE
| # | Item | Status | Bloqueador? |
|---|------|--------|-------------|
| 32 | Logs de erro | ✅ GO | - |
| 33 | Health endpoint | ✅ GO | - |
| 34 | Cron jobs | ✅ GO | - |

---

## 🔴 BLOQUEADORES (RESOLVER ANTES DE GO)

### BLOQUEADOR 1: Migrations de Afiliados
**Ação:** Executar no Supabase SQL Editor:
```sql
-- Executar em ordem:
-- 1. 20251219000004_referral_affiliates.sql
-- 2. 20251219000005_referral_rls_selfservice.sql
-- 3. 20251219000006_referral_driver_split.sql
```
**Tempo estimado:** 5 minutos
**Responsável:** DevOps/DBA

### BLOQUEADOR 2: Teste Manual Billing
**Ação:** Acessar URLs no navegador (logado):
- https://app.pediu.food/test-active/dashboard → Deve funcionar
- https://app.pediu.food/test-trial-expired/dashboard → Deve redirecionar
- https://app.pediu.food/test-past-due/dashboard → Deve mostrar read-only
- https://app.pediu.food/test-suspended/dashboard → Deve redirecionar

**Tempo estimado:** 10 minutos
**Responsável:** QA/Dev

---

## 🟡 NÃO-BLOQUEADORES (P1/P2)

| Item | Prioridade | Pode ir live sem? |
|------|------------|-------------------|
| Gateway de pagamento | P1 | ✅ Sim (cobrança manual) |
| Integração checkout→afiliados | P1 | ✅ Sim |
| Payout automático | P1 | ✅ Sim |
| Testes E2E completos | P2 | ✅ Sim |
| APM/Observabilidade avançada | P2 | ✅ Sim |

---

## 📋 ASSINATURAS

| Papel | Nome | Data | GO/NO-GO |
|-------|------|------|----------|
| Tech Lead | _______ | ___/___/___ | ⬜ GO ⬜ NO-GO |
| QA | _______ | ___/___/___ | ⬜ GO ⬜ NO-GO |
| Product | _______ | ___/___/___ | ⬜ GO ⬜ NO-GO |

---

## 📌 NOTAS

1. Sistema funciona 100% para MVP sem gateway de pagamento (billing enforcement bloqueia, mas não cobra automaticamente)
2. Afiliados funcionam como UI, backend precisa das migrations
3. Após resolver os 2 bloqueadores, sistema está GO para produção
