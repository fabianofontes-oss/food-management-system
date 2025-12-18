export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  obs?: string
  addons?: CartAddon[]
}

export interface CartAddon {
  id: string
  name: string
  price: number
}

export type PaymentMethod = 'cash' | 'card' | 'pix'
export type DiscountType = 'percent' | 'fixed'
export type LayoutType = 'grid' | 'compact'

export interface CashRegisterSession {
  id: string
  store_id: string
  attendant: string
  opened_at: string
  closed_at?: string
  opening_balance: number
  closing_balance?: number
  expected_balance?: number
  difference?: number
  cash_sales: number
  card_sales: number
  pix_sales: number
  withdrawals: number
  deposits: number
  status: 'open' | 'closed'
}

export interface CashMovement {
  id: string
  session_id: string
  type: 'withdrawal' | 'deposit'
  amount: number
  reason: string
  created_at: string
  attendant: string
}

export interface PDVStats {
  todaySales: number
  todayOrders: number
  ticketMedio: number
}

export interface ReceiptData {
  orderCode: string
  storeName: string
  storeAddress?: string
  storePhone?: string
  attendant: string
  customerName?: string
  tableNumber?: string
  items: CartItem[]
  subtotal: number
  discount: number
  serviceFee: number
  tip: number
  total: number
  paymentMethod: PaymentMethod
  cashReceived?: number
  change?: number
  createdAt: Date
}
