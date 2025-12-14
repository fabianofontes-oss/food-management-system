import { createClient } from '@/lib/supabase/client'
import type { 
  StoreSettings, 
  SalesSettings, 
  PaymentSettings, 
  NotificationSettings, 
  IntegrationSettings,
  BusinessHour,
  StoreInfo
} from '@/types/settings'
import {
  DEFAULT_STORE_SETTINGS,
  DEFAULT_SALES_SETTINGS,
  DEFAULT_PAYMENT_SETTINGS,
  DEFAULT_NOTIFICATION_SETTINGS,
  DEFAULT_INTEGRATION_SETTINGS,
  DEFAULT_BUSINESS_HOURS,
  DEFAULT_STORE_INFO
} from '@/types/settings'

class SettingsService {
  private supabase = createClient()

  async load(storeId: string): Promise<StoreSettings> {
    const { data, error } = await this.supabase
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .single()

    if (error || !data) {
      console.error('Erro ao carregar configurações:', error)
      return DEFAULT_STORE_SETTINGS
    }

    const settings = data.settings || {}

    return {
      info: {
        name: data.name || '',
        description: data.description || '',
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        cep: data.cep || '',
        logoUrl: data.logo_url || '',
        bannerUrl: data.banner_url || '',
        primaryColor: settings.primaryColor || DEFAULT_STORE_INFO.primaryColor,
        instagram: settings.instagram || '',
        facebook: settings.facebook || '',
        website: settings.website || ''
      },
      businessHours: settings.businessHours || DEFAULT_BUSINESS_HOURS,
      sales: this.mergeSalesSettings(settings.sales),
      payments: this.mergePaymentSettings(settings.payments),
      notifications: this.mergeNotificationSettings(settings.notifications),
      integrations: this.mergeIntegrationSettings(settings.integrations)
    }
  }

  async save(storeId: string, settings: StoreSettings): Promise<boolean> {
    const { error } = await this.supabase
      .from('stores')
      .update({
        name: settings.info.name,
        description: settings.info.description,
        phone: settings.info.phone,
        email: settings.info.email,
        address: settings.info.address,
        city: settings.info.city,
        state: settings.info.state,
        cep: settings.info.cep,
        logo_url: settings.info.logoUrl,
        banner_url: settings.info.bannerUrl,
        settings: {
          primaryColor: settings.info.primaryColor,
          instagram: settings.info.instagram,
          facebook: settings.info.facebook,
          website: settings.info.website,
          businessHours: settings.businessHours,
          sales: settings.sales,
          payments: settings.payments,
          notifications: settings.notifications,
          integrations: settings.integrations
        }
      })
      .eq('id', storeId)

    if (error) {
      console.error('Erro ao salvar configurações:', error)
      return false
    }

    return true
  }

  async updateSales(storeId: string, sales: Partial<SalesSettings>): Promise<boolean> {
    const current = await this.load(storeId)
    current.sales = { ...current.sales, ...sales }
    return this.save(storeId, current)
  }

  async updatePayments(storeId: string, payments: Partial<PaymentSettings>): Promise<boolean> {
    const current = await this.load(storeId)
    current.payments = { ...current.payments, ...payments }
    return this.save(storeId, current)
  }

  async updateNotifications(storeId: string, notifications: Partial<NotificationSettings>): Promise<boolean> {
    const current = await this.load(storeId)
    current.notifications = { ...current.notifications, ...notifications }
    return this.save(storeId, current)
  }

  async updateIntegrations(storeId: string, integrations: Partial<IntegrationSettings>): Promise<boolean> {
    const current = await this.load(storeId)
    current.integrations = { ...current.integrations, ...integrations }
    return this.save(storeId, current)
  }

  async updateBusinessHours(storeId: string, hours: BusinessHour[]): Promise<boolean> {
    const current = await this.load(storeId)
    current.businessHours = hours
    return this.save(storeId, current)
  }

  async updateStoreInfo(storeId: string, info: Partial<StoreInfo>): Promise<boolean> {
    const current = await this.load(storeId)
    current.info = { ...current.info, ...info }
    return this.save(storeId, current)
  }

  // Helpers para merge com defaults
  private mergeSalesSettings(sales?: Partial<SalesSettings>): SalesSettings {
    if (!sales) return DEFAULT_SALES_SETTINGS
    return {
      delivery: { ...DEFAULT_SALES_SETTINGS.delivery, ...sales.delivery },
      pickup: { ...DEFAULT_SALES_SETTINGS.pickup, ...sales.pickup },
      tables: { ...DEFAULT_SALES_SETTINGS.tables, ...sales.tables },
      scheduling: { ...DEFAULT_SALES_SETTINGS.scheduling, ...sales.scheduling },
      reservations: { ...DEFAULT_SALES_SETTINGS.reservations, ...sales.reservations },
      inventory: { ...DEFAULT_SALES_SETTINGS.inventory, ...sales.inventory },
      kitchen: { ...DEFAULT_SALES_SETTINGS.kitchen, ...sales.kitchen },
      printer: { ...DEFAULT_SALES_SETTINGS.printer, ...sales.printer }
    }
  }

  private mergePaymentSettings(payments?: Partial<PaymentSettings>): PaymentSettings {
    if (!payments) return DEFAULT_PAYMENT_SETTINGS
    return {
      cash: payments.cash ?? DEFAULT_PAYMENT_SETTINGS.cash,
      credit: payments.credit ?? DEFAULT_PAYMENT_SETTINGS.credit,
      debit: payments.debit ?? DEFAULT_PAYMENT_SETTINGS.debit,
      pix: { ...DEFAULT_PAYMENT_SETTINGS.pix, ...payments.pix }
    }
  }

  private mergeNotificationSettings(notifications?: Partial<NotificationSettings>): NotificationSettings {
    if (!notifications) return DEFAULT_NOTIFICATION_SETTINGS
    return {
      whatsapp: { ...DEFAULT_NOTIFICATION_SETTINGS.whatsapp, ...notifications.whatsapp },
      email: { ...DEFAULT_NOTIFICATION_SETTINGS.email, ...notifications.email },
      sounds: { ...DEFAULT_NOTIFICATION_SETTINGS.sounds, ...notifications.sounds }
    }
  }

  private mergeIntegrationSettings(integrations?: Partial<IntegrationSettings>): IntegrationSettings {
    if (!integrations) return DEFAULT_INTEGRATION_SETTINGS
    return {
      ifood: { ...DEFAULT_INTEGRATION_SETTINGS.ifood, ...integrations.ifood },
      rappi: { ...DEFAULT_INTEGRATION_SETTINGS.rappi, ...integrations.rappi },
      uberEats: { ...DEFAULT_INTEGRATION_SETTINGS.uberEats, ...integrations.uberEats },
      loggi: { ...DEFAULT_INTEGRATION_SETTINGS.loggi, ...integrations.loggi },
      googleReviews: { ...DEFAULT_INTEGRATION_SETTINGS.googleReviews, ...integrations.googleReviews }
    }
  }
}

export const settingsService = new SettingsService()
