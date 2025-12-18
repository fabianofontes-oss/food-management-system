import { NextRequest, NextResponse } from 'next/server'

/**
 * API para listar todos os mocks, placeholders e funcionalidades incompletas do sistema
 */

interface MockItem {
  path: string
  name: string
  type: 'placeholder_page' | 'coming_soon' | 'mock_data' | 'incomplete' | 'hardcoded'
  description: string
  priority: 'high' | 'medium' | 'low'
}

// Lista de todos os mocks e placeholders conhecidos no sistema
const KNOWN_MOCKS: MockItem[] = [
  // ========== PÁGINAS PLACEHOLDER (Super Admin) ==========
  {
    path: '/admin/logs',
    name: 'Logs de Auditoria',
    type: 'placeholder_page',
    description: 'Página existe mas exibe apenas "Em breve". Não registra logs.',
    priority: 'high'
  },
  {
    path: '/admin/tickets',
    name: 'Sistema de Tickets',
    type: 'placeholder_page',
    description: 'Página existe mas exibe apenas "Em breve". Não tem sistema de suporte.',
    priority: 'medium'
  },
  {
    path: '/admin/features',
    name: 'Feature Flags',
    type: 'placeholder_page',
    description: 'Página existe mas exibe apenas "Em breve". Não controla features dinamicamente.',
    priority: 'low'
  },
  {
    path: '/admin/automations',
    name: 'Automações',
    type: 'placeholder_page',
    description: 'Página existe mas exibe apenas "Em breve". Emails e triggers não automáticos.',
    priority: 'high'
  },
  {
    path: '/admin/reports',
    name: 'Relatórios Avançados',
    type: 'placeholder_page',
    description: 'Página existe mas funcionalidade limitada.',
    priority: 'medium'
  },

  // ========== INTEGRAÇÕES NÃO IMPLEMENTADAS ==========
  {
    path: '/{slug}/dashboard/settings/integrations',
    name: 'Integração iFood',
    type: 'coming_soon',
    description: 'Badge "Em Breve" - Não há integração real com iFood.',
    priority: 'high'
  },
  {
    path: '/{slug}/dashboard/settings/integrations',
    name: 'Integração Rappi',
    type: 'coming_soon',
    description: 'Badge "Em Breve" - Não há integração real com Rappi.',
    priority: 'medium'
  },
  {
    path: '/{slug}/dashboard/reviews/integrations',
    name: 'Integração Google Reviews',
    type: 'incomplete',
    description: 'Página existe mas requer configuração OAuth que pode não estar completa.',
    priority: 'medium'
  },

  // ========== DADOS MOCK/HARDCODED ==========
  {
    path: '/admin/settings',
    name: 'Configurações do Sistema',
    type: 'hardcoded',
    description: 'Settings são locais (useState), não persistem no banco de dados.',
    priority: 'high'
  },
  {
    path: '/{slug}/dashboard/analytics',
    name: 'Analytics da Loja',
    type: 'incomplete',
    description: 'Dados podem ser imprecisos. Falta tracking de eventos real.',
    priority: 'medium'
  },
  {
    path: '/admin/analytics',
    name: 'Analytics do SaaS',
    type: 'incomplete',
    description: 'MRR baseado em faturas, não em billing real. Churn não calculado.',
    priority: 'high'
  },

  // ========== FUNCIONALIDADES INCOMPLETAS ==========
  {
    path: '/{slug}/dashboard/marketing',
    name: 'Campanhas de Marketing',
    type: 'incomplete',
    description: 'Falta integração com email marketing e push notifications.',
    priority: 'medium'
  },
  {
    path: '/{slug}/dashboard/crm',
    name: 'CRM de Clientes',
    type: 'incomplete',
    description: 'Funciona básico, falta segmentação avançada e automações.',
    priority: 'low'
  },
  {
    path: '/{slug}/dashboard/reservations',
    name: 'Sistema de Reservas',
    type: 'incomplete',
    description: 'Funciona básico, falta confirmação automática e lembretes.',
    priority: 'low'
  },

  // ========== BILLING ==========
  {
    path: '/api/webhooks/mercadopago',
    name: 'Webhook MercadoPago',
    type: 'incomplete',
    description: 'Implementado mas requer configuração no painel MP. Falta testes em produção.',
    priority: 'high'
  },
  {
    path: '/api/cron/billing',
    name: 'Cron de Billing',
    type: 'incomplete',
    description: 'Implementado mas precisa ser configurado no Vercel Cron ou similar.',
    priority: 'high'
  },

  // ========== EMAIL ==========
  {
    path: 'Sistema de Email',
    name: 'Emails Transacionais',
    type: 'incomplete',
    description: 'Não há sistema de email configurado. Faturas, lembretes, etc não são enviados.',
    priority: 'high'
  },

  // ========== OUTROS ==========
  {
    path: '/{slug}/dashboard/delivery',
    name: 'Gestão de Entregadores',
    type: 'incomplete',
    description: 'Cadastro funciona, falta tracking GPS e integração com apps de entrega.',
    priority: 'low'
  },
  {
    path: '/{slug}/dashboard/inventory',
    name: 'Controle de Estoque',
    type: 'incomplete',
    description: 'Funciona básico, falta alertas automáticos e integração com pedidos.',
    priority: 'medium'
  },
]

export async function GET(request: NextRequest) {
  // Agrupar por tipo
  const byType = {
    placeholder_page: KNOWN_MOCKS.filter(m => m.type === 'placeholder_page'),
    coming_soon: KNOWN_MOCKS.filter(m => m.type === 'coming_soon'),
    incomplete: KNOWN_MOCKS.filter(m => m.type === 'incomplete'),
    hardcoded: KNOWN_MOCKS.filter(m => m.type === 'hardcoded'),
    mock_data: KNOWN_MOCKS.filter(m => m.type === 'mock_data')
  }

  // Agrupar por prioridade
  const byPriority = {
    high: KNOWN_MOCKS.filter(m => m.priority === 'high'),
    medium: KNOWN_MOCKS.filter(m => m.priority === 'medium'),
    low: KNOWN_MOCKS.filter(m => m.priority === 'low')
  }

  // Estatísticas
  const stats = {
    total: KNOWN_MOCKS.length,
    byType: {
      placeholder_page: byType.placeholder_page.length,
      coming_soon: byType.coming_soon.length,
      incomplete: byType.incomplete.length,
      hardcoded: byType.hardcoded.length,
      mock_data: byType.mock_data.length
    },
    byPriority: {
      high: byPriority.high.length,
      medium: byPriority.medium.length,
      low: byPriority.low.length
    }
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    stats,
    byType,
    byPriority,
    all: KNOWN_MOCKS
  })
}
