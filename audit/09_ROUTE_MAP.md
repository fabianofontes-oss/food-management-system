# MAPA DE ROTAS POR HOST
**Gerado em:** 2024-12-20 00:30  
**Branch:** main

---

## HOSTS CONFIGURADOS (middleware.ts)

| Host | Roteamento | Alvo |
|------|------------|------|
| `admin.pediu.food` | Rewrite `/` → `/admin` | SuperAdmin |
| `app.pediu.food` | Passthrough | Dashboard Lojista |
| `{slug}.pediu.food` | Rewrite → `/s/{slug}/*` | Cardápio Público |
| `driver.entregou.food` | Rewrite `/` → `/driver/dashboard` | Driver |
| `entregou.food` | Passthrough | Landing Entregadores |
| `pensou.food` | Passthrough | Futuro: Discover |
| `pediu.food` | Passthrough | Landing Principal |
| `www.pediu.food` | Passthrough | Landing Principal |

---

## 1. HOST: www.pediu.food / pediu.food

**Público-alvo:** Visitantes, Clientes

| Rota | Tipo | Auth | File Path |
|------|------|------|-----------|
| `/` | Público | ❌ | `src/app/page.tsx` |
| `/landing` | Público | ❌ | `src/app/(public)/landing/page.tsx` |
| `/login` | Público | ❌ | `src/app/(auth)/login/page.tsx` |
| `/signup` | Público | ❌ | `src/app/(auth)/signup/page.tsx` |
| `/reset-password` | Público | ❌ | `src/app/(auth)/reset-password/page.tsx` |
| `/update-password` | Público | ✅ | `src/app/(auth)/update-password/page.tsx` |
| `/profile` | Auth | ✅ | `src/app/(public)/profile/page.tsx` |
| `/onboarding/*` | Público | ❌ | `src/app/onboarding/` |
| `/choose-url` | Público | ❌ | `src/app/choose-url/page.tsx` |
| `/setup/[token]` | Público | Token | `src/app/setup/[token]/page.tsx` |
| `/mapa-do-site` | Público | ❌ | `src/app/mapa-do-site/page.tsx` |
| `/logout` | Público | ❌ | `src/app/logout/page.tsx` |

---

## 2. HOST: admin.pediu.food

**Público-alvo:** SuperAdmin

| Rota | Tipo | Auth | File Path |
|------|------|------|-----------|
| `/admin` | Admin | ✅ SuperAdmin | `src/app/(super-admin)/admin/page.tsx` |
| `/admin/tenants` | Admin | ✅ SuperAdmin | `src/app/(super-admin)/admin/tenants/page.tsx` |
| `/admin/stores` | Admin | ✅ SuperAdmin | `src/app/(super-admin)/admin/stores/page.tsx` |
| `/admin/users` | Admin | ✅ SuperAdmin | `src/app/(super-admin)/admin/users/page.tsx` |
| `/admin/plans` | Admin | ✅ SuperAdmin | `src/app/(super-admin)/admin/plans/page.tsx` |
| `/admin/plans/new` | Admin | ✅ SuperAdmin | `src/app/(super-admin)/admin/plans/new/page.tsx` |
| `/admin/plans/[planId]` | Admin | ✅ SuperAdmin | `src/app/(super-admin)/admin/plans/[planId]/page.tsx` |
| `/admin/billing` | Admin | ✅ SuperAdmin | `src/app/(super-admin)/admin/billing/page.tsx` |
| `/admin/affiliates` | Admin | ✅ SuperAdmin | `src/app/(super-admin)/admin/affiliates/page.tsx` |
| `/admin/affiliates/payouts` | Admin | ✅ SuperAdmin | `src/app/(super-admin)/admin/affiliates/payouts/page.tsx` |
| `/admin/affiliates/sales` | Admin | ✅ SuperAdmin | `src/app/(super-admin)/admin/affiliates/sales/page.tsx` |
| `/admin/affiliates/settings` | Admin | ✅ SuperAdmin | `src/app/(super-admin)/admin/affiliates/settings/page.tsx` |
| `/admin/analytics` | Admin | ✅ SuperAdmin | `src/app/(super-admin)/admin/analytics/page.tsx` |
| `/admin/logs` | Admin | ✅ SuperAdmin | `src/app/(super-admin)/admin/logs/page.tsx` |
| `/admin/tickets` | Admin | ✅ SuperAdmin | `src/app/(super-admin)/admin/tickets/page.tsx` |
| `/admin/features` | Admin | ✅ SuperAdmin | `src/app/(super-admin)/admin/features/page.tsx` |
| `/admin/automations` | Admin | ✅ SuperAdmin | `src/app/(super-admin)/admin/automations/page.tsx` |
| `/admin/reports` | Admin | ✅ SuperAdmin | `src/app/(super-admin)/admin/reports/page.tsx` |
| `/admin/settings` | Admin | ✅ SuperAdmin | `src/app/(super-admin)/admin/settings/page.tsx` |
| `/admin/partners` | Admin | ✅ SuperAdmin | `src/app/(super-admin)/admin/partners/page.tsx` |
| `/admin/integrations` | Admin | ✅ SuperAdmin | `src/app/(super-admin)/admin/integrations/page.tsx` |
| `/admin/audit` | Admin | ✅ SuperAdmin | `src/app/(super-admin)/admin/audit/page.tsx` |
| `/admin/demanda` | Admin | ✅ SuperAdmin | `src/app/(super-admin)/admin/demanda/page.tsx` |
| `/admin/health` | Admin | ✅ SuperAdmin | `src/app/(super-admin)/admin/health/page.tsx` |
| `/admin/health/*` | Admin | ✅ SuperAdmin | `src/app/(super-admin)/admin/health/*/page.tsx` |

