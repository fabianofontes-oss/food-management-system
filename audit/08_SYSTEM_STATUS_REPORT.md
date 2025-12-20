# RELATÓRIO DE STATUS DO SISTEMA - AUDITORIA 08
**Data:** 2024-12-19 23:34 (atualizado)  
**Branch:** main  
**Projeto:** food-management-system

---

## 📋 RESUMO EXECUTIVO

O sistema está **~85% pronto para produção**. Build passa, lint OK, rotas funcionam. 

**ATUALIZAÇÃO:** Scripts de aplicação e verificação de afiliados prontos (`audit/08A_*.sql`). Script de verificação de billing pronto (`scripts/verify-billing.mjs`) - retornou AUTH_BLOCKED (esperado, precisa login manual).

**Para GO final:**
1. Executar `audit/08A_APPLY_AFFILIATES.sql` no Supabase
2. Testar billing manualmente no navegador (logado)

---

## ✅ O QUE ESTÁ FUNCIONANDO HOJE

### 1. INFRAESTRUTURA (100%)
| Item | Status | Evidência |
|------|--------|-----------|
| Build Next.js | ✅ PASS | `npm run build` exit 0 |
| TypeScript | ✅ PASS | Sem erros de tipo |
| Lint | ✅ PASS | ESLint OK |
| Domínios Vercel | ✅ CONFIGURADOS | pediu.food, entregou.food, pensou.food |
| DNS propagado | ✅ OK | curl retorna 200 |

### 2. ROTEAMENTO POR HOST (100%)
| Host | Destino | Status |
|------|---------|--------|
| `{slug}.pediu.food` | `/s/{slug}` | ✅ OK |
| `admin.pediu.food` | `/admin` | ✅ OK |
| `app.pediu.food` | passthrough | ✅ OK |
| `driver.entregou.food` | `/driver/dashboard` | ✅ OK |
| `pediu.food` | passthrough | ✅ OK |
| `entregou.food` | passthrough | ✅ OK |
| `pensou.food` | passthrough | ✅ OK |

**Arquivo:** `src/middleware.ts` (linhas 42-101)

### 3. ONBOARDING SLUG-FIRST (100%)
| Item | Status | Arquivo |
|------|--------|---------|
| Página `/onboarding` | ✅ OK | `src/app/(public)/onboarding/page.tsx` |
| `/choose-url` | ✅ OK | `src/app/choose-url/page.tsx` |
| API slug check | ✅ OK | `src/app/api/public/slug/check/route.ts` |
| API store prepare | ✅ OK | `src/app/api/onboarding/store/prepare/route.ts` |
| API store publish | ✅ OK | `src/app/api/onboarding/store/publish/route.ts` |
| Setup com token | ✅ OK | `src/app/setup/[token]/page.tsx` |
| Draft store module | ✅ OK | `src/modules/draft-store/` |

### 4. CARDÁPIO PÚBLICO (100%)
| Item | Status | Arquivo |
|------|--------|---------|
| Página `/[slug]` | ✅ OK | `src/app/[slug]/page.tsx` |
| Rewrite `/s/[slug]` | ✅ OK | `src/app/s/[slug]/page.tsx` |
| Minisite module | ✅ OK | `src/modules/minisite/` |
| Bloqueio DRAFT | ✅ OK | Repository filtra por status |

### 5. DASHBOARD LOJISTA (95%)
| Item | Status | Arquivo |
|------|--------|---------|
| Layout | ✅ OK | `src/app/[slug]/dashboard/layout.tsx` |
| Pedidos | ✅ OK | `src/app/[slug]/dashboard/pedidos/` |
| Cardápio | ✅ OK | `src/app/[slug]/dashboard/cardapio/` |
| Categorias | ✅ OK | `src/app/[slug]/dashboard/categorias/` |
| Produtos | ✅ OK | `src/app/[slug]/dashboard/produtos/` |
| Clientes | ✅ OK | `src/app/[slug]/dashboard/clientes/` |
| Configurações | ✅ OK | `src/app/[slug]/dashboard/configuracoes/` |
| Entregas | ✅ OK | `src/app/[slug]/dashboard/entregas/` |
| Estoque | ✅ OK | `src/app/[slug]/dashboard/estoque/` |
| Financeiro | ✅ OK | `src/app/[slug]/dashboard/financeiro/` |
| Mesas | ✅ OK | `src/app/[slug]/dashboard/mesas/` |
| Relatórios | ✅ OK | `src/app/[slug]/dashboard/relatorios/` |
| Afiliados | ✅ OK (UI) | `src/app/[slug]/dashboard/afiliados/page.tsx` |

### 6. SUPERADMIN (100%)
| Item | Status | Arquivo |
|------|--------|---------|
| Guard `requireSuperAdmin` | ✅ OK | `src/lib/superadmin/guard.ts` |
| Guard `requirePermission` | ✅ OK | `src/lib/superadmin/guard.ts` |
| Audit log append-only | ✅ OK | Migration `20241219000001_04b_p0_superadmin_security.sql` |
| Rotas protegidas | ✅ OK | Layout verifica isSuperAdmin |
| Dashboard `/admin` | ✅ OK | 20+ páginas funcionais |
| Tenants | ✅ OK | `src/app/(super-admin)/admin/tenants/` |
| Stores | ✅ OK | `src/app/(super-admin)/admin/stores/` |
| Users | ✅ OK | `src/app/(super-admin)/admin/users/` |
| Plans | ✅ OK | `src/app/(super-admin)/admin/plans/` |
| Afiliados | ✅ OK (UI) | `src/app/(super-admin)/admin/affiliates/` |

