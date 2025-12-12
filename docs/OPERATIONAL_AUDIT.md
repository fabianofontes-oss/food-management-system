# 🔍 Auditoria de Telas Operacionais

**Data:** 2025-12-12  
**Objetivo:** Identificar funcionalidades existentes e faltantes nas telas operacionais

---

## 📋 RESUMO EXECUTIVO

### ✅ Já Implementado (Não Duplicar)
- Payment method e payment status visíveis em Orders
- Badges de payment method e status em Orders
- Filtro de payment status em Orders (lógica implementada)
- Função markAsPaid() em Orders
- Modal de detalhes com seção de pagamento em Orders
- Payment status visível em Kitchen (badges adicionados)
- Payment status visível em Delivery (filtro implementado)

### ❌ Faltando (Implementar)
- **UI do filtro de payment status em Orders** (botão/seletor visual)
- **Contador de pagamentos pendentes em Orders** (badge no header)
- **Late orders indicator em Kitchen** (badge, contador, filtro)
- **Late deliveries indicator em Delivery** (badge, contador, filtro)

---

## 🔍 AUDITORIA DETALHADA

### A) Orders Page (`/[slug]/dashboard/orders/page.tsx`)

#### ✅ Payment Status - JÁ EXISTE

**Visualização:**
- ✅ Badge de payment method na lista (linha 453-455)
- ✅ Badge de payment status na lista (linha 456-458)
- ✅ Seção de pagamento no modal de detalhes (linha 533-562)
- ✅ Botão "Marcar como Pago" (linha 565-570)

**Lógica:**
- ✅ `getPaymentMethodLabel()` - linha 141-149
- ✅ `getPaymentStatusLabel()` - linha 151-158
- ✅ `getPaymentStatusColor()` - linha 160-167
- ✅ `markAsPaid()` - linha 169-197
- ✅ `pendingPaymentsCount` calculado - linha 72-78
- ✅ `paymentFilter` state - linha 30
- ✅ `matchPayment` no filtro - linha 89-91

**❌ FALTANDO:**
- UI do filtro de payment status (botão/seletor)
- Contador visual "Pagamentos Pendentes: X" no header
- Botão de filtro rápido "Mostrar Pendentes"

**Código Existente:**
```typescript
// Linha 72-78: Cálculo já implementado
const pendingPaymentsCount = orders.filter(order => {
  const orderDate = new Date(order.created_at)
  const now = new Date()
  const hoursDiff = (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60)
  return (order.payment_status === 'pending' || !order.payment_status) && hoursDiff <= 48
}).length

// Linha 89-91: Filtro já implementado
const matchPayment = paymentFilter === 'all' || 
  (paymentFilter === 'pending' && (order.payment_status === 'pending' || !order.payment_status)) ||
  (paymentFilter === 'paid' && order.payment_status === 'paid')
```

---

### B) Kitchen Page (`/[slug]/dashboard/kitchen/page.tsx`)

#### ✅ Payment Status - JÁ EXISTE

**Visualização:**
- ✅ Badge de payment method nos cards (linha 427-429)
- ✅ Badge de payment status nos cards (linha 430-432)

**Funções:**
- ✅ `getPaymentMethodLabel()` - linha 240-248
- ✅ `getPaymentStatusLabel()` - linha 251-258
- ✅ `getPaymentStatusColor()` - linha 260-267
- ✅ `filterByPaymentStatus()` - linha 274-277

**❌ FALTANDO:**
- **Late orders indicator** (nenhum código encontrado)
- Cálculo de pedidos atrasados (> 30 min)
- Badge "Atrasado" nos cards
- Contador "Pedidos Atrasados: X"
- Filtro "Todos / Apenas Atrasados"

**Threshold Sugerido:**
- LATE_MINUTES = 30 (constante, sem settings por enquanto)
- Aplicar a: `status in ['confirmed', 'preparing']`

---

### C) Delivery Page (`/[slug]/dashboard/delivery/page.tsx`)