---

## 3. HOST: app.pediu.food

**Público-alvo:** Lojistas (Merchants)

### Menu Público (Cliente)
| Rota | Tipo | Auth | File Path |
|------|------|------|-----------|
| `/[slug]` | Público | ❌ | `src/app/[slug]/page.tsx` |
| `/[slug]/cart` | Público | ❌ | `src/app/[slug]/cart/page.tsx` |
| `/[slug]/avaliar/[deliveryId]` | Público | ❌ | `src/app/[slug]/avaliar/[deliveryId]/page.tsx` |
| `/[slug]/minha-conta` | Auth | ✅ | `src/app/[slug]/minha-conta/page.tsx` |
| `/[slug]/motorista` | Driver | Telefone | `src/app/[slug]/motorista/page.tsx` |
| `/[slug]/waiter` | Staff | ✅ | `src/app/[slug]/waiter/page.tsx` |
| `/[slug]/encomenda` | Público | ❌ | `src/app/[slug]/encomenda/page.tsx` |

### Dashboard Lojista
| Rota | Tipo | Auth | File Path |
|------|------|------|-----------|
| `/[slug]/dashboard` | Lojista | ✅ Store | `src/app/[slug]/dashboard/page.tsx` |
| `/[slug]/dashboard/orders` | Lojista | ✅ Store | `src/app/[slug]/dashboard/orders/page.tsx` |
| `/[slug]/dashboard/products` | Lojista | ✅ Store | `src/app/[slug]/dashboard/products/page.tsx` |
| `/[slug]/dashboard/addons` | Lojista | ✅ Store+Module | `src/app/[slug]/dashboard/addons/page.tsx` |
| `/[slug]/dashboard/pos` | Lojista | ✅ Store+Module | `src/app/[slug]/dashboard/pos/page.tsx` |
| `/[slug]/dashboard/kitchen` | Lojista | ✅ Store+Module | `src/app/[slug]/dashboard/kitchen/page.tsx` |
| `/[slug]/dashboard/inventory` | Lojista | ✅ Store+Module | `src/app/[slug]/dashboard/inventory/page.tsx` |
| `/[slug]/dashboard/financial` | Lojista | ✅ Store+Module | `src/app/[slug]/dashboard/financial/page.tsx` |
| `/[slug]/dashboard/crm` | Lojista | ✅ Store+Module | `src/app/[slug]/dashboard/crm/page.tsx` |
| `/[slug]/dashboard/delivery` | Lojista | ✅ Store+Module | `src/app/[slug]/dashboard/delivery/page.tsx` |
| `/[slug]/dashboard/tables` | Lojista | ✅ Store+Module | `src/app/[slug]/dashboard/tables/page.tsx` |
| `/[slug]/dashboard/waiters` | Lojista | ✅ Store+Module | `src/app/[slug]/dashboard/waiters/page.tsx` |
| `/[slug]/dashboard/reservations` | Lojista | ✅ Store+Module | `src/app/[slug]/dashboard/reservations/page.tsx` |
| `/[slug]/dashboard/team` | Lojista | ✅ Store+Module | `src/app/[slug]/dashboard/team/page.tsx` |
| `/[slug]/dashboard/coupons` | Lojista | ✅ Store+Module | `src/app/[slug]/dashboard/coupons/page.tsx` |
| `/[slug]/dashboard/marketing` | Lojista | ✅ Store+Module | `src/app/[slug]/dashboard/marketing/page.tsx` |
| `/[slug]/dashboard/reviews` | Lojista | ✅ Store+Module | `src/app/[slug]/dashboard/reviews/page.tsx` |
| `/[slug]/dashboard/analytics` | Lojista | ✅ Store+Module | `src/app/[slug]/dashboard/analytics/page.tsx` |
| `/[slug]/dashboard/reports` | Lojista | ✅ Store+Module | `src/app/[slug]/dashboard/reports/page.tsx` |
| `/[slug]/dashboard/afiliados` | Lojista | ✅ Store+Module | `src/app/[slug]/dashboard/afiliados/page.tsx` |
| `/[slug]/dashboard/kits` | Lojista | ✅ Store+Module | `src/app/[slug]/dashboard/kits/page.tsx` |
| `/[slug]/dashboard/custom-orders` | Lojista | ✅ Store+Module | `src/app/[slug]/dashboard/custom-orders/page.tsx` |
| `/[slug]/dashboard/appearance` | Lojista | ✅ Store | `src/app/[slug]/dashboard/appearance/page.tsx` |
| `/[slug]/dashboard/onboarding` | Lojista | ✅ Store | `src/app/[slug]/dashboard/onboarding/page.tsx` |
| `/[slug]/dashboard/settings/*` | Lojista | ✅ Store | `src/app/[slug]/dashboard/settings/*/page.tsx` |

