# Validações de Negócio no Checkout/PDV

Este documento descreve as regras de validação implementadas no checkout e PDV do sistema.

## Visão Geral

O sistema implementa validações centralizadas no servidor para garantir a integridade dos pedidos, incluindo:

1. **Status da loja** (aberta/fechada)
2. **Agendamento** quando loja fechada
3. **Validação de itens e produtos**
4. **Recálculo de totais** (anti-tampering)
5. **Validação de raio de entrega**
6. **Validação de estoque**

---

## Configurações por Loja

### Campos na tabela `stores`

| Campo | Tipo | Default | Descrição |
|-------|------|---------|-----------|
| `scheduling_enabled` | boolean | false | Habilita agendamento de pedidos |
| `scheduling_min_hours` | integer | 4 | Antecedência mínima em horas |
| `scheduling_max_days` | integer | 7 | Máximo de dias no futuro |
| `scheduling_interval` | integer | 30 | Intervalo de slots em minutos |
| `scheduling_require_payment` | boolean | false | Exigir pagamento antecipado |
| `scheduling_max_per_slot` | integer | 0 | Máx pedidos por horário (0 = ilimitado) |

### Horários de funcionamento

Armazenados em `stores.settings.businessHours`:

```json
[
  { "day": "monday", "name": "Seg", "enabled": true, "open": "08:00", "close": "22:00" },
  { "day": "tuesday", "name": "Ter", "enabled": true, "open": "08:00", "close": "22:00" }
]
```

---

## Campos no Pedido

### Tabela `orders`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `scheduled_date` | DATE | Data agendada (nullable) |
| `scheduled_time` | TIME | Hora agendada (nullable) |
| `is_scheduled` | BOOLEAN | Se é pedido agendado |

**Decisão de design:** Mantemos `status = 'PENDING'` para pedidos agendados com `scheduled_for` preenchido, em vez de criar um status separado `SCHEDULED`. Isso simplifica o fluxo sem perder funcionalidade.

---

## Regras de Validação

### 1. Loja Aberta/Fechada

```typescript
const status = getStoreStatus(businessHours, timezone)

if (!status.isOpen) {
  if (!schedulingEnabled) {
    // BLOQUEIA: { code: 'STORE_CLOSED' }
  } else {
    // EXIGE scheduled_for no payload
  }
}
```

### 2. Agendamento Válido

Quando `scheduled_for` é fornecido:

- ✅ Deve ser >= `now + prepTimeMinutes`
- ✅ Deve ser <= `now + maxDays`
- ✅ Deve cair em um dia que a loja funciona
- ✅ Deve estar dentro do horário de funcionamento do dia
- ✅ Deve estar alinhado ao grid de intervalos (`slotIntervalMinutes`)

### 3. Validação de Delivery

Se `channel = 'DELIVERY'`:

- ✅ Endereço é obrigatório
- ✅ Se lat/lng disponíveis, verificar raio de entrega
- ✅ Pedido mínimo deve ser respeitado

### 4. Validação de Itens

Para cada item do carrinho:

- ✅ Produto existe
- ✅ `is_active = true`
- ✅ `store_id` correto (evita itens de outra loja)
- ✅ Estoque suficiente (se `track_inventory = true`)
- ✅ Modificadores válidos e ativos

### 5. Recálculo de Totais (Anti-tampering)

O servidor **SEMPRE** recalcula:

```typescript
subtotal = Σ (produto.base_price + modifiers_total) × quantity
deliveryFee = settings.sales.delivery.fee (se DELIVERY)
total = subtotal + deliveryFee - discount
```

O total enviado pelo client é **ignorado**.

---

## Códigos de Erro

| Código | Descrição |
|--------|-----------|
| `STORE_NOT_FOUND` | Loja não encontrada |
| `STORE_CLOSED` | Loja fechada e agendamento desabilitado |
| `SCHEDULING_REQUIRED` | Loja fechada, precisa agendar |
| `SCHEDULE_INVALID` | Horário de agendamento inválido |
| `INVALID_ITEMS` | Itens inválidos (inativo, outra loja, etc) |
| `OUT_OF_DELIVERY_AREA` | Endereço fora do raio de entrega |
| `OUT_OF_STOCK` | Estoque insuficiente |
| `MIN_ORDER_NOT_MET` | Pedido mínimo não atingido |
| `DELIVERY_ADDRESS_REQUIRED` | Endereço obrigatório para delivery |

