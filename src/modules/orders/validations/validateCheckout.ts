/**
 * Validação centralizada do checkout.
 * 
 * Aplica todas as regras de negócio antes de criar um pedido:
 * - Status da loja (aberta/fechada)
 * - Agendamento quando fechada
 * - Validação de itens e produtos
 * - Recálculo de totais (anti-tampering)
 * - Validação de delivery radius
 * - Validação de estoque (quando disponível)
 */

import { createClient } from '@/lib/supabase/server'
import { getStoreStatus, validateScheduledTime, combineDateAndTime } from '@/modules/store/utils/storeHours'
import type { BusinessHour } from '@/modules/store/types'
import type { Database } from '@/types/database'

// Tipos do banco
type ProductRow = Database['public']['Tables']['products']['Row']
type ModifierOptionRow = Database['public']['Tables']['modifier_options']['Row']

// ============================================
// TIPOS
// ============================================

export interface CheckoutItem {
  product_id: string
  quantity: number
  unit_price?: number
  modifiers?: {
    option_id: string
    extra_price?: number
  }[]
}

export interface CheckoutAddress {
  street: string
  number: string
  complement?: string
  district: string
  city: string
  state: string
  zip_code: string
  latitude?: number
  longitude?: number
}

export interface CheckoutPayload {
  storeId: string
  channel: 'COUNTER' | 'DELIVERY' | 'TAKEAWAY'
  items: CheckoutItem[]
  customer?: {
    name?: string
    phone?: string
    email?: string
  }
  address?: CheckoutAddress
  scheduledFor?: Date | null
  scheduledDate?: string | null
  scheduledTime?: string | null
  couponCode?: string
}

export interface ComputedTotals {
  subtotal: number
  deliveryFee: number
  discount: number
  total: number
  itemsBreakdown: {
    productId: string
    productName: string
    quantity: number
    unitPrice: number
    modifiersTotal: number
    lineTotal: number
  }[]
}

export interface ValidationSuccess {
  ok: true
  computedTotals: ComputedTotals
  normalizedScheduledFor: Date | null
  scheduledDate: string | null
  scheduledTime: string | null
  storeTimezone: string
}