---

## 4. HOST: {slug}.pediu.food

**Público-alvo:** Clientes da loja {slug}

| Rota | Tipo | Auth | File Path |
|------|------|------|-----------|
| `/` | Público | ❌ | Rewrite → `/s/{slug}` → `src/app/[slug]/page.tsx` |
| `/cart` | Público | ❌ | Rewrite → `/s/{slug}/cart` |
| `/minha-conta` | Auth | ✅ | Rewrite → `/s/{slug}/minha-conta` |

**Nota:** O middleware faz rewrite de `{slug}.pediu.food/*` para `/s/{slug}/*`

---

## 5. HOST: driver.entregou.food

**Público-alvo:** Motoristas/Entregadores

| Rota | Tipo | Auth | File Path |
|------|------|------|-----------|
| `/` | Driver | ✅ Supabase | Rewrite → `/driver/dashboard` |
| `/driver/dashboard` | Driver | ✅ Supabase | `src/app/driver/dashboard/page.tsx` |

---

## 6. HOST: www.entregou.food / entregou.food

**Público-alvo:** Visitantes (Landing page entregadores)

| Rota | Tipo | Auth | File Path |
|------|------|------|-----------|
| `/` | Público | ❌ | Passthrough → landing |

---

## 7. HOST: www.pensou.food / pensou.food

**Público-alvo:** Visitantes (Futuro: Discover)

| Rota | Tipo | Auth | File Path |
|------|------|------|-----------|
| `/` | Público | ❌ | Passthrough (futuro: /discover) |

---

## DELIVERY MODULE

### Rotas Relacionadas

