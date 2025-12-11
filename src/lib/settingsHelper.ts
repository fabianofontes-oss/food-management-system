import { StoreSettings } from '@/hooks/useSettings'

/**
 * Helper para verificar se uma funcionalidade está habilitada
 */
export class SettingsHelper {
  constructor(private settings: StoreSettings) {}

  // Funcionalidades Principais
  get isPOSEnabled() { return this.settings.enable_pos }
  get isKitchenEnabled() { return this.settings.enable_kitchen }
  get isDeliveryEnabled() { return this.settings.enable_delivery }
  get isDineInEnabled() { return this.settings.enable_dine_in }
  get isTakeoutEnabled() { return this.settings.enable_takeout }

  // Formas de Pagamento
  get isCashEnabled() { return this.settings.enable_cash }
  get isCreditCardEnabled() { return this.settings.enable_credit_card }
  get isDebitCardEnabled() { return this.settings.enable_debit_card }
  get isPixEnabled() { return this.settings.enable_pix }

  // Notificações
  get areOrderNotificationsEnabled() { return this.settings.enable_order_notifications }
  get areWhatsAppNotificationsEnabled() { return this.settings.enable_whatsapp_notifications }
  get areEmailNotificationsEnabled() { return this.settings.enable_email_notifications }
  get areSoundAlertsEnabled() { return this.settings.enable_sound_alerts }

  // Recursos Avançados
  get isLoyaltyProgramEnabled() { return this.settings.enable_loyalty_program }
  get areCouponsEnabled() { return this.settings.enable_coupons }
  get areScheduledOrdersEnabled() { return this.settings.enable_scheduled_orders }
  get isTableManagementEnabled() { return this.settings.enable_table_management }
  get isInventoryControlEnabled() { return this.settings.enable_inventory_control }

  // Impressão
  get isAutoPrintEnabled() { return this.settings.enable_auto_print }
  get isKitchenPrintEnabled() { return this.settings.enable_kitchen_print }

  // Integrações
  get isIfoodEnabled() { return this.settings.enable_ifood }
  get isRappiEnabled() { return this.settings.enable_rappi }
  get isUberEatsEnabled() { return this.settings.enable_uber_eats }

  // Operação
  get minimumOrderValue() { return this.settings.minimum_order_value }
  get deliveryFee() { return this.settings.delivery_fee }
  get deliveryRadius() { return this.settings.delivery_radius }
  get estimatedPrepTime() { return this.settings.estimated_prep_time }

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
    return value >= this.minimumOrderValue
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
