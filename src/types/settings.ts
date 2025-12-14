// ============================================
// TIPOS CENTRALIZADOS DE CONFIGURAÇÕES
// ============================================

// Horários de funcionamento
export interface BusinessHour {
  day: string
  name: string
  enabled: boolean
  open: string
  close: string
}

// ============================================
// CONFIGURAÇÕES DE VENDAS
// ============================================
export interface DeliverySettings {
  enabled: boolean
  radius: number
  fee: number
  minOrder: number
  time: number
  freeAbove: number
}

export interface PickupSettings {
  enabled: boolean
  time: number
  discount: number
}

export interface TablesSettings {
  enabled: boolean
  count: number
  serviceFee: number
  qrcode: boolean
}

export interface SchedulingSettings {
  enabled: boolean
  minHours: number
  maxDays: number
}

export interface ReservationsSettings {
  enabled: boolean
  duration: number
  maxParty: number
  advanceDays: number
}

export interface InventorySettings {
  enabled: boolean
  lowAlert: number
  autoDeduct: boolean
}

export interface KitchenSettings {
  enabled: boolean
  autoAccept: boolean
  prepAlert: number
}

export interface PrinterSettings {
  enabled: boolean
  auto: boolean
  type: 'thermal80' | 'thermal58' | 'a4'
  customerCopy: boolean
}

export interface PDVSettings {
  enabled: boolean
  theme: 'light' | 'dark' | 'auto'
  layout: 'grid' | 'list' | 'compact'
  productSize: 'small' | 'medium' | 'large'
  showImages: boolean
  fontSize: 'small' | 'medium' | 'large'
  primaryColor: string
  showStock: boolean
  lowStockAlert: number
  hideOutOfStock: boolean
  barcodeEnabled: boolean
  scaleEnabled: boolean
  openDrawer: boolean
  soundEnabled: boolean
  autoPrint: boolean
  printCopies: string
  printCustomerCopy: boolean
  printKitchen: boolean
  discountEnabled: boolean
  maxDiscount: number
  managerDiscount: number
  requireCustomer: boolean
  allowObs: boolean
  cancelItemPassword: boolean
  reprintPassword: boolean
  defaultPayment: 'money' | 'debit' | 'credit' | 'pix'
  allowSplitPayment: boolean
  calculateChange: boolean
  tipEnabled: boolean
  tipSuggestions: string
  sangriaEnabled: boolean
  suprimentoEnabled: boolean
  blindClose: boolean
  autoLogout: number
  shiftRequired: boolean
  quickSale: boolean
  shortcutF1: string
  shortcutF2: string
  shortcutF3: string
  shortcutF4: string
}

export interface SalesSettings {
  delivery: DeliverySettings
  pickup: PickupSettings
  tables: TablesSettings
  scheduling: SchedulingSettings
  reservations: ReservationsSettings
  inventory: InventorySettings
  kitchen: KitchenSettings
  printer: PrinterSettings
  pdv: PDVSettings
}

// ============================================
// CONFIGURAÇÕES DE PAGAMENTOS
// ============================================
export interface PixSettings {
  enabled: boolean
  keyType: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random'
  key: string
  name: string
}

export interface PaymentSettings {
  cash: boolean
  credit: boolean
  debit: boolean
  pix: PixSettings
}

// ============================================
// CONFIGURAÇÕES DE NOTIFICAÇÕES
// ============================================
export interface WhatsAppSettings {
  enabled: boolean
  number: string
  notifyOrder: boolean
  notifyCustomer: boolean
}

export interface EmailSettings {
  enabled: boolean
  confirmation: boolean
}

export interface SoundSettings {
  enabled: boolean
  newOrder: boolean
  volume: 'low' | 'medium' | 'high'
}

export interface NotificationSettings {
  whatsapp: WhatsAppSettings
  email: EmailSettings
  sounds: SoundSettings
}

// ============================================
// CONFIGURAÇÕES DE INTEGRAÇÕES
// ============================================
export interface IFoodSettings {
  enabled: boolean
  merchantId: string
  clientId: string
  clientSecret: string
}

export interface RappiSettings {
  enabled: boolean
  storeId: string
  apiKey: string
}

