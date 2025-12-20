# PLANO RECOMENDADO - UNIFICAÇÃO DRIVER + MELHORIAS DELIVERY
**Data:** 2024-12-20 00:15  
**Status:** Proposta

---

## 1. DECISÃO ARQUITETURAL

### Problema Atual
```
/[slug]/motorista     → Auth por telefone, 100% funcional
/driver/dashboard     → Auth Supabase, 30% funcional (só afiliados)
```

### Decisão Recomendada

**Fonte Única de Verdade:** Criar componente compartilhado

```
src/modules/driver/
├── components/
│   ├── DriverDashboardShell.tsx    # Layout base
│   ├── DeliveriesTab.tsx           # Tab entregas
│   ├── HistoryTab.tsx              # Tab histórico
│   ├── EarningsTab.tsx             # Tab ganhos
│   └── AffiliatesTab.tsx           # Tab afiliados
├── hooks/
│   ├── useDriverDeliveries.ts
│   ├── useDriverStats.ts
│   └── useDriverRealtime.ts
├── repository.ts
├── actions.ts
└── types.ts
```

### Rotas Finais

| Rota | Host | Auth | Componente |
|------|------|------|------------|
| `/driver/dashboard` | driver.entregou.food | Supabase User | DriverDashboardShell |
| `/[slug]/motorista` | *.pediu.food | Telefone (legacy) | Redirect ou wrapper |

---

## 2. PLANO DE MIGRAÇÃO

### Fase 1: Preparação (2h)

1. **Criar módulo** `src/modules/driver/`
2. **Extrair tipos** de `motorista/page.tsx` para `types.ts`
3. **Criar repository** com queries centralizadas

### Fase 2: Componentização (4h)

1. **Extrair** `DeliveriesTab` de `/motorista` (L453-530)
2. **Extrair** `HistoryTab` de `/motorista` (L533-562)
3. **Extrair** `EarningsTab` de `/motorista` (L565-616)
4. **Mover** `AffiliatesTab` de `/driver/dashboard` (L283-405)

### Fase 3: Unificação (3h)

1. **Criar** `DriverDashboardShell.tsx` com todas as tabs
2. **Refatorar** `/driver/dashboard/page.tsx` para usar Shell
3. **Refatorar** `/[slug]/motorista/page.tsx` para usar Shell
4. **Adaptar** auth baseado no contexto

### Fase 4: Testes (2h)

1. Testar fluxo `/driver/dashboard` (Supabase auth)
2. Testar fluxo `/[slug]/motorista` (telefone)
3. Testar realtime em ambos
4. Testar em mobile

---

## 3. CÓDIGO PROPOSTO

### 3.1 types.ts

```typescript
// src/modules/driver/types.ts

export interface Delivery {
  id: string
  status: 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled'
  driver_name: string | null
  driver_phone: string | null
  address: string
  estimated_time: number
  delivery_fee: number
  created_at: string
  order?: {
    order_code: string
    customer_name: string
    total_amount: number
  }
}

export interface DriverStats {
  todayDeliveries: number
  todayEarnings: number
  weekDeliveries: number
  weekEarnings: number
  totalDeliveries: number
  totalEarnings: number
  rating: number
}

export interface DriverContext {
  driverName: string
  driverPhone?: string
  userId?: string
  storeId: string
  commissionPercent: number
}
```

### 3.2 repository.ts

```typescript
// src/modules/driver/repository.ts

import { createClient } from '@/lib/supabase/client'
import type { Delivery, DriverStats } from './types'

export async function getDriverDeliveries(
  storeId: string,
  driverName: string
): Promise<Delivery[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('deliveries')
    .select(`*, order:orders(order_code, customer_name, total_amount)`)
    .eq('store_id', storeId)
    .eq('driver_name', driverName)
    .order('created_at', { ascending: false })
  
  return data || []
}

export async function updateDeliveryStatus(
  deliveryId: string,
  status: string
): Promise<void> {
  const supabase = createClient()
  await supabase
    .from('deliveries')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', deliveryId)
}

export function calculateStats(
  deliveries: Delivery[],
  commissionPercent: number
): DriverStats {
  const today = new Date().toDateString()
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const todayDelivs = deliveries.filter(
    d => new Date(d.created_at).toDateString() === today && d.status === 'delivered'
  )
  const weekDelivs = deliveries.filter(
    d => new Date(d.created_at) >= weekAgo && d.status === 'delivered'
  )
  const allDelivered = deliveries.filter(d => d.status === 'delivered')

  const calcEarnings = (delivs: Delivery[]) =>
    delivs.reduce((acc, d) => acc + ((d.delivery_fee || 0) * commissionPercent / 100), 0)

  return {
    todayDeliveries: todayDelivs.length,
    todayEarnings: calcEarnings(todayDelivs),
    weekDeliveries: weekDelivs.length,
    weekEarnings: calcEarnings(weekDelivs),
    totalDeliveries: allDelivered.length,
    totalEarnings: calcEarnings(allDelivered),
    rating: 4.8
  }
}
```

