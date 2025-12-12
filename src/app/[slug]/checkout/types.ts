export interface CheckoutFormData {
  name: string
  phone: string
  email: string
  channel: 'DELIVERY' | 'TAKEAWAY'
  paymentMethod: 'PIX' | 'CASH' | 'CARD'
  street: string
  number: string
  complement: string
  district: string
  city: string
  state: string
  zipCode: string
  reference: string
  notes: string
}

export type CheckoutMode = 'guest' | 'phone_required'

export type PaymentMethod = 'PIX' | 'CASH' | 'CARD'