export interface UberEatsSettings {
  enabled: boolean
  storeId: string
  clientId: string
  clientSecret: string
}

export interface LoggiSettings {
  enabled: boolean
  apiKey: string
  autoDispatch: boolean
}

export interface GoogleReviewsSettings {
  enabled: boolean
  connected: boolean
  accessToken?: string
  refreshToken?: string
}

export interface IntegrationSettings {
  ifood: IFoodSettings
  rappi: RappiSettings
  uberEats: UberEatsSettings
  loggi: LoggiSettings
  googleReviews: GoogleReviewsSettings
}

// ============================================
// CONFIGURAÇÕES DA LOJA
// ============================================
export interface StoreInfo {
  name: string
  description: string
  phone: string
  email: string
  address: string
  city: string
  state: string
  cep: string
  logoUrl: string
  bannerUrl: string
  primaryColor: string
  instagram: string
  facebook: string
  website: string
}

// ============================================
// CONFIGURAÇÕES COMPLETAS
// ============================================
export interface StoreSettings {
  info: StoreInfo
  businessHours: BusinessHour[]
  sales: SalesSettings
  payments: PaymentSettings
  notifications: NotificationSettings
  integrations: IntegrationSettings
}

// ============================================
// VALORES PADRÃO
// ============================================
export const DEFAULT_BUSINESS_HOURS: BusinessHour[] = [
  { day: 'monday', name: 'Seg', enabled: true, open: '08:00', close: '22:00' },
  { day: 'tuesday', name: 'Ter', enabled: true, open: '08:00', close: '22:00' },
  { day: 'wednesday', name: 'Qua', enabled: true, open: '08:00', close: '22:00' },
  { day: 'thursday', name: 'Qui', enabled: true, open: '08:00', close: '22:00' },
  { day: 'friday', name: 'Sex', enabled: true, open: '08:00', close: '22:00' },
  { day: 'saturday', name: 'Sáb', enabled: true, open: '08:00', close: '22:00' },
  { day: 'sunday', name: 'Dom', enabled: false, open: '08:00', close: '22:00' }
]

export const DEFAULT_DELIVERY_SETTINGS: DeliverySettings = {
  enabled: true,
  radius: 5,
  fee: 5,
  minOrder: 20,
  time: 45,
  freeAbove: 0
}

export const DEFAULT_PICKUP_SETTINGS: PickupSettings = {
  enabled: true,
  time: 20,
  discount: 0
}

export const DEFAULT_TABLES_SETTINGS: TablesSettings = {
  enabled: false,
  count: 10,
  serviceFee: 10,
  qrcode: true
}

export const DEFAULT_SCHEDULING_SETTINGS: SchedulingSettings = {
  enabled: false,
  minHours: 2,
  maxDays: 7
}

export const DEFAULT_RESERVATIONS_SETTINGS: ReservationsSettings = {
  enabled: false,
  duration: 90,
  maxParty: 20,
  advanceDays: 30
}

export const DEFAULT_INVENTORY_SETTINGS: InventorySettings = {
  enabled: false,
  lowAlert: 10,
  autoDeduct: true
}

export const DEFAULT_KITCHEN_SETTINGS: KitchenSettings = {
  enabled: true,
  autoAccept: false,
  prepAlert: 30
}

export const DEFAULT_PRINTER_SETTINGS: PrinterSettings = {
  enabled: false,
  auto: false,
  type: 'thermal80',
  customerCopy: true
}

export const DEFAULT_PDV_SETTINGS: PDVSettings = {
  enabled: true,
  theme: 'light',
  layout: 'grid',
  productSize: 'medium',
  showImages: true,
  fontSize: 'medium',
  primaryColor: '#8B5CF6',
  showStock: true,
  lowStockAlert: 5,
  hideOutOfStock: false,
  barcodeEnabled: true,
  scaleEnabled: false,
  openDrawer: true,
  soundEnabled: true,
  autoPrint: true,
  printCopies: '1',
  printCustomerCopy: false,
  printKitchen: true,
  discountEnabled: true,
  maxDiscount: 10,
  managerDiscount: 30,
  requireCustomer: false,
  allowObs: true,
  cancelItemPassword: false,
  reprintPassword: false,
  defaultPayment: 'money',
  allowSplitPayment: true,
  calculateChange: true,
  tipEnabled: false,
  tipSuggestions: '5,10,15',
  sangriaEnabled: true,
  suprimentoEnabled: true,
  blindClose: false,
  autoLogout: 0,
  shiftRequired: false,
  quickSale: true,
  shortcutF1: 'search',
  shortcutF2: 'quick_sale',
  shortcutF3: 'discount',
  shortcutF4: 'cancel'
}

