import { Database } from '@/types/database'

// Tipos Puros do Banco
export type OrderRow = Database['public']['Tables']['orders']['Row']
export type OrderItemRow = Database['public']['Tables']['order_items']['Row']
export type OrderStatus = Database['public']['Enums']['order_status_enum']

// Tipos Compostos (Joinados para a UI)
export type OrderItemWithDetails = OrderItemRow & {
  products: {
    name: string
    image_url: string | null
  } | null
  modifiers: {
    name_snapshot: string
    extra_price: number
    quantity?: number
  }[]
}

export type OrderWithDetails = OrderRow & {
  customer: {
    name: string
    phone: string
    email: string | null
  } | null
  items: OrderItemWithDetails[]
  events: {
    type: Database['public']['Enums']['order_event_type_enum']
    created_at: string
  }[]
}
