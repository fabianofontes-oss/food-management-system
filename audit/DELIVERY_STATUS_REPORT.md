# AUDITORIA ZERO TRUST - MÓDULO DELIVERY + DRIVER
**Data:** 2024-12-20 01:10  
**Branch:** main  
**Commit:** 831fdb6  
**Build:** ✅ PASS (79 páginas estáticas)

## 🆕 ATUALIZAÇÕES RECENTES

### Commit 76bdb19 - Complete Delivery Module
- ✅ Página de rastreio ao vivo `/[slug]/rastreio/[deliveryId]`
- ✅ Foto de comprovação de entrega (DeliveryProofCapture)
- ✅ Utils WhatsApp com mensagens pré-definidas
- ✅ Migration `delivery_proof_photo.sql`

### Commit 831fdb6 - Driver Actions + Rating
- ✅ Server Actions para notificações (`actions.ts`)
- ✅ Sistema de avaliação direto na tabela `deliveries`
- ✅ Cálculo automático de rating médio do motorista

---

## 1. INVENTÁRIO DE ROTAS

### 1.1 Rotas Encontradas

| ROTA | FILE PATH | HOST | RESPONSÁVEL | STATUS | DEPENDÊNCIAS |
|------|-----------|------|-------------|--------|--------------|
| `/[slug]/dashboard/delivery` | `src/app/[slug]/dashboard/delivery/page.tsx` | app.pediu.food | merchant | ✅ REAL | drivers, deliveries, orders |
| `/[slug]/motorista` | `src/app/[slug]/motorista/page.tsx` | app.pediu.food | driver | ✅ REAL | drivers, deliveries, orders |
| `/driver/dashboard` | `src/app/driver/dashboard/page.tsx` | driver.entregou.food | driver | ⚠️ PARCIAL | store_users, referral_* |
| `/[slug]/avaliar/[deliveryId]` | `src/app/[slug]/avaliar/[deliveryId]/page.tsx` | app.pediu.food | customer | ✅ REAL | deliveries, driver_ratings |
| `/[slug]/dashboard/orders/delivery/*` | `src/app/[slug]/dashboard/orders/delivery/` | app.pediu.food | merchant | ✅ REAL | componentes auxiliares |

### 1.2 Host Routing (middleware.ts)

```typescript
// Linhas 70-74
if (host === 'driver.entregou.food') {
  if (url.pathname === '/') {
    url.pathname = '/driver/dashboard'
    return NextResponse.rewrite(url)
  }
}
```

**Evidência:** `src/middleware.ts:70-74`

---

## 2. COMPARAÇÃO: /[slug]/motorista vs /driver/dashboard

### 2.1 Página TOP: `/[slug]/motorista/page.tsx` (622 linhas)

| FEATURE | STATUS | EVIDÊNCIA (linha) |
|---------|--------|-------------------|
| Login por telefone | ✅ REAL | L80-128 `handleLogin()` |
| Query drivers por telefone | ✅ REAL | L89-94 `.eq('phone', driverPhone)` |
| Query deliveries por driver_name | ✅ REAL | L130-136 `.eq('driver_name', name)` |
| Stats reais (hoje/semana/total) | ✅ REAL | L231-256 `calculateStats()` |
| Lista entregas pendentes | ✅ REAL | L453-530 renderização condicional |
| Mudar status (coletei/saí/entreguei) | ✅ REAL | L258-269 `updateStatus()` |
| Botão Google Maps navegação | ✅ REAL | L517-524 `google.com/maps/search` |
| Histórico de entregas | ✅ REAL | L533-562 tab 'history' |
| Tab de ganhos/comissões | ✅ REAL | L565-616 tab 'earnings' |
| Realtime subscriptions | ✅ REAL | L154-183 `supabase.channel()` |
| Notificações sonoras | ✅ REAL | L185-229 `playNotificationSound()` |
| Indicador realtime | ✅ REAL | L367-370 `isRealtimeConnected` |

### 2.2 Página Simples: `/driver/dashboard/page.tsx` (411 linhas)

| FEATURE | STATUS | EVIDÊNCIA (linha) |
|---------|--------|-------------------|
| Auth via Supabase user | ✅ REAL | L57-61 `auth.getUser()` |
| Query lojas vinculadas | ✅ REAL | L64-74 `store_users` DRIVER |
| Stats de entregas | ⚠️ MOCK | L119-125 valores hardcoded 0 |
| Lista entregas pendentes | ⚠️ MOCK | L273-278 sempre vazio |
| Tab afiliados | ✅ REAL | L283-405 referral_partners/codes/sales |
| Histórico de entregas | ❌ AUSENTE | - |
| Ganhos/comissões | ❌ AUSENTE | - |
| Mudar status | ❌ AUSENTE | - |
| Mapa/navegação | ❌ AUSENTE | - |
| Realtime | ❌ AUSENTE | - |

