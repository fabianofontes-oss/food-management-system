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
  public_profile?: PublicProfile | null
  menu_theme?: MenuTheme | null
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
  payments?: {
    pix?: {
      enabled: boolean
      key_type?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random'
      key?: string
      receiver_name?: string
    }
    cash?: boolean
    card_on_delivery?: boolean
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

// Sabor fracionado para pizza meio-a-meio
export interface CartItemFlavor {
  product_id: string
  product_name: string
  fraction: number // 0.5 = metade, 0.33 = terço
  price: number
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
  // Pizza meio-a-meio
  flavors?: CartItemFlavor[]
  is_half_half?: boolean
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
  coupon_code?: string
  discount_amount?: number
}

export interface BusinessHours {
  monday?: string
  tuesday?: string
  wednesday?: string
  thursday?: string
  friday?: string
  saturday?: string
  sunday?: string
}

export interface PublicProfile {
  displayName?: string
  slogan?: string
  fullAddress?: string
  googleMapsUrl?: string
  phone?: string
  whatsapp?: string
  instagram?: string
  facebook?: string
  tiktok?: string
  businessHours?: BusinessHours
  notes?: string
}

export interface MenuTheme {
  preset?: 'menuA' | 'menuB' | 'menuC'
  cardVariant?: 'cardA' | 'cardB' | 'cardC'
  colors?: {
    primary?: string
    accent?: string
    bg?: string
    text?: string
  }
  layout?: {
    showSearch?: boolean
    showCategories?: boolean
  }
}
