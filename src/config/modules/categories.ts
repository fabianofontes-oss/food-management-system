import type { Category, IntegrationSubcategory } from './types'

export const CATEGORIES: Category[] = [
  { id: 'store', name: '🏪 Minha Loja', description: 'Dados e aparência' },
  { id: 'sales', name: '💰 Vendas', description: 'Canais de venda' },
  { id: 'payments', name: '💳 Pagamentos', description: 'Formas de pagamento' },
  { id: 'operations', name: '⚙️ Operações', description: 'Gestão interna' },
  { id: 'integrations', name: '🔗 Integrações', description: 'Plataformas externas' },
  { id: 'marketing', name: '📣 Marketing', description: 'Promoções e fidelidade' },
  { id: 'notifications', name: '🔔 Notificações', description: 'Comunicação' }
]

export const INTEGRATION_SUBCATEGORIES: IntegrationSubcategory[] = [
  { id: 'delivery_platforms', name: '🚚 Plataformas de Delivery', description: 'Receba pedidos de marketplaces' },
  { id: 'social_commerce', name: '🛍️ Canais de Venda', description: 'Venda no WhatsApp, Instagram e Facebook' },
  { id: 'payment_gateways', name: '💳 Gateways de Pagamento', description: 'Pagamentos online (PIX, cartão, boleto)' },
  { id: 'payment_machines', name: '🔌 Maquininhas', description: 'Integração com máquinas de cartão' },
  { id: 'fiscal', name: '📄 Fiscal', description: 'Nota fiscal eletrônica' },
  { id: 'erp', name: '🏢 ERP & Financeiro', description: 'Gestão empresarial e contábil' },
  { id: 'analytics', name: '📊 Analytics & Marketing', description: 'Rastreamento e conversões' },
  { id: 'maps', name: '🗺️ Mapas & Localização', description: 'Cálculo de distância e rotas' },
  { id: 'communication', name: '💬 Comunicação', description: 'Notificações e mensagens' },
  { id: 'crm', name: '👥 CRM', description: 'Gestão de relacionamento' }
]
