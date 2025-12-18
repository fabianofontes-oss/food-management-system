/**
 * Tipos para o módulo de impressão
 */

export interface PrintOrder {
  id: string
  code: string
  createdAt: string
  channel: 'COUNTER' | 'DELIVERY' | 'TAKEAWAY'
  customer: {
    name?: string
    phone?: string
  }
  address?: {
    street: string
    number: string
    complement?: string
    district: string
  }
  items: PrintOrderItem[]
  subtotal: number
  deliveryFee: number
  discount: number
  total: number
  paymentMethod: string
  notes?: string
}

export interface PrintOrderItem {
  name: string
  quantity: number
  unitPrice: number
  total: number
  modifiers?: string[]
  notes?: string
}

export interface PrintConfig {
  paperWidth: '58mm' | '80mm'
  showLogo: boolean
  showQRCode: boolean
  fontSize: 'small' | 'medium' | 'large'
}

export const defaultPrintConfig: PrintConfig = {
  paperWidth: '80mm',
  showLogo: true,
  showQRCode: false,
  fontSize: 'medium',
}