export interface ValidationError {
  ok: false
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export type ValidationResult = ValidationSuccess | ValidationError

// ============================================
// CÓDIGOS DE ERRO
// ============================================

export const CheckoutErrorCodes = {
  STORE_NOT_FOUND: 'STORE_NOT_FOUND',
  STORE_CLOSED: 'STORE_CLOSED',
  SCHEDULING_REQUIRED: 'SCHEDULING_REQUIRED',
  SCHEDULE_INVALID: 'SCHEDULE_INVALID',
  INVALID_ITEMS: 'INVALID_ITEMS',
  OUT_OF_DELIVERY_AREA: 'OUT_OF_DELIVERY_AREA',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  MIN_ORDER_NOT_MET: 'MIN_ORDER_NOT_MET',
  DELIVERY_ADDRESS_REQUIRED: 'DELIVERY_ADDRESS_REQUIRED',
} as const

// ============================================
// VALIDAÇÃO PRINCIPAL
// ============================================

export async function validateCheckout(payload: CheckoutPayload): Promise<ValidationResult> {
  const supabase = await createClient()

  // 1. Buscar dados da loja
  const { data: store, error: storeError } = await supabase
    .from('stores')
    .select(`
      id,
      tenant_id,
      is_active,
      settings,
      latitude,
      longitude,
      scheduling_enabled,
      scheduling_min_hours,
      scheduling_max_days,
      scheduling_interval,
      tenants!inner(timezone)
    `)
    .eq('id', payload.storeId)
    .single()

  if (storeError || !store) {
    return {
      ok: false,
      error: {
        code: CheckoutErrorCodes.STORE_NOT_FOUND,
        message: 'Loja não encontrada',
      },
    }
  }

  const storeTimezone = (store.tenants as any)?.timezone || 'America/Sao_Paulo'
  const settings = store.settings as any || {}
  const businessHours: BusinessHour[] = settings.businessHours || []

  // 2. Verificar status da loja (aberta/fechada)
  const storeStatus = getStoreStatus(businessHours, storeTimezone)
  
  let normalizedScheduledFor: Date | null = null
  let scheduledDate: string | null = null
  let scheduledTime: string | null = null

  // 3. Lógica de loja fechada + agendamento
  if (!storeStatus.isOpen) {
    const schedulingEnabled = store.scheduling_enabled || false

    if (!schedulingEnabled) {
      return {
        ok: false,
        error: {
          code: CheckoutErrorCodes.STORE_CLOSED,
          message: storeStatus.nextOpenFormatted 
            ? `Loja fechada. Abrimos ${storeStatus.nextOpenFormatted}`
            : 'Loja fechada no momento',
          details: {
            nextOpenAt: storeStatus.nextOpenAt?.toISOString(),
            nextOpenFormatted: storeStatus.nextOpenFormatted,
          },
        },
      }
    }

    // Agendamento habilitado - exigir scheduled_for
    if (!payload.scheduledFor && !payload.scheduledDate) {
      return {
        ok: false,
        error: {
          code: CheckoutErrorCodes.SCHEDULING_REQUIRED,
          message: 'Loja fechada. Selecione um horário para agendamento.',
          details: {
            schedulingEnabled: true,
            nextOpenAt: storeStatus.nextOpenAt?.toISOString(),
          },
        },
      }
    }
  }

  // 4. Processar agendamento (se fornecido)
  if (payload.scheduledFor || payload.scheduledDate) {
    const prepTimeMinutes = (store.scheduling_min_hours || 2) * 60
    const maxDays = store.scheduling_max_days || 7
    const slotIntervalMinutes = store.scheduling_interval || 30

    // Converter date + time para Date se necessário
    if (payload.scheduledDate && payload.scheduledTime) {
      normalizedScheduledFor = combineDateAndTime(
        payload.scheduledDate,
        payload.scheduledTime,
        storeTimezone
      )
      scheduledDate = payload.scheduledDate
      scheduledTime = payload.scheduledTime
    } else if (payload.scheduledFor) {
      normalizedScheduledFor = payload.scheduledFor
      // Extrair date/time para o banco
      const { format } = await import('date-fns')
      const { toZonedTime } = await import('date-fns-tz')
      const zonedDate = toZonedTime(payload.scheduledFor, storeTimezone)
      scheduledDate = format(zonedDate, 'yyyy-MM-dd')
      scheduledTime = format(zonedDate, 'HH:mm')
    }

    if (normalizedScheduledFor) {
      const scheduleValidation = validateScheduledTime(
        normalizedScheduledFor,
        businessHours,
        {
          maxDays,
          slotIntervalMinutes,
          prepTimeMinutes,
          timezone: storeTimezone,
        }
      )

      if (!scheduleValidation.valid) {
        return {
          ok: false,
          error: {
            code: CheckoutErrorCodes.SCHEDULE_INVALID,
            message: scheduleValidation.error || 'Horário de agendamento inválido',
          },
        }
      }
    }
  }

  // 5. Validar endereço para DELIVERY
  if (payload.channel === 'DELIVERY') {
    if (!payload.address) {
      return {
        ok: false,
        error: {
          code: CheckoutErrorCodes.DELIVERY_ADDRESS_REQUIRED,
          message: 'Endereço de entrega é obrigatório',
        },
      }
    }

    // Validar raio de entrega (se lat/lng disponíveis)
    const deliverySettings = settings.sales?.delivery
    if (
      deliverySettings?.enabled &&
      deliverySettings?.radius &&
      store.latitude &&
      store.longitude &&
      payload.address.latitude &&
      payload.address.longitude
    ) {
      const distance = calculateDistance(
        store.latitude,
        store.longitude,
        payload.address.latitude,
        payload.address.longitude
      )

      if (distance > deliverySettings.radius) {
        return {
          ok: false,
          error: {
            code: CheckoutErrorCodes.OUT_OF_DELIVERY_AREA,
            message: `Endereço fora da área de entrega (${deliverySettings.radius}km)`,
            details: { distance, maxRadius: deliverySettings.radius },
          },
        }
      }
    }
  }

  // 6. Validar itens e recalcular totais
  const productIds = payload.items.map(i => i.product_id)
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, base_price, is_active, store_id, stock_quantity, track_inventory')
    .in('id', productIds)

  if (productsError || !products) {
    return {
      ok: false,
      error: {
        code: CheckoutErrorCodes.INVALID_ITEMS,
        message: 'Erro ao validar produtos',
      },
    }
  }

  const typedProducts = products as ProductRow[]
  const productMap = new Map(typedProducts.map(p => [p.id, p]))
  const invalidItems: { productId: string; reason: string }[] = []
  const itemsBreakdown: ComputedTotals['itemsBreakdown'] = []

  // Coletar todos os modifier_option_ids para buscar
  const allModifierIds = payload.items.flatMap(i => i.modifiers?.map(m => m.option_id) || [])
  let modifierMap = new Map<string, { extra_price: number; is_active: boolean }>()

  if (allModifierIds.length > 0) {
    const { data: modifiers } = await supabase
      .from('modifier_options')
      .select('id, extra_price, is_active')
      .in('id', allModifierIds)

    if (modifiers) {
      const typedModifiers = modifiers as ModifierOptionRow[]
      modifierMap = new Map(typedModifiers.map(m => [m.id, { extra_price: m.extra_price, is_active: m.is_active }]))
    }
  }

  for (const item of payload.items) {
    const product = productMap.get(item.product_id)

    if (!product) {
      invalidItems.push({ productId: item.product_id, reason: 'Produto não encontrado' })
      continue
    }

    if (!product.is_active) {
      invalidItems.push({ productId: item.product_id, reason: 'Produto indisponível' })
      continue
    }

    if (product.store_id !== payload.storeId) {
      invalidItems.push({ productId: item.product_id, reason: 'Produto de outra loja' })
      continue
    }

    // Verificar estoque (se track_inventory = true)
    if (product.track_inventory && product.stock_quantity !== null) {
      if (product.stock_quantity < item.quantity) {
        invalidItems.push({
          productId: item.product_id,
          reason: `Estoque insuficiente (disponível: ${product.stock_quantity})`,
        })
        continue
      }
    }

    // Calcular total dos modificadores
    let modifiersTotal = 0
    if (item.modifiers && item.modifiers.length > 0) {
      for (const mod of item.modifiers) {
        const modData = modifierMap.get(mod.option_id)
        if (modData && modData.is_active) {
          modifiersTotal += modData.extra_price
        }
      }
    }

    const unitPrice = product.base_price
    const lineTotal = (unitPrice + modifiersTotal) * item.quantity

    itemsBreakdown.push({
      productId: item.product_id,
      productName: product.name,
      quantity: item.quantity,
      unitPrice,
      modifiersTotal,
      lineTotal,
    })
  }

  if (invalidItems.length > 0) {
    return {
      ok: false,
      error: {
        code: CheckoutErrorCodes.INVALID_ITEMS,
        message: 'Alguns itens são inválidos',
        details: invalidItems,
      },
    }
  }

  // 7. Calcular totais
  const subtotal = itemsBreakdown.reduce((sum, i) => sum + i.lineTotal, 0)
  
  // Taxa de entrega
  let deliveryFee = 0
  if (payload.channel === 'DELIVERY') {
    const deliverySettings = settings.sales?.delivery
    if (deliverySettings?.fee) {
      deliveryFee = deliverySettings.fee
      // Frete grátis acima de X
      if (deliverySettings.freeAbove && subtotal >= deliverySettings.freeAbove) {
        deliveryFee = 0
      }
    }
  }

  // Pedido mínimo
  const minOrder = settings.sales?.delivery?.minOrder || 0
  if (payload.channel === 'DELIVERY' && subtotal < minOrder) {
    return {
      ok: false,
      error: {
        code: CheckoutErrorCodes.MIN_ORDER_NOT_MET,
        message: `Pedido mínimo para delivery: R$ ${minOrder.toFixed(2)}`,
        details: { subtotal, minOrder },
      },
    }
  }

  // TODO: Aplicar desconto de cupom (implementar quando necessário)
  const discount = 0

  const total = subtotal + deliveryFee - discount

  return {
    ok: true,
    computedTotals: {
      subtotal,
      deliveryFee,
      discount,
      total,
      itemsBreakdown,
    },
    normalizedScheduledFor,
    scheduledDate,
    scheduledTime,
    storeTimezone,
  }
}

// ============================================
// HELPERS
// ============================================

/**
 * Calcula distância entre duas coordenadas usando fórmula de Haversine
 * Retorna distância em km
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Raio da Terra em km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}