### 3.3 Hook com Realtime

```typescript
// src/modules/driver/hooks/useDriverRealtime.ts

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useDriverRealtime(
  storeId: string | null,
  driverName: string,
  onNewDelivery: () => void
) {
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!storeId || !driverName) return

    const supabase = createClient()
    const channel = supabase
      .channel('driver-deliveries')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deliveries',
          filter: `store_id=eq.${storeId}`
        },
        () => onNewDelivery()
      )
      .subscribe(status => setIsConnected(status === 'SUBSCRIBED'))

    return () => {
      supabase.removeChannel(channel)
    }
  }, [storeId, driverName, onNewDelivery])

  return { isConnected }
}
```

---

## 4. MELHORIAS DE SEGURANÇA (RLS)

### Policies Atuais (Problemáticas)

```sql
-- MUITO PERMISSIVO
CREATE POLICY "drivers_all" ON drivers FOR ALL USING (true);
CREATE POLICY "deliveries_all" ON deliveries FOR ALL USING (true);
```

### Policies Recomendadas

```sql
-- Drivers: apenas da mesma store ou tenant
DROP POLICY IF EXISTS "drivers_all" ON drivers;

CREATE POLICY "drivers_store_access" ON drivers FOR ALL
USING (
  store_id IN (
    SELECT store_id FROM store_users 
    WHERE user_id = auth.uid()
  )
);

-- Deliveries: apenas da mesma store
DROP POLICY IF EXISTS "deliveries_all" ON deliveries;

CREATE POLICY "deliveries_store_access" ON deliveries FOR ALL
USING (
  store_id IN (
    SELECT store_id FROM store_users 
    WHERE user_id = auth.uid()
  )
);

-- Driver ratings: público para leitura
CREATE POLICY "driver_ratings_read" ON driver_ratings FOR SELECT
USING (true);

CREATE POLICY "driver_ratings_insert" ON driver_ratings FOR INSERT
WITH CHECK (true);
```

---

## 5. CRONOGRAMA

| Semana | Atividade | Horas | Responsável |
|--------|-----------|-------|-------------|
| 1 | Fase 1 + 2 (módulo + componentes) | 6h | Dev |
| 1 | Fase 3 (unificação) | 3h | Dev |
| 2 | Fase 4 (testes) | 2h | QA |
| 2 | RLS improvements | 2h | Dev |
| 2 | Deploy + monitoramento | 1h | DevOps |

**Total:** ~14h (2-3 dias de trabalho)

---

## 6. RISCOS E MITIGAÇÕES

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Breaking change no auth | Média | Alto | Manter /motorista como fallback |
| Realtime não funciona | Baixa | Médio | Já funciona em /motorista, copiar |
| RLS quebra queries | Média | Alto | Testar em staging primeiro |
| Mobile não responsivo | Baixa | Médio | Usar mesmo CSS de /motorista |

---

## 7. DEFINIÇÃO DE PRONTO

### Para considerar "Driver Unificado" completo:

- [ ] `/driver/dashboard` tem todas as tabs funcionais
- [ ] Realtime funciona em `/driver/dashboard`
- [ ] Stats são reais (não mock)
- [ ] `/[slug]/motorista` redireciona ou reusa componentes
- [ ] RLS restritivo aplicado
- [ ] Testes em mobile passam
- [ ] Documentação atualizada

---

## 8. PRÓXIMOS PASSOS IMEDIATOS

1. **Hoje:** Aprovar este plano
2. **Amanhã:** Iniciar Fase 1 (criar módulo)
3. **Dia 3:** Completar Fase 2-3
4. **Dia 4:** Testes + RLS
5. **Dia 5:** Deploy

**Quer que eu inicie a implementação?**