### 2.3 VEREDICTO

| Critério | /[slug]/motorista | /driver/dashboard |
|----------|-------------------|-------------------|
| **Completude** | 95% | 30% |
| **Uso real** | ✅ Operacional | ⚠️ Afiliados only |
| **Mobile-first** | ✅ | ✅ |
| **Recomendação** | **FONTE PRINCIPAL** | Redirecionar ou unificar |

---

## 3. AUDIT DELIVERY DO LOJISTA (MERCHANT)

### 3.1 Rota Principal: `/[slug]/dashboard/delivery/page.tsx` (1362 linhas)

| FUNCIONALIDADE | STATUS | EVIDÊNCIA |
|----------------|--------|-----------|
| **CRUD Motoristas** | | |
| Criar driver | ✅ REAL | L330-360 `createDriver()` |
| Editar driver | ✅ REAL | L362-393 `updateDriver()` |
| Excluir driver | ✅ REAL | L395-414 `deleteDriver()` |
| Toggle disponibilidade | ✅ REAL | L416-432 `toggleDriverAvailability()` |
| **Gestão Entregas** | | |
| Listar deliveries | ✅ REAL | L127-157 `fetchDeliveries()` |
| Atribuir driver | ✅ REAL | L307-328 `assignDriver()` |
| Atualizar status | ✅ REAL | L292-305 `updateDeliveryStatus()` |
| Filtros (status/data/busca) | ✅ REAL | L525-535 `filteredDeliveries` |
| **Workflow Statuses** | ✅ REAL | L10-16 interface Delivery |
| pending → assigned → picked_up → in_transit → delivered | ✅ | L800-826 botões condicionais |
| **Métricas** | ✅ REAL | L537-553 `stats` e `metrics` |
| **Realtime** | ✅ REAL | L175-202 `setupRealtimeSubscription()` |
| **Notificações** | ✅ REAL | L204-224 browser + som |
| **Link Rastreio** | ✅ REAL | L477-492 `generateTrackingLink()` |
| **Impressão Etiquetas** | ✅ REAL | L494-523 `printDelivery()` |
| **Histórico por Motorista** | ✅ REAL | L448-467 `fetchDriverHistory()` |
| **Comissões Calculadas** | ✅ REAL | L470-475 `calculateDriverEarnings()` |

### 3.2 Componentes Auxiliares

| COMPONENTE | PATH | FUNÇÃO |
|------------|------|--------|
| DeliveryHeader | `src/app/[slug]/dashboard/orders/delivery/components/DeliveryHeader.tsx` | Header de seção |
| DeliveryStats | `src/app/[slug]/dashboard/orders/delivery/components/DeliveryStats.tsx` | Cards de métricas |
| useDeliveryStats | `src/app/[slug]/dashboard/orders/delivery/hooks/useDeliveryStats.ts` | Hook de dados |

---

## 4. AUTORIZAÇÃO E PERMISSÕES

### 4.1 SuperAdmin - Controles de Driver

| AÇÃO | ONDE | STATUS |
|------|------|--------|
| Ver total de drivers | `/admin/demanda` L91 | ✅ Implementado |
| Toggle "Motoristas Globais" | `/admin/demanda` L439-462 | ✅ Implementado |
| Toggle "Realtime GPS" | `/admin/demanda` L320-360 | ✅ Implementado |
| Aprovar motorista individual | - | ❌ NÃO ENCONTRADO |
| Gerenciar motoristas global | - | ❌ NÃO ENCONTRADO |

**Busca realizada:**
```
grep -r "approve|approval|authorized|is_approved|driver_status" src/
```
**Resultado:** Nenhum sistema de aprovação de motorista implementado.

### 4.2 Lojista - Permissões

| AÇÃO | QUEM PODE | VALIDAÇÃO | ONDE |
|------|-----------|-----------|------|
| Criar driver | Lojista (store_id) | RLS | delivery/page.tsx L330 |
| Editar driver | Lojista (store_id) | RLS | delivery/page.tsx L362 |
| Atribuir entrega | Lojista (store_id) | RLS | delivery/page.tsx L307 |
| Ver entregas | Lojista (store_id) | RLS | delivery/page.tsx L127 |

---

## 5. TABELAS E RELAÇÕES

### 5.1 Tabelas Identificadas

| TABELA | CAMPOS-CHAVE | MIGRATION |
|--------|--------------|-----------|
| `drivers` | id, tenant_id, store_id, name, phone, commission_percent, is_active, rating | 20241214000003 |
| `deliveries` | id, store_id, order_id, driver_id, driver_name, status, delivery_fee, address | 20241214000003 |
| `driver_ratings` | id, driver_id, store_id, delivery_id, rating, comment | 20241214000014 |

### 5.2 Schema: drivers