### 7. DRIVER DASHBOARD (90%)
| Item | Status | Arquivo |
|------|--------|---------|
| Página principal | ✅ OK | `src/app/driver/dashboard/page.tsx` |
| Tab Entregas | ✅ OK (UI stub) | Stats simulados |
| Tab Afiliados | ✅ OK | Integra com referral_* |
| Lojas vinculadas | ✅ OK | Busca store_users role=DRIVER |

### 8. BILLING ENFORCEMENT (95%)
| Item | Status | Arquivo |
|------|--------|---------|
| `decideBilling()` | ✅ OK | `src/lib/billing/enforcement.ts` |
| `checkBillingStatus()` | ✅ OK | `src/lib/billing/enforcement.ts` |
| `enforceBillingInMiddleware()` | ✅ OK | `src/lib/billing/enforcement.ts` |
| `enforceBillingInAction()` | ✅ OK | `src/lib/billing/enforcement.ts` |
| `assertBillingOk()` | ✅ OK | `src/lib/billing/enforcement.ts` |
| Página `/billing/trial-expired` | ✅ OK | `src/app/billing/trial-expired/page.tsx` |
| Página `/billing/suspended` | ✅ OK | `src/app/billing/suspended/page.tsx` |
| Página `/billing/overdue` | ✅ OK | `src/app/billing/overdue/page.tsx` |
| Stores de teste | ✅ CRIADAS | test-active, test-trial-expired, test-past-due, test-suspended |
| **TESTE MANUAL** | ⚠️ PENDENTE | Precisa validar no navegador |

### 9. ORDERS/PEDIDOS (95%)
| Item | Status | Evidência |
|------|--------|-----------|
| Idempotência | ✅ OK | Migration `20251214000001_01_orders_idempotency.sql` |
| Order code | ✅ OK | Migration `20251214000001_02_order_code.sql` |
| Atomic create | ✅ OK | Migration `20251214000002_03_create_order_atomic.sql` |
| Stock/pricing | ✅ OK | Migration `20251214000003_04_create_order_atomic_stock_and_pricing.sql` |
| RLS multitenant | ✅ OK | Migration `20251214000004_05_rls_full_multitenant.sql` |

### 10. CRON/JOBS (100%)
| Item | Status | Arquivo |
|------|--------|---------|
| Clean expired drafts | ✅ OK | `src/app/api/cron/clean-expired-drafts/route.ts` |
| envReady guard | ✅ OK | Não quebra build se env faltando |

### 11. PING/HEALTH (100%)
| Item | Status | Arquivo |
|------|--------|---------|
| `/api/ping` | ✅ OK | `src/app/api/ping/route.ts` (edge runtime) |
| Bypass middleware | ✅ OK | Middleware ignora /api/ping |

---

## ⚠️ O QUE ESTÁ INCOMPLETO / FALTA

### 1. AFILIADOS - BACKEND
| Item | Status | Gap |
|------|--------|-----|
| Migrations SQL | ✅ PREPARADAS | 3 arquivos prontos |
| **Execução no Supabase** | ❌ PENDENTE | Precisa rodar manualmente |
| Integração com checkout | ❌ PENDENTE | Onde nasce a "sale" |
| Payout/ledger automático | ❌ PENDENTE | P1 |

**Arquivos de migration:**
- `20251219000004_referral_affiliates.sql` (tabelas base)
- `20251219000005_referral_rls_selfservice.sql` (RLS)
- `20251219000006_referral_driver_split.sql` (split driver/recruiter)

### 2. BILLING - GATEWAY
| Item | Status | Gap |
|------|--------|-----|
| Integração Stripe/MP | ❌ NÃO IMPLEMENTADO | P1 |
| Webhooks de pagamento | ⚠️ STUB | `src/app/api/webhooks/mercadopago/route.ts` existe mas parcial |
| Faturas automáticas | ❌ NÃO IMPLEMENTADO | P1 |
| Suspensão automática | ❌ NÃO IMPLEMENTADO | P1 |

### 3. TESTES E2E
| Item | Status | Gap |
|------|--------|-----|
| Billing enforcement E2E | ❌ NÃO EXISTE | Precisa Playwright test |
| Multitenant E2E | ⚠️ PARCIAL | Alguns testes existem |

---

## 🔴 RISCOS P0 (CRÍTICOS)

1. **Billing Enforcement não testado manualmente** - Bloqueador para GO
2. **Migrations de afiliados não executadas** - Tabelas não existem no Supabase

## 🟡 RISCOS P1 (IMPORTANTES)

3. **Integração com gateway de pagamento** - Cobrança manual por enquanto
4. **Suspensão automática de inadimplentes** - Depende de webhook
5. **Payout de afiliados** - Ledger não implementado

## 🟢 RISCOS P2 (BAIXOS)

6. **Testes E2E completos** - Cobertura parcial
7. **Observabilidade** - Logs básicos, sem APM

---

## 📁 EVIDÊNCIAS

| Arquivo | Descrição |
|---------|-----------|
| `audit/08_build_output.txt` | Output do build |
| `audit/07_FULL_*/checks/07_routes_map.txt` | Mapa de rotas |
| `audit/07_FULL_*/checks/07_affiliates_status.txt` | Status afiliados |
| `src/lib/billing/enforcement.ts` | Código billing (288 linhas) |
| `src/middleware.ts` | Roteamento por host (120 linhas) |

---

## 📊 MÉTRICAS

| Métrica | Valor |
|---------|-------|
| Total de páginas App Router | 42 |
| Migrations SQL | 36 |
| Arquivos com guards SuperAdmin | 10 |
| Linhas de código billing | 288 |
| Domínios configurados | 7 |
