# GUIA DE IMPLEMENTAÇÃO - REGRAS DE NEGÓCIO DELIVERY

**Data:** 2025-12-20  
**Status:** ✅ Backend pronto | ⚠️ Frontend pendente

---

## 📦 O QUE FOI IMPLEMENTADO

### 1. Migration SQL (`20251220000006_delivery_rating_token_autoassign.sql`)

#### ✅ Trigger: Média de Avaliação Automática
```sql
-- Function: update_driver_rating_avg()
-- Trigger: trg_deliveries_update_driver_rating
```
**Como funciona:**
- Dispara após INSERT/UPDATE de `deliveries.driver_rating`
- Recalcula média de todos os ratings do motorista
- Atualiza `drivers.rating` automaticamente

**Exemplo:**
```sql
-- Cliente avalia entrega com 4 estrelas
UPDATE deliveries SET driver_rating = 4 WHERE id = '...';
-- Trigger recalcula média e atualiza drivers.rating
```

---

#### ✅ Coluna: Token de Segurança
```sql
ALTER TABLE deliveries ADD COLUMN access_token uuid DEFAULT gen_random_uuid();
```
**Como funciona:**
- Cada entrega ganha um token UUID único
- Links públicos devem incluir: `?token=[access_token]`
- Impede acesso não autorizado

**Exemplo de link seguro:**
```
https://app.com/loja/confirmar/abc-123?token=def-456
```

---

#### ✅ Function SQL: Motoristas Disponíveis
```sql
-- Function: get_available_drivers(p_store_id uuid)
```
**Como funciona:**
- Retorna motoristas com turno ativo (`driver_shifts.status = 'active'`)
- Filtra por `is_available = true` e `is_active = true`
- Ordena por menos entregas em andamento
- Usado pela auto-atribuição

---

### 2. Server Actions (`src/modules/delivery/actions.ts`)

#### ✅ `validateDeliveryToken(deliveryId, token)`
**Uso:** Páginas de confirmação e avaliação

```typescript
import { validateDeliveryToken } from '@/modules/delivery'

// No componente da página
const token = searchParams.get('token')
const result = await validateDeliveryToken(deliveryId, token)

if (!result.valid) {
  // Exibir erro: "Link inválido ou expirado"
}
```

---

#### ✅ `autoAssignDriver(storeId, orderId)`
**Uso:** Dashboard do lojista ou webhook de novo pedido

```typescript
import { autoAssignDriver } from '@/modules/delivery'

// Após criar pedido/entrega
const result = await autoAssignDriver(storeId, orderId)

if (result.success) {
  console.log(`Motorista atribuído: ${result.driverName}`)
} else {
  console.log(`Erro: ${result.error}`)
}
```

---

## 🔧 O QUE PRECISA SER FEITO (Frontend)

### 1. Atualizar Página de Confirmação (`/[slug]/confirmar/[deliveryId]`)

**Antes:**
```typescript
// Qualquer um com o link podia confirmar
const { data } = await supabase
  .from('deliveries')
  .select('*')
  .eq('id', deliveryId)
  .single()
```

**Depois:**
```typescript
'use client'
import { validateDeliveryToken } from '@/modules/delivery'
import { useSearchParams } from 'next/navigation'

export default function ConfirmarPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  useEffect(() => {
    async function validate() {
      if (!token) {
        setError('Link inválido')
        return
      }
      
      const result = await validateDeliveryToken(deliveryId, token)
      
      if (!result.valid) {
        setError(result.error || 'Link inválido')
        return
      }
      
      setDelivery(result.delivery)
    }
    
    validate()
  }, [deliveryId, token])
  
  // ... resto do código
}
```

---

### 2. Atualizar Página de Avaliação (`/[slug]/avaliar/[deliveryId]`)

**Mesma lógica da confirmação:**
- Validar token antes de exibir formulário
- Bloquear se token inválido
- Bloquear se já foi avaliado (`rated_at IS NOT NULL`)

---

### 3. Atualizar Geração de Links (Motorista)

