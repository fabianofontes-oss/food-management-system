import { getStoreBySlug } from '@/lib/actions/menu'
import type { CheckoutMode, PaymentMethod } from '../types'

export interface StoreSettings {
  checkoutMode: CheckoutMode
  availablePaymentMethods: PaymentMethod[]
}

export async function loadStoreSettings(slug: string): Promise<StoreSettings> {
  try {
    const store = await getStoreBySlug(slug)
    
    // Carregar modo de checkout
    const checkoutMode: CheckoutMode = store?.settings?.checkout?.mode || 'phone_required'
    
    // Carregar métodos de pagamento disponíveis
    const methods: PaymentMethod[] = []
    if (store?.settings?.payments) {
      if (store.settings.payments.pix?.enabled) {
        methods.push('PIX')
      }
      if (store.settings.payments.cash) {
        methods.push('CASH')
      }
      if (store.settings.payments.card_on_delivery) {
        methods.push('CARD')
      }
    } else {
      // Default: apenas dinheiro se não configurado
      methods.push('CASH')
    }
    
    return {
      checkoutMode,
      availablePaymentMethods: methods
    }
  } catch (err) {
    console.error('Erro ao carregar configurações da loja:', err)
    return {
      checkoutMode: 'phone_required',
      availablePaymentMethods: ['CASH']
    }
  }
}
