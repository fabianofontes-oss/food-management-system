// Types for Tropical Freeze Features
// MIMO, Fidelidade, KDS, TV Board, Marketing Studio, Hardware

// ============================================
// MIMO - PAGAMENTO SOCIAL
// ============================================

export interface MimoOrder {
  mimo_token: string
  mimo_expires_at: string
  mimo_target_name: string
  mimo_message?: string
  mimo_payer_name?: string
  mimo_payer_id?: string
  mimo_paid_at?: string
  mimo_shared_via?: 'whatsapp' | 'link' | 'sms'
}

export interface MimoConfig {
  mimo_enabled: boolean
  mimo_expiration_minutes: number
  mimo_allow_table_orders: boolean
  mimo_min_order_value: number
  mimo_payer_earns_points: boolean
}

export interface MimoValidationResult {
  valid: boolean
  error?: string
  order_id?: string
  total?: number
  target_name?: string
  message?: string
  expires_at?: string
}

// ============================================
// FIDELIDADE / LOYALTY
// ============================================

export type LoyaltyProgramType = 'points' | 'stamps' | 'cashback'
export type StampRewardType = 'free_item' | 'discount' | 'points'
export type LoyaltyTransactionType = 'earn' | 'redeem' | 'expire' | 'adjust' | 'bonus'

export interface LoyaltyProgram {
  id: string
  store_id: string
  
  name: string
  description?: string
  
  program_type: LoyaltyProgramType
  
  // Pontos
  points_per_currency: number
  points_per_order: number
  points_value: number
  min_points_redeem: number
  max_discount_percent: number
  
  // Cashback
  cashback_percent: number
  cashback_expiry_days: number
  
  // Carimbos
  stamps_required: number
  stamp_reward_type: StampRewardType
  stamp_reward_value?: number
  stamp_reward_product_id?: string
  
  has_tiers: boolean
  is_active: boolean
  
  created_at: string
  updated_at: string
}

export interface LoyaltyTier {
  id: string
  program_id: string
  
  name: string
  min_points: number
  
  points_multiplier: number
  discount_percent: number
  free_delivery: boolean
  priority_support: boolean
  exclusive_products: boolean
  
  badge_color?: string
  badge_icon?: string
  
  sort_order: number
  created_at: string
}

export interface CustomerLoyalty {
  id: string
  customer_id: string
  store_id: string
  program_id?: string
  
  points_balance: number
  points_earned_total: number
  points_redeemed_total: number
  
  cashback_balance: number
  
  stamps_current: number
  stamps_completed: number
  
  current_tier_id?: string
  current_tier?: LoyaltyTier
  tier_achieved_at?: string
  
  total_orders: number
  total_spent: number
  last_order_at?: string
  
  created_at: string
  updated_at: string
}

export interface LoyaltyTransaction {
  id: string
  customer_loyalty_id: string
  store_id: string
  order_id?: string
  
  transaction_type: LoyaltyTransactionType
  points_amount: number
  
  description?: string
  
  cashback_amount: number
  stamps_amount: number
  
  created_at: string
}

// Régua de Relacionamento
export type EngagementTriggerType = 'days_inactive' | 'birthday' | 'anniversary' | 'first_order'
export type EngagementActionType = 'whatsapp' | 'push' | 'email' | 'coupon'

export interface CustomerEngagementRule {
  id: string
  store_id: string
  
  name: string
  description?: string
  
  trigger_type: EngagementTriggerType
  trigger_days?: number
  
  action_type: EngagementActionType
  message_template?: string
  coupon_id?: string
  bonus_points: number
  
  is_active: boolean
  
  created_at: string
  updated_at: string
}

export interface CustomerEngagementLog {
  id: string
  rule_id: string
  customer_id: string
  
  sent_at: string
  channel?: string
  status: 'sent' | 'delivered' | 'opened' | 'converted'
  converted_order_id?: string
}

// ============================================
// KDS AVANÇADO
// ============================================

export interface KdsColumn {
  id: string
  name: string
  color: string
}

export type KdsSlaStatus = 'green' | 'yellow' | 'red'
export type KdsBatchGroupBy = 'product' | 'category'
export type KdsFontSize = 'small' | 'medium' | 'large'

export interface KdsConfig {
  id: string
  store_id: string
  
  columns: KdsColumn[]
  
  sla_green_minutes: number
  sla_yellow_minutes: number
  
  batch_mode_enabled: boolean
  batch_group_by: KdsBatchGroupBy
  
  sound_new_order: boolean
  sound_file: string
  
  auto_refresh_seconds: number
  
  font_size: KdsFontSize
  show_customer_name: boolean
  show_order_notes: boolean
  
  created_at: string
  updated_at: string
}

