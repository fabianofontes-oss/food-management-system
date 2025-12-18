import { NextRequest, NextResponse } from 'next/server'

/**
 * API para listar todos os mocks, placeholders e funcionalidades incompletas do sistema
 */

interface MockItem {
  path: string
  name: string
  type: 'placeholder_page' | 'coming_soon' | 'mock_data' | 'incomplete' | 'hardcoded' | 'dead_button' | 'dead_link'
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

  // ========== BOTÕES NÃO CLICÁVEIS (DEAD BUTTONS) ==========
  {
    path: '/{slug}/dashboard/settings/integrations',
    name: 'Botão "Conectar iFood"',
    type: 'dead_button',
    description: 'Botão existe mas está desabilitado ou não faz nada ao clicar.',
    priority: 'high'
  },
  {
    path: '/{slug}/dashboard/settings/integrations',
    name: 'Botão "Conectar Rappi"',
    type: 'dead_button',
    description: 'Botão existe mas está desabilitado ou não faz nada ao clicar.',
    priority: 'medium'
  },
  {
    path: '/{slug}/dashboard/marketing',
    name: 'Botão "Criar Campanha"',
    type: 'dead_button',
    description: 'Botão abre modal mas não salva/envia campanha real.',
    priority: 'medium'
  },
  {
    path: '/{slug}/dashboard/settings/platforms',
    name: 'Botões de Plataformas',
    type: 'dead_button',
    description: 'Toggles de ativar/desativar plataformas podem não persistir.',
    priority: 'medium'
  },
  {
    path: '/admin/settings',
    name: 'Botão "Salvar Configurações"',
    type: 'dead_button',
    description: 'Configurações são salvas em estado local, não no banco.',
    priority: 'high'
  },
  {
    path: '/{slug}/dashboard/crm',
    name: 'Botão "Enviar SMS/Email"',
    type: 'dead_button',
    description: 'Não há integração com serviço de SMS/Email.',
    priority: 'high'
  },
  {
    path: '/{slug}/dashboard/reservations',
    name: 'Botão "Enviar Lembrete"',
    type: 'dead_button',
    description: 'Não envia lembrete real por SMS/WhatsApp.',
    priority: 'medium'
  },

  // ========== LINKS QUEBRADOS / SEM ROTA ==========
  {
    path: '/admin/partners',
    name: 'Link "Ver Detalhes do Parceiro"',
    type: 'dead_link',
    description: 'Link existe mas página de detalhes não foi implementada.',
    priority: 'low'
  },
  {
    path: '/{slug}/dashboard/financial',
    name: 'Link "Exportar Relatório"',
    type: 'dead_link',
    description: 'Link de exportação pode não funcionar ou baixar arquivo vazio.',
    priority: 'medium'
  },
  {
    path: '/{slug}/dashboard/orders',
    name: 'Link "Ver Nota Fiscal"',
    type: 'dead_link',
    description: 'Não há integração com sistema de NF-e.',
    priority: 'high'
  },
  {
    path: '/{slug}/dashboard/reports',
    name: 'Link "Relatório Fiscal"',
    type: 'dead_link',
    description: 'Relatório fiscal não implementado.',
    priority: 'medium'
  },
  {
    path: '/{slug}/dashboard/team',
    name: 'Link "Histórico do Funcionário"',
    type: 'dead_link',
    description: 'Página de histórico não existe.',
    priority: 'low'
  },
  {
    path: '/admin/users',
    name: 'Link "Ver Atividade do Usuário"',
    type: 'dead_link',
    description: 'Não há tracking de atividade de usuários.',
    priority: 'low'
  },
  {
    path: '/{slug}/dashboard',
    name: 'Link "Ver Mais" em Gráficos',
    type: 'dead_link',
    description: 'Links de "ver mais" em cards podem não ter página destino.',
    priority: 'low'
  },
]

export async function GET(request: NextRequest) {
  // Agrupar por tipo
  const byType = {
    placeholder_page: KNOWN_MOCKS.filter(m => m.type === 'placeholder_page'),
    coming_soon: KNOWN_MOCKS.filter(m => m.type === 'coming_soon'),
    incomplete: KNOWN_MOCKS.filter(m => m.type === 'incomplete'),
    hardcoded: KNOWN_MOCKS.filter(m => m.type === 'hardcoded'),
    mock_data: KNOWN_MOCKS.filter(m => m.type === 'mock_data'),
    dead_button: KNOWN_MOCKS.filter(m => m.type === 'dead_button'),
    dead_link: KNOWN_MOCKS.filter(m => m.type === 'dead_link')
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
      mock_data: byType.mock_data.length,
      dead_button: byType.dead_button.length,
      dead_link: byType.dead_link.length
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