export const DEFAULT_SALES_SETTINGS: SalesSettings = {
  delivery: DEFAULT_DELIVERY_SETTINGS,
  pickup: DEFAULT_PICKUP_SETTINGS,
  tables: DEFAULT_TABLES_SETTINGS,
  scheduling: DEFAULT_SCHEDULING_SETTINGS,
  reservations: DEFAULT_RESERVATIONS_SETTINGS,
  inventory: DEFAULT_INVENTORY_SETTINGS,
  kitchen: DEFAULT_KITCHEN_SETTINGS,
  printer: DEFAULT_PRINTER_SETTINGS,
  pdv: DEFAULT_PDV_SETTINGS
}

export const DEFAULT_PIX_SETTINGS: PixSettings = {
  enabled: true,
  keyType: 'cpf',
  key: '',
  name: ''
}

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  cash: true,
  credit: true,
  debit: true,
  pix: DEFAULT_PIX_SETTINGS
}

export const DEFAULT_WHATSAPP_SETTINGS: WhatsAppSettings = {
  enabled: false,
  number: '',
  notifyOrder: true,
  notifyCustomer: true
}

export const DEFAULT_EMAIL_SETTINGS: EmailSettings = {
  enabled: false,
  confirmation: true
}

export const DEFAULT_SOUND_SETTINGS: SoundSettings = {
  enabled: true,
  newOrder: true,
  volume: 'medium'
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  whatsapp: DEFAULT_WHATSAPP_SETTINGS,
  email: DEFAULT_EMAIL_SETTINGS,
  sounds: DEFAULT_SOUND_SETTINGS
}

export const DEFAULT_IFOOD_SETTINGS: IFoodSettings = {
  enabled: false,
  merchantId: '',
  clientId: '',
  clientSecret: ''
}

export const DEFAULT_RAPPI_SETTINGS: RappiSettings = {
  enabled: false,
  storeId: '',
  apiKey: ''
}

export const DEFAULT_UBEREATS_SETTINGS: UberEatsSettings = {
  enabled: false,
  storeId: '',
  clientId: '',
  clientSecret: ''
}

export const DEFAULT_LOGGI_SETTINGS: LoggiSettings = {
  enabled: false,
  apiKey: '',
  autoDispatch: false
}

export const DEFAULT_GOOGLE_REVIEWS_SETTINGS: GoogleReviewsSettings = {
  enabled: false,
  connected: false
}

export const DEFAULT_INTEGRATION_SETTINGS: IntegrationSettings = {
  ifood: DEFAULT_IFOOD_SETTINGS,
  rappi: DEFAULT_RAPPI_SETTINGS,
  uberEats: DEFAULT_UBEREATS_SETTINGS,
  loggi: DEFAULT_LOGGI_SETTINGS,
  googleReviews: DEFAULT_GOOGLE_REVIEWS_SETTINGS
}

export const DEFAULT_STORE_INFO: StoreInfo = {
  name: '',
  description: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  state: '',
  cep: '',
  logoUrl: '',
  bannerUrl: '',
  primaryColor: '#8B5CF6',
  instagram: '',
  facebook: '',
  website: ''
}

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  info: DEFAULT_STORE_INFO,
  businessHours: DEFAULT_BUSINESS_HOURS,
  sales: DEFAULT_SALES_SETTINGS,
  payments: DEFAULT_PAYMENT_SETTINGS,
  notifications: DEFAULT_NOTIFICATION_SETTINGS,
  integrations: DEFAULT_INTEGRATION_SETTINGS
}
