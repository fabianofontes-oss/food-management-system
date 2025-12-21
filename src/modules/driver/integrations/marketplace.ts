/**
 * Integração com Marketplaces de Delivery
 * iFood, Rappi, Uber Eats
 */

import { logger } from '@/lib/logger'

export type MarketplaceProvider = 'ifood' | 'rappi' | 'uber_eats'

export interface MarketplaceConfig {
  provider: MarketplaceProvider
  enabled: boolean
  apiKey?: string
  merchantId?: string
  webhookSecret?: string
  autoAccept: boolean
  syncMenu: boolean
  syncOrders: boolean
}

export interface MarketplaceOrder {
  id: string
  externalId: string
  provider: MarketplaceProvider
  status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'dispatched' | 'delivered' | 'cancelled'
  customer: {
    name: string
    phone: string
    address: string
    addressComplement?: string
    latitude?: number
    longitude?: number
  }
  items: Array<{
    name: string
    quantity: number
    unitPrice: number
    notes?: string
  }>
  subtotal: number
  deliveryFee: number
  total: number
  paymentMethod: string
  prepareTime: number
  createdAt: string
}

export interface MarketplaceDelivery {
  id: string
  orderId: string
  provider: MarketplaceProvider
  driver?: {
    name: string
    phone: string
    photoUrl?: string
    vehicleType: string
    vehiclePlate?: string
    latitude?: number
    longitude?: number
  }
  status: 'searching' | 'assigned' | 'arriving_pickup' | 'picked_up' | 'arriving_delivery' | 'delivered'
  estimatedPickup?: string
  estimatedDelivery?: string
  trackingUrl?: string
}

/**
 * URLs base dos marketplaces
 */
export const MARKETPLACE_URLS = {
  ifood: {
    api: 'https://merchant-api.ifood.com.br',
    oauth: 'https://merchant-api.ifood.com.br/authentication/v1.0/oauth/token',
    docs: 'https://developer.ifood.com.br/'
  },
  rappi: {
    api: 'https://services.rappi.com.br',
    docs: 'https://dev-portal.rappi.com/'
  },
  uber_eats: {
    api: 'https://api.uber.com',
    oauth: 'https://login.uber.com/oauth/v2/token',
    docs: 'https://developer.uber.com/docs/eats'
  }
}

/**
 * Status mapping entre marketplaces e sistema interno
 */
export const STATUS_MAPPING = {
  ifood: {
    'PLACED': 'pending',
    'CONFIRMED': 'accepted',
    'PREPARATION_STARTED': 'preparing',
    'READY_TO_PICKUP': 'ready',
    'DISPATCHED': 'dispatched',
    'CONCLUDED': 'delivered',
    'CANCELLED': 'cancelled'
  },
  rappi: {
    'created': 'pending',
    'accepted': 'accepted',
    'in_preparation': 'preparing',
    'ready_for_pickup': 'ready',
    'on_the_way': 'dispatched',
    'delivered': 'delivered',
    'cancelled': 'cancelled'
  },
  uber_eats: {
    'CREATED': 'pending',
    'ACCEPTED': 'accepted',
    'IN_PROGRESS': 'preparing',
    'READY_FOR_PICKUP': 'ready',
    'IN_DELIVERY': 'dispatched',
    'DELIVERED': 'delivered',
    'CANCELLED': 'cancelled'
  }
}

/**
 * Classe base para integração com marketplace
 */
export abstract class MarketplaceIntegration {
  protected config: MarketplaceConfig
  protected accessToken?: string
  protected tokenExpiry?: Date

  constructor(config: MarketplaceConfig) {
    this.config = config
  }

  abstract authenticate(): Promise<void>
  abstract getOrders(): Promise<MarketplaceOrder[]>
  abstract acceptOrder(orderId: string): Promise<boolean>
  abstract rejectOrder(orderId: string, reason: string): Promise<boolean>
  abstract updateOrderStatus(orderId: string, status: string): Promise<boolean>
  abstract requestDelivery(orderId: string): Promise<MarketplaceDelivery | null>
  abstract getDeliveryStatus(deliveryId: string): Promise<MarketplaceDelivery | null>
}

/**
 * Integração iFood (placeholder - requer credenciais reais)
 */
export class IFoodIntegration extends MarketplaceIntegration {
  async authenticate(): Promise<void> {
    if (!this.config.apiKey) {
      throw new Error('API Key do iFood não configurada')
    }

    // Em produção, fazer chamada OAuth real
    logger.debug('[iFood] Autenticando...')
    this.accessToken = 'mock_token'
    this.tokenExpiry = new Date(Date.now() + 3600000) // 1 hora
  }

  async getOrders(): Promise<MarketplaceOrder[]> {
    await this.ensureAuthenticated()
    // Em produção, fazer chamada real à API
    logger.debug('[iFood] Buscando pedidos...')
    return []
  }

  async acceptOrder(orderId: string): Promise<boolean> {
    await this.ensureAuthenticated()
    logger.debug(`[iFood] Aceitando pedido ${orderId}...`)
    return true
  }

  async rejectOrder(orderId: string, reason: string): Promise<boolean> {
    await this.ensureAuthenticated()
    logger.debug(`[iFood] Rejeitando pedido ${orderId}: ${reason}`)
    return true
  }

  async updateOrderStatus(orderId: string, status: string): Promise<boolean> {
    await this.ensureAuthenticated()
    logger.debug(`[iFood] Atualizando status ${orderId} -> ${status}`)
    return true
  }

  async requestDelivery(orderId: string): Promise<MarketplaceDelivery | null> {
    await this.ensureAuthenticated()
    logger.debug(`[iFood] Solicitando entregador para ${orderId}`)
    return null
  }

  async getDeliveryStatus(deliveryId: string): Promise<MarketplaceDelivery | null> {
    await this.ensureAuthenticated()
    logger.debug(`[iFood] Verificando status entrega ${deliveryId}`)
    return null
  }

  private async ensureAuthenticated(): Promise<void> {
    if (!this.accessToken || !this.tokenExpiry || new Date() > this.tokenExpiry) {
      await this.authenticate()
    }
  }
}

/**
 * Factory para criar integração do marketplace correto
 */
export function createMarketplaceIntegration(config: MarketplaceConfig): MarketplaceIntegration {
  switch (config.provider) {
    case 'ifood':
      return new IFoodIntegration(config)
    // case 'rappi':
    //   return new RappiIntegration(config)
    // case 'uber_eats':
    //   return new UberEatsIntegration(config)
    default:
      throw new Error(`Provider ${config.provider} não suportado`)
  }
}

/**
 * Mapeia status do marketplace para status interno
 */
export function mapMarketplaceStatus(
  provider: MarketplaceProvider,
  externalStatus: string
): string {
  const mapping = STATUS_MAPPING[provider] as Record<string, string>
  return mapping[externalStatus] || 'pending'
}

/**
 * Ícones e cores dos marketplaces
 */
export const MARKETPLACE_BRANDING = {
  ifood: {
    name: 'iFood',
    color: '#EA1D2C',
    bgColor: '#FEE8E9',
    icon: '🍔'
  },
  rappi: {
    name: 'Rappi',
    color: '#FF441F',
    bgColor: '#FFE8E4',
    icon: '🛵'
  },
  uber_eats: {
    name: 'Uber Eats',
    color: '#06C167',
    bgColor: '#E6F9EE',
    icon: '🥡'
  }
}
