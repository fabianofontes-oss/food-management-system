export interface Store {
  id: string
  tenant_id: string
  name: string
  slug: string
  niche: 'acai' | 'burger' | 'hotdog' | 'marmita' | 'butcher' | 'ice_cream' | 'other'
  mode: 'store' | 'home'
  is_active: boolean
  logo_url: string | null
  banner_url: string | null
  phone: string | null
  whatsapp: string | null
  address: string | null
  settings: StoreSettings | null
}

export interface StoreSettings {
  opening_hours?: {
    [key: string]: string
  }
  delivery?: {
    enabled: boolean
    min_order: number
    radius_km: number
    fee: number
  }
  checkout?: {
    mode: 'guest' | 'phone_required'
  }
  takeaway_discount?: number
  auto_accept_orders?: boolean
}

export interface Category {
  id: string
  store_id: string
  name: string
  description: string | null
  sort_order: number
  is_active: boolean
}

export interface Product {
  id: string
  store_id: string
  category_id: string
  name: string
  description: string | null
  base_price: number
  unit_type: 'unit' | 'weight'
  price_per_unit: number | null
  image_url: string | null
  is_active: boolean
  category?: Category
}

export interface ModifierGroup {
  id: string
  store_id: string
  name: string
  min_quantity: number
  max_quantity: number
  required: boolean
  sort_order: number
  options: ModifierOption[]
}

export interface ModifierOption {
  id: string
  group_id: string
  name: string
  extra_price: number
  is_active: boolean
  sort_order: number
}

export interface ProductWithModifiers extends Product {
  modifier_groups: ModifierGroup[]
}

export interface SelectedModifier {
  option_id: string
  name: string
  extra_price: number
}

export interface CartItem {
  id: string
  product_id: string
  product_name: string
  product_image: string | null
  unit_price: number
  quantity: number
  modifiers: SelectedModifier[]
  notes?: string
  subtotal: number
}

export interface CustomerData {
  name: string
  phone?: string
  email?: string
}

export interface DeliveryAddress {
  street: string
  number: string
  complement?: string
  district: string
  city: string
  state: string
  zip_code: string
  reference?: string
}

export interface OrderData {
  customer: CustomerData
  channel: 'COUNTER' | 'DELIVERY' | 'TAKEAWAY'
  payment_method: 'PIX' | 'CASH' | 'CARD' | 'ONLINE'
  delivery_address?: DeliveryAddress
  table_number?: string
  notes?: string
}