**Antes:**
```typescript
const confirmLink = `/${slug}/confirmar/${deliveryId}`
const ratingLink = `/${slug}/avaliar/${deliveryId}`
```

**Depois:**
```typescript
// Buscar access_token da entrega
const { data: delivery } = await supabase
  .from('deliveries')
  .select('access_token')
  .eq('id', deliveryId)
  .single()

const confirmLink = `/${slug}/confirmar/${deliveryId}?token=${delivery.access_token}`
const ratingLink = `/${slug}/avaliar/${deliveryId}?token=${delivery.access_token}`
```

**Onde atualizar:**
- `src/modules/driver/actions.ts` (função `getCustomerNotificationMessage`)
- `src/modules/driver/components/DeliveryQRCode.tsx` (se exibir link)
- `src/app/[slug]/dashboard/delivery/page.tsx` (função `generateTrackingLink`)

---

### 4. Implementar Auto-Atribuição no Dashboard

**Opção A: Botão manual**
```typescript
// No dashboard do lojista
async function handleAutoAssign(orderId: string) {
  const result = await autoAssignDriver(storeId, orderId)
  
  if (result.success) {
    toast.success(`Motorista ${result.driverName} atribuído!`)
    await fetchDeliveries() // Refresh
  } else {
    toast.error(result.error)
  }
}

// UI
<Button onClick={() => handleAutoAssign(order.id)}>
  Auto-Atribuir Motorista
</Button>
```

**Opção B: Automático (se `auto_assign_orders = true`)**
```typescript
// Após criar entrega
const settings = await getDeliverySettings(storeId)

if (settings?.auto_assign_orders) {
  await autoAssignDriver(storeId, orderId)
}
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Backend (✅ Completo)
- [x] Migration criada
- [x] Trigger de rating automático
- [x] Coluna `access_token`
- [x] Function SQL `get_available_drivers`
- [x] Server Action `validateDeliveryToken`
- [x] Server Action `autoAssignDriver`

### Frontend (⚠️ Pendente)
- [ ] Atualizar `/[slug]/confirmar/[deliveryId]` com validação de token
- [ ] Atualizar `/[slug]/avaliar/[deliveryId]` com validação de token
- [ ] Atualizar geração de links (incluir `?token=...`)
- [ ] Adicionar botão "Auto-Atribuir" no dashboard
- [ ] (Opcional) Implementar auto-atribuição automática

### Testes (⚠️ Pendente)
- [ ] Rodar migration no Supabase
- [ ] Testar trigger de rating (avaliar entrega → verificar `drivers.rating`)
- [ ] Testar validação de token (link sem token → erro)
- [ ] Testar auto-atribuição (motorista online → atribuído)

---

## 🚀 PRÓXIMOS PASSOS

1. **Rodar migration no Supabase:**
   ```bash
   # Via Supabase CLI ou Dashboard
   supabase migration up
   ```

2. **Atualizar páginas de confirmação/avaliação** (usar exemplo acima)

3. **Atualizar geração de links** (incluir token)

4. **Testar fluxo completo:**
   - Motorista marca "Entregar" → gera link com token
   - Cliente clica no link → valida token → confirma
   - Cliente avalia → trigger atualiza `drivers.rating`

5. **Implementar auto-atribuição** (botão ou automático)

---

## 📚 REFERÊNCIAS

- **Migration:** `supabase/migrations/20251220000006_delivery_rating_token_autoassign.sql`
- **Actions:** `src/modules/delivery/actions.ts`
- **Repository:** `src/modules/delivery/repository.ts`
- **Types:** `src/modules/delivery/types.ts`

---

## ⚠️ NOTAS IMPORTANTES

1. **Token é obrigatório:** Sem token, links públicos não funcionam (segurança).
2. **Trigger é automático:** Não precisa chamar nada, só avaliar a entrega.
3. **Auto-atribuição depende de turnos:** Motorista precisa estar com `driver_shifts.status = 'active'`.
4. **RLS está configurado:** Policies permitem leitura pública (validação no app layer).

---

**Status:** Backend 100% pronto. Frontend precisa de 4 ajustes (páginas + links).
