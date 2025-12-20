// Tipos compartilhados do módulo Driver
// Extraídos de /[slug]/motorista/page.tsx e /driver/dashboard/page.tsx

export interface Delivery {
  id: string
  status: 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled'
  driver_id: string | null
  driver_name: string | null
  driver_phone: string | null
  address: string
  estimated_time: number
  delivery_fee: number
  notes: string | null
  created_at: string
  updated_at: string
  order?: {
    order_code: string
    customer_name: string
    total_amount: number
  }
}

export interface DriverStats {
  todayDeliveries: number
  todayEarnings: number
  weekDeliveries: number
  weekEarnings: number
  totalDeliveries: number
  totalEarnings: number
  rating: number
}

export interface DriverProfile {
  id: string
  name: string
  phone: string
  email: string | null
  vehicle_type: string | null
  vehicle_plate: string | null
  is_available: boolean
  is_active: boolean
  commission_percent: number
  total_deliveries: number
  rating: number
  total_earnings: number
}

export interface ReferralData {
  partner: {
    id: string
    display_name: string
    is_active: boolean
  } | null
  codes: Array<{ code: string; is_active: boolean }>
  referralsCount: number
  pendingCommission: number
  availableCommission: number
}

export interface StoreInfo {
  id: string
  name: string
  slug: string
}

export interface DriverContext {
  driverName: string
  driverPhone?: string
  userId?: string
  storeId: string
  storeName?: string
  storeSlug?: string
  commissionPercent: number
}

export type DriverTab = 'entregas' | 'historico' | 'ganhos' | 'afiliados'

export const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  assigned: 'Atribuído',
  picked_up: 'Coletado',
  in_transit: 'Em Trânsito',
  delivered: 'Entregue',
  cancelled: 'Cancelado'
}

export const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  assigned: 'bg-blue-100 text-blue-700',
  picked_up: 'bg-purple-100 text-purple-700',
  in_transit: 'bg-orange-100 text-orange-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700'
}