```sql
-- supabase/migrations/20241214000003_03_drivers_commission.sql:24-42
CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  store_id UUID NOT NULL REFERENCES stores(id),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  vehicle_type VARCHAR(20),
  vehicle_plate VARCHAR(20),
  is_available BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  total_deliveries INTEGER DEFAULT 0,
  rating DECIMAL(2,1) DEFAULT 5.0,
  commission_percent INTEGER DEFAULT 10,
  total_earnings DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.3 Schema: deliveries

```sql
-- supabase/migrations/20241214000003_03_drivers_commission.sql:6-21
CREATE TABLE IF NOT EXISTS deliveries (
  id UUID PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id),
  order_id UUID NOT NULL REFERENCES orders(id),
  driver_id UUID REFERENCES drivers(id),
  driver_name VARCHAR(100),
  driver_phone VARCHAR(20),
  status VARCHAR(20) DEFAULT 'pending',
  estimated_time INTEGER DEFAULT 30,
  actual_delivery_time TIMESTAMPTZ,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  address TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.4 Schema: driver_ratings

```sql
-- supabase/migrations/20241214000014_14_system_settings.sql:39-48
CREATE TABLE IF NOT EXISTS driver_ratings (
  id UUID PRIMARY KEY,
  driver_id UUID REFERENCES drivers(id),
  store_id UUID NOT NULL REFERENCES stores(id),
  delivery_id UUID REFERENCES deliveries(id),
  order_id UUID REFERENCES orders(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  rated_by VARCHAR(20) DEFAULT 'customer',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.5 RLS Policies

| TABELA | POLICY | TIPO |
|--------|--------|------|
| drivers | drivers_all | PERMISSIVO (true) |
| deliveries | deliveries_all | PERMISSIVO (true) |
| driver_ratings | driver_ratings_all | PERMISSIVO (true) |

**⚠️ RISCO:** Policies são muito permissivas (USING true). Recomenda-se restringir por tenant/store.

---

## 6. DUPLICIDADE IDENTIFICADA

### 6.1 Problema

Existem **2 páginas de driver** com propósitos diferentes:

| Página | URL | Auth | Funcionalidade |
|--------|-----|------|----------------|
| `/[slug]/motorista` | `/{loja}/motorista` | Telefone | Entregas completa |
| `/driver/dashboard` | `driver.entregou.food` | Supabase Auth | Afiliados + stub entregas |

### 6.2 Causa

- `/[slug]/motorista` foi criada primeiro, completa, para acesso via loja
- `/driver/dashboard` foi criada depois para domínio dedicado, mas ficou incompleta

### 6.3 Impacto

- **Confusão:** Dois pontos de entrada diferentes
- **Manutenção:** Código duplicado, features divergentes
- **UX:** Driver não sabe qual usar

---

## 7. RESUMO EXECUTIVO

### Completude por Módulo

| MÓDULO | % COMPLETO | NOTAS |
|--------|------------|-------|
| **Delivery (Merchant)** | **95%** | Praticamente completo, apenas RLS a melhorar |
| **Driver (/motorista)** | **95%** | Completo, login por telefone |
| **Driver (/driver/dashboard)** | **30%** | Só afiliados funciona, resto mock |
| **Avaliação Entrega** | **100%** | Completo e funcional |
| **SuperAdmin Drivers** | **20%** | Só métricas e toggles globais |

### O que está REAL vs MOCK

| ITEM | STATUS |
|------|--------|
| CRUD drivers (merchant) | ✅ REAL |
| Atribuir entrega | ✅ REAL |
| Workflow statuses | ✅ REAL |
| Métricas delivery | ✅ REAL |
| Driver aceitar entrega | ✅ REAL (via /motorista) |
| Driver mudar status | ✅ REAL (via /motorista) |
| Driver histórico | ✅ REAL (via /motorista) |
| Driver ganhos | ✅ REAL (via /motorista) |
| Driver afiliados | ✅ REAL (via /driver/dashboard) |
| Driver entregas (/driver/dashboard) | ⚠️ MOCK |
| Aprovar motorista (superadmin) | ❌ AUSENTE |
| Mapa rastreio tempo real | ❌ AUSENTE |

### Para "Driver MVP Operável"

Usando `/[slug]/motorista`:
- ✅ JÁ FUNCIONA
- Aceitar entrega, mudar status, histórico, ganhos

### Para "Merchant Delivery MVP Operável"

- ✅ JÁ FUNCIONA
- Criar/atribuir/monitorar entregas

### Ações Recomendadas

1. **Unificar** `/driver/dashboard` com features de `/motorista`
2. **Melhorar RLS** de drivers/deliveries (restringir por store)
3. **Criar** página SuperAdmin para aprovar motoristas (se necessário)
4. **Documentar** que `/[slug]/motorista` é a versão operacional
