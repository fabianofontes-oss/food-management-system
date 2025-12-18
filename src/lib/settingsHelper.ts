import { StoreSettings } from '@/hooks/useSettings'

/**
 * Helper para verificar se uma funcionalidade está habilitada
 */
export class SettingsHelper {
  constructor(private settings: StoreSettings) {}
 
  private get s(): any {
    return this.settings as any
  }

  // Funcionalidades Principais
  get isKitchenEnabled() { return (this.s.sales?.kitchen?.enabled ?? this.s.enable_kitchen ?? false) as boolean }
  get isDeliveryEnabled() { return (this.s.sales?.delivery?.enabled ?? this.s.enable_delivery ?? false) as boolean }
  get isDineInEnabled() { return (this.s.sales?.tables?.enabled ?? this.s.enable_dine_in ?? false) as boolean }
  get isTakeoutEnabled() { return (this.s.sales?.pickup?.enabled ?? this.s.enable_takeout ?? false) as boolean }

  // Formas de Pagamento
  get isCashEnabled() { return (this.s.payments?.cash ?? this.s.enable_cash ?? false) as boolean }
  get isCreditCardEnabled() { return (this.s.payments?.credit ?? this.s.enable_credit_card ?? false) as boolean }
  get isDebitCardEnabled() { return (this.s.payments?.debit ?? this.s.enable_debit_card ?? false) as boolean }
  get isPixEnabled() { return (this.s.payments?.pix?.enabled ?? this.s.enable_pix ?? false) as boolean }

  // Notificações
  get areOrderNotificationsEnabled() { return (this.s.notifications?.whatsapp?.notifyOrder ?? this.s.enable_order_notifications ?? false) as boolean }
  get areWhatsAppNotificationsEnabled() { return (this.s.notifications?.whatsapp?.enabled ?? this.s.enable_whatsapp_notifications ?? false) as boolean }
  get areEmailNotificationsEnabled() { return (this.s.notifications?.email?.enabled ?? this.s.enable_email_notifications ?? false) as boolean }
  get areSoundAlertsEnabled() { return (this.s.notifications?.sounds?.enabled ?? this.s.enable_sound_alerts ?? false) as boolean }

  // Recursos Avançados
  get isLoyaltyProgramEnabled() { return (this.s.enable_loyalty_program ?? false) as boolean }
  get areCouponsEnabled() { return (this.s.enable_coupons ?? false) as boolean }
  get areScheduledOrdersEnabled() { return (this.s.sales?.scheduling?.enabled ?? this.s.enable_scheduled_orders ?? false) as boolean }
  get isTableManagementEnabled() { return (this.s.sales?.tables?.enabled ?? this.s.enable_table_management ?? false) as boolean }
  get isInventoryControlEnabled() { return (this.s.sales?.inventory?.enabled ?? this.s.enable_inventory_control ?? false) as boolean }

  // Impressão
  get isAutoPrintEnabled() { return (this.s.sales?.printer?.auto ?? this.s.enable_auto_print ?? false) as boolean }
  get isKitchenPrintEnabled() { return (this.s.sales?.printer?.enabled ?? this.s.enable_kitchen_print ?? false) as boolean }

  // Integrações
  get isIfoodEnabled() { return (this.s.integrations?.ifood?.enabled ?? this.s.enable_ifood ?? false) as boolean }
  get isRappiEnabled() { return (this.s.integrations?.rappi?.enabled ?? this.s.enable_rappi ?? false) as boolean }
  get isUberEatsEnabled() { return (this.s.integrations?.uberEats?.enabled ?? this.s.enable_uber_eats ?? false) as boolean }

  // Operação
  get minimumOrderValue() { return (this.s.sales?.delivery?.minOrder ?? this.s.minimum_order_value ?? 0) as number }
  get deliveryFee() { return (this.s.sales?.delivery?.fee ?? this.s.delivery_fee ?? 0) as number }
  get deliveryRadius() { return (this.s.sales?.delivery?.radius ?? this.s.delivery_radius ?? 0) as number }
  get estimatedPrepTime() { return (this.s.sales?.delivery?.time ?? this.s.estimated_prep_time ?? 0) as number }

  /**
   * Verifica se pelo menos uma forma de pagamento está habilitada
   */
  hasPaymentMethodsEnabled(): boolean {
    return this.isCashEnabled || 
           this.isCreditCardEnabled || 
           this.isDebitCardEnabled || 
           this.isPixEnabled
  }

  /**
   * Retorna lista de formas de pagamento habilitadas
   */
  getEnabledPaymentMethods(): string[] {
    const methods: string[] = []
    if (this.isCashEnabled) methods.push('cash')
    if (this.isCreditCardEnabled) methods.push('credit_card')
    if (this.isDebitCardEnabled) methods.push('debit_card')
    if (this.isPixEnabled) methods.push('pix')
    return methods
  }

  /**
   * Verifica se alguma integração de delivery está habilitada
   */
  hasDeliveryIntegrationsEnabled(): boolean {
    return this.isIfoodEnabled || this.isRappiEnabled || this.isUberEatsEnabled
  }

  /**
   * Retorna lista de integrações habilitadas
   */
  getEnabledIntegrations(): string[] {
    const integrations: string[] = []
    if (this.isIfoodEnabled) integrations.push('ifood')
    if (this.isRappiEnabled) integrations.push('rappi')
    if (this.isUberEatsEnabled) integrations.push('uber_eats')
    return integrations
  }

  /**
   * Valida se o valor do pedido atende o mínimo
   */
  isOrderValueValid(value: number): boolean {
    const min = Number(this.minimumOrderValue || 0)
    if (!Number.isFinite(min)) return true
    return value >= min
  }

  /**
   * Calcula taxa de entrega baseada na distância
   */
  calculateDeliveryFee(distanceKm: number): number {
    if (distanceKm > this.deliveryRadius) {
      return -1 // Fora da área de entrega
    }
    return this.deliveryFee
  }
}

/**
 * Hook helper para usar configurações com métodos auxiliares
 */
export function useSettingsHelper(settings: StoreSettings) {
  return new SettingsHelper(settings)
}
