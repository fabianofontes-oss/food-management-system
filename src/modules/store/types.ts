import { Database } from '@/types/database'

// ============================================
// TIPOS PUROS DO BANCO
// ============================================
export type StoreRow = Database['public']['Tables']['stores']['Row']
export type StoreUserRow = Database['public']['Tables']['store_users']['Row']

// ============================================
// HORÁRIOS DE FUNCIONAMENTO
// ============================================
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
// INFORMAÇÕES DA LOJA
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
// CONFIGURAÇÕES DE TEMA DO MENU (SITE BUILDER)
// ============================================
export type MenuLayout = 'classic' | 'modern' | 'minimal' | 'grid'

export interface MenuThemeColors {
  primary: string      // Cor principal (botões, destaques)
  background: string   // Cor de fundo da página
  header: string       // Cor do cabeçalho
}

export interface MenuThemeDisplay {
  showBanner: boolean
  showLogo: boolean
  showSocial: boolean
  showAddress: boolean
  showSearch: boolean
}

export interface MenuTheme {
  layout: MenuLayout
  colors: MenuThemeColors
  display: MenuThemeDisplay
  bannerUrl?: string | null
}

export const DEFAULT_MENU_THEME: MenuTheme = {
  layout: 'modern',
  colors: {
    primary: '#ea1d2c',
    background: '#f4f4f5',
    header: '#ffffff'
  },
  display: {
    showBanner: true,
    showLogo: true,
    showSocial: true,
    showAddress: true,
    showSearch: true
  },
  bannerUrl: null
}

// Alias para compatibilidade
export const defaultTheme = DEFAULT_MENU_THEME

// ============================================
// TIPO COMPOSTO: LOJA COM SETTINGS PARSEADO
// ============================================
export type StoreWithSettings = StoreRow & {
  parsedSettings: StoreSettings
  parsedTheme: MenuTheme
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

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  info: {
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
  },
  businessHours: DEFAULT_BUSINESS_HOURS,
  sales: {
    delivery: { enabled: true, radius: 5, fee: 5, minOrder: 20, time: 45, freeAbove: 0 },
    pickup: { enabled: true, time: 20, discount: 0 },
    tables: { enabled: false, count: 10, serviceFee: 10, qrcode: true },
    scheduling: { enabled: false, minHours: 2, maxDays: 7 },
    reservations: { enabled: false, duration: 90, maxParty: 20, advanceDays: 30 },
    inventory: { enabled: false, lowAlert: 10, autoDeduct: true },
    kitchen: { enabled: true, autoAccept: false, prepAlert: 30 },
    printer: { enabled: false, auto: false, type: 'thermal80', customerCopy: true },
    pdv: {
      enabled: true, theme: 'light', layout: 'grid', productSize: 'medium',
      showImages: true, fontSize: 'medium', primaryColor: '#8B5CF6',
      showStock: true, lowStockAlert: 5, hideOutOfStock: false,
      barcodeEnabled: true, scaleEnabled: false, openDrawer: true,
      soundEnabled: true, autoPrint: true, printCopies: '1',
      printCustomerCopy: false, printKitchen: true, discountEnabled: true,
      maxDiscount: 10, managerDiscount: 30, requireCustomer: false,
      allowObs: true, cancelItemPassword: false, reprintPassword: false,
      defaultPayment: 'money', allowSplitPayment: true, calculateChange: true,
      tipEnabled: false, tipSuggestions: '5,10,15', sangriaEnabled: true,
      suprimentoEnabled: true, blindClose: false, autoLogout: 0,
      shiftRequired: false, quickSale: true, shortcutF1: 'search',
      shortcutF2: 'quick_sale', shortcutF3: 'discount', shortcutF4: 'cancel'
    }
  },
  payments: {
    cash: true,
    credit: true,
    debit: true,
    pix: { enabled: true, keyType: 'cpf', key: '', name: '' }
  },
  notifications: {
    whatsapp: { enabled: false, number: '', notifyOrder: true, notifyCustomer: true },
    email: { enabled: false, confirmation: true },
    sounds: { enabled: true, newOrder: true, volume: 'medium' }
  },
  integrations: {
    ifood: { enabled: false, merchantId: '', clientId: '', clientSecret: '' },
    rappi: { enabled: false, storeId: '', apiKey: '' },
    uberEats: { enabled: false, storeId: '', clientId: '', clientSecret: '' },
    loggi: { enabled: false, apiKey: '', autoDispatch: false },
    googleReviews: { enabled: false, connected: false }
  }
}

/**
 * Mescla settings parciais com valores padrão
 */
export function mergeWithDefaults(partial: Partial<StoreSettings> | null): StoreSettings {
  if (!partial) return DEFAULT_STORE_SETTINGS
  
  return {
    info: { ...DEFAULT_STORE_SETTINGS.info, ...partial.info },
    businessHours: partial.businessHours || DEFAULT_STORE_SETTINGS.businessHours,
    sales: {
      delivery: { ...DEFAULT_STORE_SETTINGS.sales.delivery, ...partial.sales?.delivery },
      pickup: { ...DEFAULT_STORE_SETTINGS.sales.pickup, ...partial.sales?.pickup },
      tables: { ...DEFAULT_STORE_SETTINGS.sales.tables, ...partial.sales?.tables },
      scheduling: { ...DEFAULT_STORE_SETTINGS.sales.scheduling, ...partial.sales?.scheduling },
      reservations: { ...DEFAULT_STORE_SETTINGS.sales.reservations, ...partial.sales?.reservations },
      inventory: { ...DEFAULT_STORE_SETTINGS.sales.inventory, ...partial.sales?.inventory },
      kitchen: { ...DEFAULT_STORE_SETTINGS.sales.kitchen, ...partial.sales?.kitchen },
      printer: { ...DEFAULT_STORE_SETTINGS.sales.printer, ...partial.sales?.printer },
      pdv: { ...DEFAULT_STORE_SETTINGS.sales.pdv, ...partial.sales?.pdv }
    },
    payments: {
      ...DEFAULT_STORE_SETTINGS.payments,
      ...partial.payments,
      pix: { ...DEFAULT_STORE_SETTINGS.payments.pix, ...partial.payments?.pix }
    },
    notifications: {
      whatsapp: { ...DEFAULT_STORE_SETTINGS.notifications.whatsapp, ...partial.notifications?.whatsapp },
      email: { ...DEFAULT_STORE_SETTINGS.notifications.email, ...partial.notifications?.email },
      sounds: { ...DEFAULT_STORE_SETTINGS.notifications.sounds, ...partial.notifications?.sounds }
    },
    integrations: {
      ifood: { ...DEFAULT_STORE_SETTINGS.integrations.ifood, ...partial.integrations?.ifood },
      rappi: { ...DEFAULT_STORE_SETTINGS.integrations.rappi, ...partial.integrations?.rappi },
      uberEats: { ...DEFAULT_STORE_SETTINGS.integrations.uberEats, ...partial.integrations?.uberEats },
      loggi: { ...DEFAULT_STORE_SETTINGS.integrations.loggi, ...partial.integrations?.loggi },
      googleReviews: { ...DEFAULT_STORE_SETTINGS.integrations.googleReviews, ...partial.integrations?.googleReviews }
    }
  }
}