#### ✅ Payment Status - JÁ EXISTE

**Funções:**
- ✅ `getPaymentMethodLabel()` - linha 243-251
- ✅ `getPaymentStatusLabel()` - linha 254-261
- ✅ `getPaymentStatusColor()` - linha 263-270
- ✅ `filterByPaymentStatus()` - linha 274-277

**❌ FALTANDO:**
- **Late deliveries indicator** (nenhum código encontrado)
- Cálculo de entregas atrasadas (> 45 min)
- Badge "Atrasado" nos cards
- Contador "Entregas Atrasadas: X"
- Filtro "Todos / Apenas Atrasados"

**Threshold Sugerido:**
- LATE_DELIVERY_MINUTES = 45
- Aplicar a: `status in ['assigned', 'picked_up', 'in_transit']`

---

## 📝 PLANO DE IMPLEMENTAÇÃO

### 1. Orders Page - Completar UI ✅ PARCIAL

**Adicionar:**
```typescript
// No header, após KPIs
{pendingPaymentsCount > 0 && (
  <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3">
    <div className="flex items-center gap-2">
      <AlertCircle className="w-5 h-5 text-yellow-700" />
      <span className="font-medium text-yellow-900">
        Pagamentos Pendentes: {pendingPaymentsCount}
      </span>
      <Button
        onClick={() => setPaymentFilter('pending')}
        size="sm"
        className="ml-auto"
      >
        Filtrar Pendentes
      </Button>
    </div>
  </div>
)}
```

### 2. Kitchen Page - Late Orders 🔴 NOVO

**Adicionar:**
```typescript
const LATE_MINUTES = 30

const lateOrders = orders.filter(order => {
  if (!['confirmed', 'preparing'].includes(order.status)) return false
  const minutes = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000)
  return minutes > LATE_MINUTES
})

const lateOrdersCount = lateOrders.length
```

**UI:**
- Contador no header
- Badge "Atrasado" nos cards late
- Filtro "Todos / Apenas Atrasados"

### 3. Delivery Page - Late Deliveries 🔴 NOVO

**Adicionar:**
```typescript
const LATE_DELIVERY_MINUTES = 45

const lateDeliveries = deliveries.filter(delivery => {
  if (!['assigned', 'picked_up', 'in_transit'].includes(delivery.status)) return false
  const minutes = Math.floor((Date.now() - new Date(delivery.created_at).getTime()) / 60000)
  return minutes > LATE_DELIVERY_MINUTES
})

const lateDeliveriesCount = lateDeliveries.length
```

**UI:**
- Contador no header
- Badge "Atrasado" nos cards late
- Filtro "Todos / Apenas Atrasados"

---

## 🎯 MUDANÇAS MÍNIMAS NECESSÁRIAS

### Orders (3 adições)
1. Contador visual de pendentes no header
2. Botão de filtro rápido
3. Seletor de payment filter nos filtros existentes

### Kitchen (5 adições)
1. Constante LATE_MINUTES
2. Cálculo de lateOrdersCount
3. Contador no header
4. Badge "Atrasado" nos cards
5. Filtro late/all

### Delivery (5 adições)
1. Constante LATE_DELIVERY_MINUTES
2. Cálculo de lateDeliveriesCount
3. Contador no header
4. Badge "Atrasado" nos cards
5. Filtro late/all

---

## ✅ CONCLUSÃO

**Total de Funcionalidades:**
- ✅ Existentes: 15 (não duplicar)
- ❌ Faltantes: 13 (implementar)

**Esforço Estimado:**
- Orders: ~30 linhas
- Kitchen: ~80 linhas
- Delivery: ~80 linhas
- **Total: ~190 linhas** (minimal changes)

**Sem Necessidade de:**
- ❌ Novas rotas
- ❌ Novas tabelas
- ❌ Refatoração
- ❌ Push notifications
- ❌ Realtime subscriptions

**Apenas:**
- ✅ UI additions (badges, counters, filters)
- ✅ Client-side calculations
- ✅ Existing patterns