---

## Arquivos Principais

| Arquivo | Descrição |
|---------|-----------|
| `src/modules/store/utils/storeHours.ts` | Utilitários de horário e slots |
| `src/modules/orders/validations/validateCheckout.ts` | Validação centralizada |
| `src/lib/actions/orders.ts` | Server Action de criação |
| `src/app/[slug]/checkout/components/SchedulingSelector.tsx` | UI de agendamento |
| `src/modules/store/components/public/store-status-banner.tsx` | Banner de loja fechada |

---

## Como Testar

### Cenários de Teste

| # | Cenário | Esperado |
|---|---------|----------|
| 1 | Loja aberta, pedido normal | ✅ Sucesso |
| 2 | Loja aberta, pedido agendado válido | ✅ Sucesso com scheduled_for |
| 3 | Loja fechada, scheduling OFF | ❌ STORE_CLOSED |
| 4 | Loja fechada, scheduling ON, sem data | ❌ SCHEDULING_REQUIRED |
| 5 | Loja fechada, scheduling ON, data válida | ✅ Sucesso |
| 6 | Loja fechada, scheduling ON, data inválida | ❌ SCHEDULE_INVALID |
| 7 | Delivery fora do raio | ❌ OUT_OF_DELIVERY_AREA |
| 8 | Produto inativo no carrinho | ❌ INVALID_ITEMS |

### Payload de Exemplo

```json
{
  "storeId": "uuid-da-loja",
  "channel": "DELIVERY",
  "items": [
    {
      "product_id": "uuid-produto",
      "quantity": 2,
      "modifiers": [
        { "option_id": "uuid-modificador" }
      ]
    }
  ],
  "customer": {
    "name": "João Silva",
    "phone": "11999999999"
  },
  "address": {
    "street": "Rua Exemplo",
    "number": "123",
    "district": "Centro",
    "city": "São Paulo",
    "state": "SP",
    "zip_code": "01234-000"
  },
  "scheduledDate": "2024-12-20",
  "scheduledTime": "14:30"
}
```

### Response de Sucesso

```json
{
  "ok": true,
  "computedTotals": {
    "subtotal": 45.90,
    "deliveryFee": 5.00,
    "discount": 0,
    "total": 50.90
  },
  "normalizedScheduledFor": "2024-12-20T17:30:00.000Z",
  "scheduledDate": "2024-12-20",
  "scheduledTime": "14:30"
}
```

### Response de Erro

```json
{
  "ok": false,
  "error": {
    "code": "STORE_CLOSED",
    "message": "Loja fechada. Abrimos amanhã às 08:00",
    "details": {
      "nextOpenAt": "2024-12-20T11:00:00.000Z",
      "nextOpenFormatted": "amanhã às 08:00"
    }
  }
}
```

---

## UI/UX

### Checkout

1. **Loja aberta:** Botão "Confirmar Pedido" habilitado
2. **Loja fechada + scheduling ON:** Mostra `SchedulingSelector` expandido, botão vira "Agendar Pedido"
3. **Loja fechada + scheduling OFF:** Botão desabilitado, mostra próximo horário

### Cardápio Público

1. Banner laranja no topo: "Estamos fechados no momento"
2. Se scheduling habilitado: botão "Agendar pedido" no banner
3. Exibe próximo horário de abertura

---

## Fluxo de Dados

```
[UI Checkout]
     │
     ▼
[validateAndSubmitOrder] ← serviço do checkout
     │
     ▼
[createOrder] ← Server Action
     │
     ├─► [validateCheckout] ← validação centralizada
     │         │
     │         ├─► getStoreStatus()
     │         ├─► validateScheduledTime()
     │         ├─► validateItems()
     │         └─► calculateTotals()
     │
     └─► [create_order_atomic] ← RPC do Supabase
```

---

## Considerações de Segurança

1. **Todas as validações são server-side** - nunca confie no client
2. **Totais sempre recalculados** - previne manipulação de preços
3. **Timezone da loja** - usa timezone do tenant para cálculos corretos
4. **Idempotência** - `idempotency_key` previne pedidos duplicados
5. **RLS** - Row Level Security garante acesso apenas a dados da própria loja
