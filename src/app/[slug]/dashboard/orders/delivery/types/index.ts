export interface DeliveryOrder {
  id: string
  order_code: string
  customer_name: string
  customer_phone: string
  delivery_address: string | null
  total_amount: number
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled'
  created_at: string
  notes?: string
}

export interface DeliveryStats {
  deliveredToday: number
  avgDeliveryTime: number
  deliveryTimes: Record<string, number>
}

export interface DeliveryState {
  updatingOrderId: string | null
  assignedDriver: Record<string, string>
  deliveryNotes: Record<string, string>
  showNoteModal: string | null
  noteInput: string
  soundEnabled: boolean
  orderItems: Record<string, any[]>
}
