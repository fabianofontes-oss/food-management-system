/**
 * ============================================================
 * MÓDULOS DO SISTEMA - CONTROLE POR PLANO
 * ============================================================
 * 
 * REGRA OBRIGATÓRIA:
 * Sempre que adicionar uma nova funcionalidade/página no dashboard,
 * você DEVE adicionar o módulo aqui para que o Super Admin possa
 * ativar/desativar por plano.
 * 
 * PASSOS:
 * 1. Adicione o módulo no array PLAN_MODULES abaixo
 * 2. Adicione no menu em DashboardClient.tsx com hasModule('id')
 * 
 * ESTRUTURA:
 * {
 *   id: 'nome_unico',           // ID único do módulo
 *   name: 'Nome Exibido',       // Nome no painel de planos
 *   description: 'Descrição',   // Descrição curta
 *   category: 'sales',          // core|sales|operations|marketing|advanced
 *   icon: 'NomeLucide'          // Nome do ícone Lucide
 * }
 * 
 * CATEGORIAS:
 * - core: Sempre incluídos (não podem ser desativados)
 * - sales: Funcionalidades de venda (PDV, Mesas, Delivery)
 * - operations: Gestão interna (Cozinha, Estoque, Financeiro)
 * - marketing: Promoções e clientes (Cupons, CRM, Campanhas)
 * - advanced: Funcionalidades extras (Analytics, Relatórios)
 * ============================================================
 */

export interface PlanModule {
  id: string
  name: string
  description: string
  category: 'core' | 'sales' | 'operations' | 'marketing' | 'advanced'
  icon: string // Nome do ícone Lucide
}

export const PLAN_MODULES: PlanModule[] = [
  // === CORE (sempre incluídos, não podem ser desativados) ===
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Painel principal com visão geral',
    category: 'core',
    icon: 'LayoutDashboard'
  },
  {
    id: 'products',
    name: 'Cardápio / Produtos',
    description: 'Cadastro de produtos e categorias',
    category: 'core',
    icon: 'Package'
  },
  {
    id: 'orders',
    name: 'Pedidos',
    description: 'Gestão de pedidos recebidos',
    category: 'core',
    icon: 'ShoppingCart'
  },
  {
    id: 'settings',
    name: 'Configurações',
    description: 'Configurações básicas da loja',
    category: 'core',
    icon: 'Settings'
  },

  // === VENDAS ===
  {
    id: 'pos',
    name: 'PDV (Ponto de Venda)',
    description: 'Venda no balcão com interface otimizada',
    category: 'sales',
    icon: 'Monitor'
  },
  {
    id: 'pos_new',
    name: 'PDV Novo (Beta)',
    description: 'Nova versão do PDV com mais recursos',
    category: 'sales',
    icon: 'Monitor'
  },
  {
    id: 'delivery',
    name: 'Delivery',
    description: 'Gestão de entregas e entregadores',
    category: 'sales',
    icon: 'Truck'
  },
  {
    id: 'tables',
    name: 'Mesas',
    description: 'Gestão de mesas e comandas',
    category: 'sales',
    icon: 'UtensilsCrossed'
  },
  {
    id: 'reservations',
    name: 'Reservas',
    description: 'Sistema de reservas de mesas',
    category: 'sales',
    icon: 'Calendar'
  },
  {
    id: 'waiters',
    name: 'Garçons',
    description: 'Gestão de garçons e atendimento',
    category: 'sales',
    icon: 'Users'
  },

  // === OPERAÇÕES ===
  {
    id: 'kitchen',
    name: 'Cozinha (KDS)',
    description: 'Painel de produção para cozinha',
    category: 'operations',
    icon: 'ChefHat'
  },
  {
    id: 'inventory',
    name: 'Estoque',
    description: 'Controle de estoque e insumos',
    category: 'operations',
    icon: 'Archive'
  },
  {
    id: 'financial',
    name: 'Financeiro',
    description: 'Controle de caixa e finanças',
    category: 'operations',
    icon: 'DollarSign'
  },
  {
    id: 'team',
    name: 'Equipe',
    description: 'Gestão de funcionários e permissões',
    category: 'operations',
    icon: 'Users'
  },
  {
    id: 'onboarding',
    name: 'Onboarding',
    description: 'Assistente de configuração inicial',
    category: 'operations',
    icon: 'Sparkles'
  },

  // === MARKETING ===
  {
    id: 'coupons',
    name: 'Cupons',
    description: 'Cupons de desconto',
    category: 'marketing',
    icon: 'Tag'
  },
  {
    id: 'crm',
    name: 'CRM / Clientes',
    description: 'Gestão de clientes e fidelidade',
    category: 'marketing',
    icon: 'Users'
  },
  {
    id: 'marketing',
    name: 'Marketing',
    description: 'Campanhas e promoções',
    category: 'marketing',
    icon: 'Megaphone'
  },
  {
    id: 'reviews',
    name: 'Avaliações',
    description: 'Gestão de avaliações e feedback',
    category: 'marketing',
    icon: 'Star'
  },

  // === AVANÇADO ===
  {
    id: 'analytics',
    name: 'Analytics',
    description: 'Relatórios e métricas avançadas',
    category: 'advanced',
    icon: 'BarChart3'
  },
  {
    id: 'reports',
    name: 'Relatórios',
    description: 'Relatórios detalhados e exportação',
    category: 'advanced',
    icon: 'FileText'
  },
  {
    id: 'custom_orders',
    name: 'Encomendas',
    description: 'Sistema de encomendas personalizadas',
    category: 'advanced',
    icon: 'Package'
  },
  {
    id: 'addons',
    name: 'Adicionais/Modificadores',
    description: 'Gestão avançada de modificadores',
    category: 'advanced',
    icon: 'Layers'
  },
  {
    id: 'kits',
    name: 'Kits/Combos',
    description: 'Montagem de kits e combos',
    category: 'advanced',
    icon: 'Gift'
  },
  {
    id: 'appearance',
    name: 'Aparência',
    description: 'Personalização visual do cardápio',
    category: 'advanced',
    icon: 'Palette'
  },
  {
    id: 'pdv_config',
    name: 'Configuração PDV',
    description: 'Configurações avançadas do PDV',
    category: 'advanced',
    icon: 'Settings'
  }
]

export const MODULE_CATEGORIES = [
  { id: 'core', name: 'Essenciais', description: 'Sempre incluídos' },
  { id: 'sales', name: 'Vendas', description: 'Canais de venda' },
  { id: 'operations', name: 'Operações', description: 'Gestão interna' },
  { id: 'marketing', name: 'Marketing', description: 'Promoções e clientes' },
  { id: 'advanced', name: 'Avançado', description: 'Funcionalidades extras' }
]

/**
 * Retorna os módulos padrão para um plano novo (todos os core ativados)
 */
export function getDefaultPlanModules(): string[] {
  return PLAN_MODULES
    .filter(m => m.category === 'core')
    .map(m => m.id)
}

/**
 * Retorna todos os módulos ativados (para plano premium)
 */
export function getAllModules(): string[] {
  return PLAN_MODULES.map(m => m.id)
}
