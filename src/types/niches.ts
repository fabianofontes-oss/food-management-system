// Types for expanded niche support

// ============================================
// FIT/HEALTHY - Nutritional Info
// ============================================

export interface NutritionalInfo {
  calories?: number
  protein_g?: number
  carbs_g?: number
  fat_g?: number
  fiber_g?: number
  sodium_mg?: number
}

export interface DietaryFlags {
  is_vegan: boolean
  is_vegetarian: boolean
  is_gluten_free: boolean
  is_lactose_free: boolean
  is_sugar_free: boolean
  is_low_carb: boolean
  is_keto: boolean
  is_organic: boolean
}

export type Allergen = 
  | 'gluten'
  | 'crustaceans'
  | 'eggs'
  | 'fish'
  | 'peanuts'
  | 'soybeans'
  | 'milk'
  | 'nuts'
  | 'celery'
  | 'mustard'
  | 'sesame'
  | 'sulfites'
  | 'lupin'
  | 'mollusks'

// ============================================
// CONFEITARIA - Custom Orders
// ============================================

export type CustomOrderStatus = 
  | 'pending'      // Aguardando orçamento
  | 'quoted'       // Orçamento enviado
  | 'confirmed'    // Cliente confirmou
  | 'in_production' // Em produção
  | 'ready'        // Pronto
  | 'delivered'    // Entregue
  | 'cancelled'    // Cancelado

export interface CustomOrder {
  id: string
  store_id: string
  customer_id?: string
  
  customer_name: string
  customer_phone: string
  customer_email?: string
  
  delivery_date: string // DATE
  delivery_time?: string // TIME
  delivery_type: 'pickup' | 'delivery'
  delivery_address?: {
    street: string
    number: string
    neighborhood: string
    city: string
    state: string
    zip_code: string
    complement?: string
  }
  
  description: string
  reference_images: string[]
  personalization_text?: string
  servings?: number
  
  product_id?: string
  
  estimated_price?: number
  final_price?: number
  deposit_amount?: number
  deposit_paid: boolean
  
  status: CustomOrderStatus
  notes?: string
  
  created_at: string
  updated_at: string
  quoted_at?: string
  confirmed_at?: string
}

export interface CustomOrderConfig {
  accepts_custom_orders: boolean
  custom_order_lead_days: number
  custom_order_deposit_percent: number
}

// ============================================
// SUSHI/JAPONÊS - Rodízio
// ============================================

export interface RodizioConfig {
  id: string
  store_id: string
  
  name: string
  description?: string
  
  price_adult: number
  price_child?: number
  child_age_limit: number
  
  duration_minutes: number
  
  max_items_per_round?: number
  max_waste_items?: number
  waste_fee_per_item?: number
  
  included_category_ids: string[]
  
  available_days: number[] // 0-6
  start_time?: string
  end_time?: string
  
  is_active: boolean
  created_at: string
  updated_at: string
}

export type RodizioSessionStatus = 'active' | 'finished' | 'cancelled'

export interface RodizioSession {
  id: string
  store_id: string
  rodizio_config_id: string
  table_id?: string
  order_id?: string
  
  adults_count: number
  children_count: number
  
  started_at: string
  ends_at?: string
  finished_at?: string
  
  items_consumed: number
  items_wasted: number
  
  base_total?: number
  waste_fee_total: number
  extras_total: number
  final_total?: number
  
  status: RodizioSessionStatus
  
  created_at: string
  updated_at: string
}

export interface RodizioItem {
  id: string
  session_id: string
  product_id: string
  quantity: number
  is_wasted: boolean
  requested_at: string
  delivered_at?: string
}

// ============================================
// BAR/PUB - Tabs (Comanda Aberta)
// ============================================

export type TabStatus = 'open' | 'pending_payment' | 'paid' | 'cancelled'

export interface Tab {
  id: string
  store_id: string
  table_id?: string
  customer_id?: string
  
  tab_number?: string
  customer_name?: string
  customer_phone?: string
  
  opened_at: string
  closed_at?: string
  
  credit_limit?: number
  
  subtotal: number
  discount_amount: number
  service_fee: number
  total: number
  
  amount_paid: number
  payment_method?: string
  
  tip_amount: number
  
  status: TabStatus
  notes?: string
  
  created_at: string
  updated_at: string
}

export interface TabItem {
  id: string
  tab_id: string
  product_id: string
  
  quantity: number
  unit_price: number
  total_price: number
  
  ordered_by?: string
  
  modifiers: Array<{
    name: string
    price: number
  }>
  notes?: string
  
  added_at: string
  served_at?: string
}

export interface TabSplit {
  id: string
  tab_id: string
  
  person_name: string
  amount: number
  tip_amount: number
  
  paid: boolean
  payment_method?: string
  paid_at?: string
  
  created_at: string
}

export interface TabConfig {
  has_tab_system: boolean
  default_service_fee_percent: number
  auto_service_fee: boolean
}

// ============================================
// HAPPY HOUR
// ============================================

export type HappyHourDiscountType = 'percent' | 'fixed' | 'buy_x_get_y'

export interface HappyHour {
  id: string
  store_id: string
  
  name: string
  description?: string
  
  days_of_week: number[] // 0-6
  start_time: string
  end_time: string
  
  discount_type: HappyHourDiscountType
  discount_value: number
  buy_quantity?: number
  get_quantity?: number
  
  applies_to: 'all' | 'categories' | 'products'
  category_ids: string[]
  product_ids: string[]
  
  is_active: boolean
  created_at: string
  updated_at: string
}

// ============================================
// DARK KITCHEN - Virtual Brands
// ============================================

export interface VirtualBrand {
  id: string
  store_id: string
  
  name: string
  slug: string
  description?: string
  logo_url?: string
  banner_url?: string
  
  theme_config: {
    primary_color?: string
    secondary_color?: string
    font_family?: string
  }
  
  category_ids: string[]
  
  is_active: boolean
  accepts_delivery: boolean
  accepts_pickup: boolean
  
  custom_hours?: {
    [key: string]: { // 'monday', 'tuesday', etc
      open: string
      close: string
      is_closed: boolean
    }
  }
  
  meta_title?: string
  meta_description?: string
  
  created_at: string
  updated_at: string
}

export interface DarkKitchenConfig {
  is_dark_kitchen: boolean
  kitchen_name?: string
}

// ============================================
// PRODUCT EXTENSIONS
// ============================================

export interface ProductNicheExtensions {
  // Nutritional
  calories?: number
  protein_g?: number
  carbs_g?: number
  fat_g?: number
  fiber_g?: number
  sodium_mg?: number
  
  // Dietary flags
  is_vegan: boolean
  is_vegetarian: boolean
  is_gluten_free: boolean
  is_lactose_free: boolean
  is_sugar_free: boolean
  is_low_carb: boolean
  is_keto: boolean
  is_organic: boolean
  
  // Allergens
  allergens: Allergen[]
  
  // Rodízio
  is_rodizio_item: boolean
  rodizio_limit_per_round?: number
  
  // Dark Kitchen
  virtual_brand_ids: string[]
}
