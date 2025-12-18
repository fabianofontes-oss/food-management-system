import { NextRequest, NextResponse } from 'next/server'

/**
 * API para listar todas as páginas do sistema
 * Organizado por categoria para verificação de páginas quebradas
 */

interface PageInfo {
  path: string
  name: string
  category: string
  requiresAuth: boolean
  requiresSlug: boolean
}

// Todas as páginas do sistema organizadas por categoria
const SYSTEM_PAGES: PageInfo[] = [
  // ========== AUTENTICAÇÃO ==========
  { path: '/login', name: 'Login', category: 'Autenticação', requiresAuth: false, requiresSlug: false },
  { path: '/signup', name: 'Cadastro', category: 'Autenticação', requiresAuth: false, requiresSlug: false },
  { path: '/reset-password', name: 'Esqueci Senha', category: 'Autenticação', requiresAuth: false, requiresSlug: false },
  { path: '/update-password', name: 'Atualizar Senha', category: 'Autenticação', requiresAuth: false, requiresSlug: false },
  
  // ========== PÚBLICO ==========
  { path: '/landing', name: 'Landing Page', category: 'Público', requiresAuth: false, requiresSlug: false },
  { path: '/profile', name: 'Perfil', category: 'Público', requiresAuth: true, requiresSlug: false },
  
  // ========== DEMO (Acesso Público) ==========
  { path: '/demo', name: 'Cardápio Demo', category: 'Demo', requiresAuth: false, requiresSlug: false },
  { path: '/demo/dashboard', name: 'Dashboard Demo', category: 'Demo', requiresAuth: false, requiresSlug: false },
  { path: '/demo/dashboard/products', name: 'Produtos Demo', category: 'Demo', requiresAuth: false, requiresSlug: false },
  { path: '/demo/dashboard/orders', name: 'Pedidos Demo', category: 'Demo', requiresAuth: false, requiresSlug: false },
  { path: '/demo/dashboard/kitchen', name: 'Cozinha Demo', category: 'Demo', requiresAuth: false, requiresSlug: false },
  { path: '/demo/dashboard/pos', name: 'PDV Demo', category: 'Demo', requiresAuth: false, requiresSlug: false },
  
  // ========== SUPER ADMIN ==========
  { path: '/admin', name: 'Dashboard Admin', category: 'Super Admin', requiresAuth: true, requiresSlug: false },
  { path: '/admin/tenants', name: 'Tenants', category: 'Super Admin', requiresAuth: true, requiresSlug: false },
  { path: '/admin/stores', name: 'Lojas', category: 'Super Admin', requiresAuth: true, requiresSlug: false },
  { path: '/admin/plans', name: 'Planos', category: 'Super Admin', requiresAuth: true, requiresSlug: false },
  { path: '/admin/plans/new', name: 'Novo Plano', category: 'Super Admin', requiresAuth: true, requiresSlug: false },
  { path: '/admin/billing', name: 'Billing', category: 'Super Admin', requiresAuth: true, requiresSlug: false },
  { path: '/admin/users', name: 'Usuários', category: 'Super Admin', requiresAuth: true, requiresSlug: false },
  { path: '/admin/analytics', name: 'Analytics', category: 'Super Admin', requiresAuth: true, requiresSlug: false },
  { path: '/admin/logs', name: 'Logs', category: 'Super Admin', requiresAuth: true, requiresSlug: false },
  { path: '/admin/tickets', name: 'Tickets', category: 'Super Admin', requiresAuth: true, requiresSlug: false },
  { path: '/admin/features', name: 'Feature Flags', category: 'Super Admin', requiresAuth: true, requiresSlug: false },
  { path: '/admin/automations', name: 'Automações', category: 'Super Admin', requiresAuth: true, requiresSlug: false },
  { path: '/admin/reports', name: 'Relatórios', category: 'Super Admin', requiresAuth: true, requiresSlug: false },
  { path: '/admin/settings', name: 'Configurações', category: 'Super Admin', requiresAuth: true, requiresSlug: false },
  { path: '/admin/health', name: 'Saúde do Sistema', category: 'Super Admin', requiresAuth: true, requiresSlug: false },
  { path: '/admin/health/monitor', name: 'Health Monitor', category: 'Super Admin', requiresAuth: true, requiresSlug: false },
  { path: '/admin/health/debug', name: 'Debug Lojas', category: 'Super Admin', requiresAuth: true, requiresSlug: false },
  { path: '/admin/health/builder', name: 'Kit Builder', category: 'Super Admin', requiresAuth: true, requiresSlug: false },
  { path: '/admin/health/images', name: 'Scanner Imagens', category: 'Super Admin', requiresAuth: true, requiresSlug: false },
  { path: '/admin/health/slugs', name: 'Validador URLs', category: 'Super Admin', requiresAuth: true, requiresSlug: false },
  { path: '/admin/health/printing', name: 'Teste Impressora', category: 'Super Admin', requiresAuth: true, requiresSlug: false },
  { path: '/admin/demanda', name: 'Controle Demanda', category: 'Super Admin', requiresAuth: true, requiresSlug: false },
  { path: '/admin/integrations', name: 'Integrações', category: 'Super Admin', requiresAuth: true, requiresSlug: false },
  { path: '/admin/partners', name: 'Parceiros', category: 'Super Admin', requiresAuth: true, requiresSlug: false },
  
  // ========== LOJA (CLIENTE) ==========
  { path: '/{slug}', name: 'Cardápio Público', category: 'Loja Cliente', requiresAuth: false, requiresSlug: true },
  { path: '/{slug}/cart', name: 'Carrinho', category: 'Loja Cliente', requiresAuth: false, requiresSlug: true },
  { path: '/{slug}/checkout', name: 'Checkout', category: 'Loja Cliente', requiresAuth: false, requiresSlug: true },
  { path: '/{slug}/avaliar/{id}', name: 'Avaliação Entrega', category: 'Loja Cliente', requiresAuth: false, requiresSlug: true },
  
  // ========== DASHBOARD LOJISTA ==========
  { path: '/{slug}/dashboard', name: 'Dashboard', category: 'Dashboard Lojista', requiresAuth: true, requiresSlug: true },
  { path: '/{slug}/dashboard/products', name: 'Produtos', category: 'Dashboard Lojista', requiresAuth: true, requiresSlug: true },
  { path: '/{slug}/dashboard/orders', name: 'Pedidos', category: 'Dashboard Lojista', requiresAuth: true, requiresSlug: true },
  { path: '/{slug}/dashboard/kitchen', name: 'Cozinha', category: 'Dashboard Lojista', requiresAuth: true, requiresSlug: true },
  { path: '/{slug}/dashboard/pos', name: 'PDV', category: 'Dashboard Lojista', requiresAuth: true, requiresSlug: true },
    { path: '/{slug}/dashboard/tables', name: 'Mesas', category: 'Dashboard Lojista', requiresAuth: true, requiresSlug: true },
  { path: '/{slug}/dashboard/waiters', name: 'Garçons', category: 'Dashboard Lojista', requiresAuth: true, requiresSlug: true },
  { path: '/{slug}/dashboard/reservations', name: 'Reservas', category: 'Dashboard Lojista', requiresAuth: true, requiresSlug: true },
  { path: '/{slug}/dashboard/delivery', name: 'Entregadores', category: 'Dashboard Lojista', requiresAuth: true, requiresSlug: true },
  { path: '/{slug}/dashboard/inventory', name: 'Estoque', category: 'Dashboard Lojista', requiresAuth: true, requiresSlug: true },
  { path: '/{slug}/dashboard/financial', name: 'Financeiro', category: 'Dashboard Lojista', requiresAuth: true, requiresSlug: true },
  { path: '/{slug}/dashboard/crm', name: 'Clientes (CRM)', category: 'Dashboard Lojista', requiresAuth: true, requiresSlug: true },
  { path: '/{slug}/dashboard/team', name: 'Equipe', category: 'Dashboard Lojista', requiresAuth: true, requiresSlug: true },
  { path: '/{slug}/dashboard/coupons', name: 'Cupons', category: 'Dashboard Lojista', requiresAuth: true, requiresSlug: true },
  { path: '/{slug}/dashboard/marketing', name: 'Campanhas', category: 'Dashboard Lojista', requiresAuth: true, requiresSlug: true },
  { path: '/{slug}/dashboard/reviews', name: 'Avaliações', category: 'Dashboard Lojista', requiresAuth: true, requiresSlug: true },
  { path: '/{slug}/dashboard/analytics', name: 'Analytics', category: 'Dashboard Lojista', requiresAuth: true, requiresSlug: true },
  { path: '/{slug}/dashboard/reports', name: 'Relatórios', category: 'Dashboard Lojista', requiresAuth: true, requiresSlug: true },
  { path: '/{slug}/dashboard/custom-orders', name: 'Encomendas', category: 'Dashboard Lojista', requiresAuth: true, requiresSlug: true },
  { path: '/{slug}/dashboard/addons', name: 'Adicionais', category: 'Dashboard Lojista', requiresAuth: true, requiresSlug: true },
  { path: '/{slug}/dashboard/kits', name: 'Kits/Combos', category: 'Dashboard Lojista', requiresAuth: true, requiresSlug: true },
  { path: '/{slug}/dashboard/appearance', name: 'Aparência', category: 'Dashboard Lojista', requiresAuth: true, requiresSlug: true },
  { path: '/{slug}/dashboard/onboarding', name: 'Onboarding', category: 'Dashboard Lojista', requiresAuth: true, requiresSlug: true },
    
  // ========== CONFIGURAÇÕES LOJISTA ==========
  { path: '/{slug}/dashboard/settings', name: 'Configurações', category: 'Configurações Loja', requiresAuth: true, requiresSlug: true },
  { path: '/{slug}/dashboard/settings/store', name: 'Dados da Loja', category: 'Configurações Loja', requiresAuth: true, requiresSlug: true },
  { path: '/{slug}/dashboard/settings/appearance', name: 'Aparência', category: 'Configurações Loja', requiresAuth: true, requiresSlug: true },
  { path: '/{slug}/dashboard/settings/scheduling', name: 'Agendamento', category: 'Configurações Loja', requiresAuth: true, requiresSlug: true },
  { path: '/{slug}/dashboard/settings/integrations', name: 'Integrações', category: 'Configurações Loja', requiresAuth: true, requiresSlug: true },
  { path: '/{slug}/dashboard/settings/pdv', name: 'PDV', category: 'Configurações Loja', requiresAuth: true, requiresSlug: true },
  { path: '/{slug}/dashboard/settings/modules', name: 'Módulos', category: 'Configurações Loja', requiresAuth: true, requiresSlug: true },
  { path: '/{slug}/dashboard/settings/niche', name: 'Nicho', category: 'Configurações Loja', requiresAuth: true, requiresSlug: true },
  { path: '/{slug}/dashboard/settings/platforms', name: 'Plataformas', category: 'Configurações Loja', requiresAuth: true, requiresSlug: true },
  { path: '/{slug}/dashboard/settings/loyalty', name: 'Fidelidade', category: 'Configurações Loja', requiresAuth: true, requiresSlug: true },
]

export async function GET(request: NextRequest) {
  // Agrupar por categoria
  const categories = [...new Set(SYSTEM_PAGES.map(p => p.category))]
  const byCategory = categories.map(cat => ({
    category: cat,
    pages: SYSTEM_PAGES.filter(p => p.category === cat),
    count: SYSTEM_PAGES.filter(p => p.category === cat).length
  }))

  // Estatísticas
  const stats = {
    total: SYSTEM_PAGES.length,
    public: SYSTEM_PAGES.filter(p => !p.requiresAuth).length,
    protected: SYSTEM_PAGES.filter(p => p.requiresAuth).length,
    withSlug: SYSTEM_PAGES.filter(p => p.requiresSlug).length,
    categories: categories.length
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    stats,
    categories: byCategory,
    allPages: SYSTEM_PAGES
  })
}
