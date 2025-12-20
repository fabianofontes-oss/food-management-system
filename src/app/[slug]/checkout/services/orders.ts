import { getStoreBySlug } from '@/modules/menu'
import { createOrder } from '@/modules/orders/actions'
import type { OrderData } from '@/types/menu'
import type { CheckoutFormData, CheckoutMode } from '../types'
import type { CartItem } from '@/types/menu'

export interface OrderSubmitResult {
  success: boolean
  orderId?: string
  code?: string
  error?: string
  errorCode?: string
  errorDetails?: unknown
}

export interface SchedulingData {
  scheduledDate?: string | null
  scheduledTime?: string | null
}

export async function validateAndSubmitOrder(
  slug: string,
  formData: CheckoutFormData,
  checkoutMode: CheckoutMode,
  items: CartItem[],
  couponData: { code: string; discount: number } | undefined,
  idempotencyKey: string,
  scheduling?: SchedulingData
): Promise<OrderSubmitResult> {
  try {
    // Validar telefone baseado no modo de checkout
    if (checkoutMode === 'phone_required' && !formData.phone.trim()) {
      return {
        success: false,
        error: 'Telefone é obrigatório para finalizar o pedido'
      }
    }

    const store = await getStoreBySlug(slug)
    if (!store) {
      return {
        success: false,
        error: 'Loja não encontrada'
      }
    }

    const orderData: OrderData = {
      customer: {
        name: formData.name,
        phone: formData.phone.trim() || undefined,
        email: formData.email || undefined,
      },
      channel: formData.channel,
      payment_method: formData.paymentMethod,
      notes: formData.notes || undefined,
      coupon_code: couponData?.code,
    }

    if (formData.channel === 'DELIVERY') {
      orderData.delivery_address = {
        street: formData.street,
        number: formData.number,
        complement: formData.complement || undefined,
        district: formData.district,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zipCode,
        reference: formData.reference || undefined,
      }
    }

    const result = await createOrder(store.id, items, orderData, idempotencyKey, {
      scheduledDate: scheduling?.scheduledDate,
      scheduledTime: scheduling?.scheduledTime,
    })

    if (result.success && result.orderId && result.code) {
      return {
        success: true,
        orderId: result.orderId,
        code: result.code
      }
    } else {
      return {
        success: false,
        error: result.error || 'Erro ao criar pedido',
        errorCode: (result as any).errorCode,
        errorDetails: (result as any).errorDetails,
      }
    }
  } catch (err) {
    return {
      success: false,
      error: 'Erro ao processar pedido'
    }
  }
}
