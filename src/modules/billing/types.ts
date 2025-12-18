/**
 * Tipos para o módulo de billing e planos
 */

export type PlanType = 'free' | 'pro' | 'enterprise'

export type PlanStatus = 'active' | 'trial' | 'expired' | 'cancelled'

export interface Plan {
  id: PlanType
  name: string
  price: number
  features: PlanFeature[]
  limits: PlanLimits
}

export interface PlanFeature {
  id: string
  name: string
  included: boolean
}

export interface PlanLimits {
  maxStores: number
  maxProducts: number
  maxOrders: number // por mês, 0 = ilimitado
  maxUsers: number
}

export interface TenantSubscription {
  tenantId: string
  plan: PlanType
  status: PlanStatus
  trialEndsAt?: string
  currentPeriodEnd?: string
  cancelledAt?: string
}

// Definição dos planos
export const PLANS: Record<PlanType, Plan> = {
  free: {
    id: 'free',
    name: 'Gratuito',
    price: 0,
    features: [
      { id: 'basic_menu', name: 'Cardápio digital', included: true },
      { id: 'basic_orders', name: 'Gestão de pedidos', included: true },
      { id: 'reports', name: 'Relatórios básicos', included: false },
      { id: 'multi_store', name: 'Múltiplas lojas', included: false },
      { id: 'integrations', name: 'Integrações', included: false },
      { id: 'support', name: 'Suporte prioritário', included: false },
    ],
    limits: {
      maxStores: 1,
      maxProducts: 50,
      maxOrders: 100,
      maxUsers: 2,
    },
  },
  pro: {
    id: 'pro',
    name: 'Profissional',
    price: 99,
    features: [
      { id: 'basic_menu', name: 'Cardápio digital', included: true },
      { id: 'basic_orders', name: 'Gestão de pedidos', included: true },
      { id: 'reports', name: 'Relatórios avançados', included: true },
      { id: 'multi_store', name: 'Até 3 lojas', included: true },
      { id: 'integrations', name: 'Integrações básicas', included: true },
      { id: 'support', name: 'Suporte prioritário', included: false },
    ],
    limits: {
      maxStores: 3,
      maxProducts: 500,
      maxOrders: 0, // ilimitado
      maxUsers: 10,
    },
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 299,
    features: [
      { id: 'basic_menu', name: 'Cardápio digital', included: true },
      { id: 'basic_orders', name: 'Gestão de pedidos', included: true },
      { id: 'reports', name: 'Relatórios avançados', included: true },
      { id: 'multi_store', name: 'Lojas ilimitadas', included: true },
      { id: 'integrations', name: 'Todas as integrações', included: true },
      { id: 'support', name: 'Suporte prioritário', included: true },
    ],
    limits: {
      maxStores: 0, // ilimitado
      maxProducts: 0, // ilimitado
      maxOrders: 0, // ilimitado
      maxUsers: 0, // ilimitado
    },
  },
}

// Features que requerem plano específico
export const FEATURE_REQUIREMENTS: Record<string, PlanType[]> = {
  reports: ['pro', 'enterprise'],
  advanced_reports: ['enterprise'],
  multi_store: ['pro', 'enterprise'],
  integrations: ['pro', 'enterprise'],
  whatsapp_api: ['enterprise'],
  priority_support: ['enterprise'],
  custom_domain: ['enterprise'],
}