export interface KdsStation {
  id: string
  store_id: string
  
  name: string
  code: string
  
  category_ids: string[]
  
  color: string
  icon: string
  
  is_active: boolean
  sort_order: number
  
  created_at: string
}

export interface KdsOrderLog {
  id: string
  order_id: string
  store_id: string
  
  received_at: string
  started_at?: string
  ready_at?: string
  picked_up_at?: string
  
  wait_time_seconds?: number
  prep_time_seconds?: number
  total_time_seconds?: number
  
  sla_status?: KdsSlaStatus
  estimated_prep_minutes?: number
  
  prepared_by?: string
  
  created_at: string
}

// Batch Mode
export interface KdsBatchItem {
  product_id: string
  product_name: string
  quantity: number
  order_ids: string[]
}

// ============================================
// TV MENU BOARD
// ============================================

export type TvDisplayType = 'menu' | 'promo' | 'queue' | 'mixed'
export type TvLayout = 'grid' | 'list' | 'carousel' | 'split'
export type TvTheme = 'dark' | 'light' | 'store'
export type TvQrPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'

export interface TvDisplay {
  id: string
  store_id: string
  
  name: string
  code: string
  
  display_type: TvDisplayType
  
  layout: TvLayout
  columns: number
  rows: number
  
  category_ids: string[]
  show_prices: boolean
  show_images: boolean
  show_descriptions: boolean
  
  show_qr_code: boolean
  qr_position: TvQrPosition
  qr_size: number
  
  promo_rotation_seconds: number
  promo_ids: string[]
  
  theme: TvTheme
  background_color: string
  text_color: string
  accent_color: string
  font_size: KdsFontSize
  
  is_active: boolean
  last_ping_at?: string
  
  created_at: string
  updated_at: string
}

export interface TvPromotion {
  id: string
  store_id: string
  
  title: string
  subtitle?: string
  
  image_url?: string
  background_color?: string
  text_color?: string
  
  product_id?: string
  
  start_date?: string
  end_date?: string
  
  days_of_week: number[]
  
  is_active: boolean
  sort_order: number
  
  created_at: string
}

// ============================================
// MARKETING STUDIO
// ============================================

export type MarketingTemplateType = 'instagram_post' | 'instagram_story' | 'whatsapp' | 'flyer'
export type MarketingTemplateCategory = 'promo' | 'product' | 'event' | 'seasonal'
export type MarketingPostStatus = 'draft' | 'scheduled' | 'published'

export interface MarketingTemplate {
  id: string
  store_id?: string
  
  name: string
  description?: string
  
  template_type: MarketingTemplateType
  
  width: number
  height: number
  
  design_json: Record<string, unknown>
  
  preview_url?: string
  
  category?: MarketingTemplateCategory
  tags: string[]
  
  is_active: boolean
  is_premium: boolean
  
  created_at: string
}

export interface MarketingPost {
  id: string
  store_id: string
  template_id?: string
  
  title?: string
  
  image_url?: string
  
  product_id?: string
  
  status: MarketingPostStatus
  scheduled_at?: string
  published_at?: string
  
  instagram_post_id?: string
  facebook_post_id?: string
  
  created_at: string
}

export interface SocialFrame {
  id: string
  store_id?: string
  
  name: string
  
  frame_url: string
  
  width: number
  height: number
  
  photo_x: number
  photo_y: number
  photo_width: number
  photo_height: number
  
  frame_type: 'portrait' | 'landscape' | 'square'
  
  is_active: boolean
  
  created_at: string
}

// ============================================
// HARDWARE INTEGRATION
// ============================================

export type HardwareDeviceType = 'scale' | 'printer' | 'barcode_scanner' | 'card_reader'
export type HardwareConnectionType = 'usb' | 'serial' | 'network' | 'bluetooth'
export type ScaleProtocol = 'toledo' | 'filizola' | 'urano' | 'generic'
export type PrinterDriver = 'escpos' | 'star' | 'epson'

export interface HardwareDevice {
  id: string
  store_id: string
  
  name: string
  device_type: HardwareDeviceType
  
  connection_type: HardwareConnectionType
  connection_config?: {
    port?: string
    baudrate?: number
    ip?: string
    vendor_id?: number
    product_id?: number
  }
  
  scale_protocol?: ScaleProtocol
  scale_unit: 'kg' | 'g' | 'lb'
  
  printer_width?: 58 | 80
  printer_driver?: PrinterDriver
  
  is_active: boolean
  last_connected_at?: string
  
  created_at: string
  updated_at: string
}

// ============================================
// PRODUCT EXTENSIONS (KDS)
// ============================================

export interface ProductKdsExtensions {
  prep_time_minutes: number
  kds_priority: 0 | 1 | 2
  kds_station?: string
}
