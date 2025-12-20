# MATRIZ DE MÓDULOS E PÁGINAS - SNAPSHOT
**Gerado em:** 2024-12-19 23:50

---

## 1. MENU PÚBLICO (Cardápio)

| Funcionalidade | Status | Rota | Componentes |
|---------------|--------|------|-------------|
| Listagem de categorias | ✅ OK | /[slug] | Minisite module |
| Listagem de produtos | ✅ OK | /[slug] | ProductCard |
| Detalhe do produto | ✅ OK | /[slug] | Modal inline |
| Carrinho | ✅ OK | /[slug]/cart | Cart page |
| Checkout | ⚠️ PARCIAL | /[slug]/cart | Dentro do cart |
| Bloqueio DRAFT | ✅ OK | middleware | Status check |
| Tema customizável | ✅ OK | - | Theme settings |
| Avaliação de entrega | ✅ OK | /[slug]/avaliar/[deliveryId] | Rating page |

### Entidades
- `stores` (slug, status, theme)
- `categories` (store_id)
- `products` (category_id, store_id)
- `product_variations`
- `product_addons`
- `orders` (store_id, customer)

---

## 2. MERCHANT DASHBOARD

### Core (Sempre Disponível)
| Funcionalidade | Status | Rota | Módulo ID |
|---------------|--------|------|-----------|
| Dashboard Home | ✅ OK | /[slug]/dashboard | dashboard |
| Pedidos | ✅ OK | /[slug]/dashboard/orders | orders |
| Produtos | ✅ OK | /[slug]/dashboard/products | products |
| Configurações | ✅ OK | /[slug]/dashboard/settings | settings |
| Aparência | ✅ OK | /[slug]/dashboard/appearance | appearance |

### Vendas (Por Plano)
| Funcionalidade | Status | Rota | Módulo ID |
|---------------|--------|------|-----------|
| PDV | ✅ OK | /[slug]/dashboard/pos | pos |
| Cozinha (KDS) | ✅ OK | /[slug]/dashboard/kitchen | kitchen |
| Cupons | ✅ OK | /[slug]/dashboard/coupons | coupons |

### Cardápio (Por Plano)
| Funcionalidade | Status | Rota | Módulo ID |
|---------------|--------|------|-----------|
| Adicionais | ✅ OK | /[slug]/dashboard/addons | addons |
| Kits/Combos | ✅ OK | /[slug]/dashboard/kits | kits |
| Estoque | ✅ OK | /[slug]/dashboard/inventory | inventory |

### Operações (Por Plano)
| Funcionalidade | Status | Rota | Módulo ID |
|---------------|--------|------|-----------|
| Financeiro | ✅ OK | /[slug]/dashboard/financial | financial |
| Clientes (CRM) | ✅ OK | /[slug]/dashboard/crm | crm |
| Entregadores | ✅ OK | /[slug]/dashboard/delivery | delivery |
| Mesas | ✅ OK | /[slug]/dashboard/tables | tables |
| Garçons | ✅ OK | /[slug]/dashboard/waiters | waiters |
| Reservas | ✅ OK | /[slug]/dashboard/reservations | reservations |
| Equipe | ✅ OK | /[slug]/dashboard/team | team |
| Encomendas | ✅ OK | /[slug]/dashboard/custom-orders | custom_orders |

### Marketing (Por Plano)
| Funcionalidade | Status | Rota | Módulo ID |
|---------------|--------|------|-----------|
| Campanhas | ✅ OK | /[slug]/dashboard/marketing | marketing |
| Avaliações | ✅ OK | /[slug]/dashboard/reviews | reviews |
| Afiliados | ✅ OK | /[slug]/dashboard/afiliados | affiliates |

### Analytics (Por Plano)
| Funcionalidade | Status | Rota | Módulo ID |
|---------------|--------|------|-----------|
| Analytics | ✅ OK | /[slug]/dashboard/analytics | analytics |
| Relatórios | ✅ OK | /[slug]/dashboard/reports | reports |

### Configurações (Subpáginas)
| Funcionalidade | Status | Rota |
|---------------|--------|------|
| Dados da Loja | ✅ OK | /[slug]/dashboard/settings/store |
| Integrações | ✅ OK | /[slug]/dashboard/settings/integrations |
| Fidelidade | ✅ OK | /[slug]/dashboard/settings/loyalty |
| Módulos | ✅ OK | /[slug]/dashboard/settings/modules |
| Nicho | ✅ OK | /[slug]/dashboard/settings/niche |
| Plataformas | ✅ OK | /[slug]/dashboard/settings/platforms |
| Agendamento | ✅ OK | /[slug]/dashboard/settings/scheduling |
| Completar Setup | ✅ OK | /[slug]/dashboard/settings/complete |

---

## 3. DRIVER DASHBOARD