| Rota | Host | Público | File Path |
|------|------|---------|-----------|
| `/[slug]/dashboard/delivery` | app.pediu.food | Lojista | `src/app/[slug]/dashboard/delivery/page.tsx` |
| `/[slug]/avaliar/[deliveryId]` | app.pediu.food | Cliente | `src/app/[slug]/avaliar/[deliveryId]/page.tsx` |

### Componentes Auxiliares

| Componente | Path |
|------------|------|
| DeliveryHeader | `src/app/[slug]/dashboard/orders/delivery/components/DeliveryHeader.tsx` |
| DeliveryStats | `src/app/[slug]/dashboard/orders/delivery/components/DeliveryStats.tsx` |
| useDeliveryStats | `src/app/[slug]/dashboard/orders/delivery/hooks/useDeliveryStats.ts` |

### Funcionalidades (Lojista)
- ✅ CRUD motoristas
- ✅ Atribuir entrega a driver
- ✅ Workflow de status
- ✅ Métricas
- ✅ Realtime
- ✅ Link de rastreio
- ✅ Impressão de etiquetas
- ✅ Histórico por motorista

---

## DRIVER MODULE

### Rotas Relacionadas

| Rota | Host | Auth | File Path | Status |
|------|------|------|-----------|--------|
| `/driver/dashboard` | driver.entregou.food | Supabase | `src/app/driver/dashboard/page.tsx` | ⚠️ Parcial |
| `/[slug]/motorista` | app.pediu.food | Telefone | `src/app/[slug]/motorista/page.tsx` | ✅ Completo |

### Módulo Unificado (src/modules/driver/)

```
src/modules/driver/
├── types.ts                    # Tipos compartilhados
├── repository.ts               # Queries ao Supabase
├── index.ts                    # Barrel export
├── hooks/
│   ├── useDriverDeliveries.ts  # Hook para deliveries
│   ├── useDriverStats.ts       # Hook para stats
│   └── useDriverRealtime.ts    # Hook para realtime
└── components/
    ├── DriverDashboardShell.tsx # Shell principal
    └── tabs/
        ├── DeliveriesTab.tsx    # Tab entregas
        ├── HistoryTab.tsx       # Tab histórico
        ├── EarningsTab.tsx      # Tab ganhos
        └── AffiliatesTab.tsx    # Tab afiliados
```

### Funcionalidades Driver

| Feature | /[slug]/motorista | /driver/dashboard |
|---------|-------------------|-------------------|
| Login por telefone | ✅ | ❌ (usa Supabase) |
| Seletor de store | ❌ (slug) | ✅ (dropdown) |
| Stats reais | ✅ | ✅ (após unificação) |
| Lista entregas | ✅ | ✅ (após unificação) |
| Mudar status | ✅ | ✅ (após unificação) |
| Histórico | ✅ | ✅ (após unificação) |
| Ganhos | ✅ | ✅ (após unificação) |
| Afiliados | ❌ | ✅ |
| Maps navegação | ✅ | ✅ (após unificação) |
| Realtime | ✅ | ✅ (após unificação) |

---

## API ROUTES

| Rota | Método | Auth | File Path |
|------|--------|------|-----------|
| `/api/ping` | GET | ❌ | `src/app/api/ping/route.ts` |
| `/api/cron/clean-expired-drafts` | GET | CRON_SECRET | `src/app/api/cron/clean-expired-drafts/route.ts` |
| `/api/draft-store/*` | GET/POST | ✅ | `src/app/api/draft-store/*/route.ts` |
| `/api/onboarding/*` | Vários | Vários | `src/app/api/onboarding/*/route.ts` |
| `/api/public/*` | GET | ❌ | `src/app/api/public/*/route.ts` |
| `/api/webhooks/*` | POST | Webhook | `src/app/api/webhooks/*/route.ts` |

---

## BILLING PAGES

| Rota | Tipo | File Path |
|------|------|-----------|
| `/billing/trial-expired` | Público | `src/app/billing/trial-expired/page.tsx` |
| `/billing/suspended` | Público | `src/app/billing/suspended/page.tsx` |
| `/billing/overdue` | Público | `src/app/billing/overdue/page.tsx` |