| Funcionalidade | Status | Rota/Tab | Entidades |
|---------------|--------|----------|-----------|
| Stats de entregas | ⚠️ STUB | entregas | Simulado |
| Lista lojas vinculadas | ✅ OK | entregas | store_users |
| Entregas pendentes | ⚠️ STUB | entregas | - |
| Mapa | ❌ NÃO IMPL | - | - |
| Pagamentos | ❌ NÃO IMPL | - | - |
| Avaliações | ❌ NÃO IMPL | - | - |
| Link de afiliado | ✅ OK | afiliados | referral_codes |
| Stats de indicação | ✅ OK | afiliados | referral_sales |
| Comissões | ✅ OK | afiliados | referral_sales |

---

## 4. SUPER ADMIN

| Funcionalidade | Status | Rota | Guard |
|---------------|--------|------|-------|
| Dashboard | ✅ OK | /admin | requireSuperAdmin |
| Tenants | ✅ OK | /admin/tenants | requireSuperAdmin |
| Lojas | ✅ OK | /admin/stores | requireSuperAdmin |
| Usuários | ✅ OK | /admin/users | requireSuperAdmin |
| Planos | ✅ OK | /admin/plans | requireSuperAdmin |
| Plano - Criar | ✅ OK | /admin/plans/new | requireSuperAdmin |
| Plano - Editar | ✅ OK | /admin/plans/[planId] | requireSuperAdmin |
| Billing | ✅ OK | /admin/billing | requireSuperAdmin |
| Afiliados | ✅ OK | /admin/affiliates | requireSuperAdmin |
| Afiliados - Payouts | ✅ OK | /admin/affiliates/payouts | requireSuperAdmin |
| Afiliados - Sales | ✅ OK | /admin/affiliates/sales | requireSuperAdmin |
| Afiliados - Settings | ✅ OK | /admin/affiliates/settings | requireSuperAdmin |
| Analytics | ✅ OK | /admin/analytics | requireSuperAdmin |
| Logs | ✅ OK | /admin/logs | requireSuperAdmin |
| Tickets | ✅ OK | /admin/tickets | requireSuperAdmin |
| Feature Flags | ✅ OK | /admin/features | requireSuperAdmin |
| Automações | ✅ OK | /admin/automations | requireSuperAdmin |
| Relatórios | ✅ OK | /admin/reports | requireSuperAdmin |
| Configurações | ✅ OK | /admin/settings | requireSuperAdmin |
| Partners | ✅ OK | /admin/partners | requireSuperAdmin |
| Integrações | ✅ OK | /admin/integrations | requireSuperAdmin |
| Audit | ✅ OK | /admin/audit | requireSuperAdmin |
| Demanda | ✅ OK | /admin/demanda | requireSuperAdmin |
| Health | ✅ OK | /admin/health | requireSuperAdmin |
| Health - Subpáginas | ✅ OK | /admin/health/* | requireSuperAdmin |

---

## 5. SISTEMA DE AFILIADOS

| Tabela | Status | Descrição |
|--------|--------|-----------|
| referral_partners | ✅ CRIADA | Parceiros/afiliados |
| referral_codes | ✅ CRIADA | Códigos de indicação |
| tenant_referrals | ✅ CRIADA | Atribuição tenant→partner |
| referral_sales | ✅ CRIADA | Comissões financeiras |

| Funcionalidade | Status | Local |
|---------------|--------|-------|
| UI SuperAdmin | ✅ OK | /admin/affiliates/* |
| UI Lojista | ✅ OK | /[slug]/dashboard/afiliados |
| UI Driver | ✅ OK | /driver/dashboard (tab) |
| RLS Policies | ✅ OK | 10 policies |
| Self-service register | ✅ OK | Policy insert_self |
| Split 80/20 driver | ✅ OK | Campos + trigger |
| Integração checkout | ❌ PENDENTE | P1 |
| Payout automático | ❌ PENDENTE | P1 |

---

## 6. BILLING ENFORCEMENT

| Componente | Status | Arquivo |
|------------|--------|---------|
| decideBilling() | ✅ OK | src/lib/billing/enforcement.ts |
| checkBillingStatus() | ✅ OK | src/lib/billing/enforcement.ts |
| enforceBillingInMiddleware() | ✅ OK | src/lib/billing/enforcement.ts |
| enforceBillingInAction() | ✅ OK | src/lib/billing/enforcement.ts |
| assertBillingOk() | ✅ OK | src/lib/billing/enforcement.ts |
| Página trial-expired | ✅ OK | /billing/trial-expired |
| Página suspended | ✅ OK | /billing/suspended |
| Página overdue | ✅ OK | /billing/overdue |
| Stores de teste | ✅ CRIADAS | test-active, test-trial-expired, test-past-due, test-suspended |
| Gateway pagamento | ❌ PENDENTE | P1 |

---

## 7. ENV VARS (APENAS NOMES)

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# App
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_BASE_DOMAIN

# Cron
CRON_SECRET

# Integrations (se configuradas)
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
MERCADOPAGO_ACCESS_TOKEN
```
