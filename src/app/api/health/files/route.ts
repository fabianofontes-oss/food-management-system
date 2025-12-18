import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

/**
 * API para analisar tamanho de arquivos do sistema
 * Identifica páginas grandes que violam regras de arquitetura
 */

interface FileInfo {
  path: string
  name: string
  lines: number
  size: number
  category: string
  violation: 'critical' | 'warning' | 'ok'
}

// Limites de linhas por arquivo
const LINE_LIMITS = {
  critical: 500, // Muito grande, deve ser refatorado
  warning: 300,  // Grande, considerar refatorar
}

// Páginas conhecidas que são grandes (hardcoded pois não podemos ler o sistema de arquivos no Edge)
const KNOWN_LARGE_FILES: FileInfo[] = [
  // ========== SUPER ADMIN ==========
  {
    path: '/admin/tenants/page.tsx',
    name: 'Gerenciamento de Tenants',
    lines: 679,
    size: 25000,
    category: 'Super Admin',
    violation: 'critical'
  },
  {
    path: '/admin/stores/page.tsx',
    name: 'Gerenciamento de Lojas',
    lines: 508,
    size: 18000,
    category: 'Super Admin',
    violation: 'critical'
  },
  {
    path: '/admin/partners/page.tsx',
    name: 'Parceiros',
    lines: 499,
    size: 17000,
    category: 'Super Admin',
    violation: 'warning'
  },
  {
    path: '/admin/demanda/page.tsx',
    name: 'Controle de Demanda',
    lines: 484,
    size: 16000,
    category: 'Super Admin',
    violation: 'warning'
  },
  {
    path: '/admin/page.tsx',
    name: 'Dashboard Admin',
    lines: 471,
    size: 15000,
    category: 'Super Admin',
    violation: 'warning'
  },
  {
    path: '/admin/health/page.tsx',
    name: 'Saúde do Sistema',
    lines: 395,
    size: 14000,
    category: 'Super Admin',
    violation: 'warning'
  },
  {
    path: '/admin/integrations/page.tsx',
    name: 'Integrações',
    lines: 391,
    size: 13500,
    category: 'Super Admin',
    violation: 'warning'
  },
  {
    path: '/admin/billing/page.tsx',
    name: 'Billing',
    lines: 377,
    size: 13000,
    category: 'Super Admin',
    violation: 'warning'
  },
  {
    path: '/admin/settings/page.tsx',
    name: 'Configurações',
    lines: 345,
    size: 12000,
    category: 'Super Admin',
    violation: 'warning'
  },
  {
    path: '/admin/plans/new/page.tsx',
    name: 'Novo Plano',
    lines: 320,
    size: 11000,
    category: 'Super Admin',
    violation: 'warning'
  },

  // ========== DASHBOARD LOJISTA ==========
  {
    path: '/[slug]/dashboard/tables/page.tsx',
    name: 'Gestão de Mesas',
    lines: 1300,
    size: 48000,
    category: 'Dashboard Lojista',
    violation: 'critical'
  },
  {
    path: '/[slug]/dashboard/kitchen/page.tsx',
    name: 'Cozinha',
    lines: 950,
    size: 35000,
    category: 'Dashboard Lojista',
    violation: 'critical'
  },
  {
    path: '/[slug]/dashboard/orders/page.tsx',
    name: 'Pedidos',
    lines: 850,
    size: 32000,
    category: 'Dashboard Lojista',
    violation: 'critical'
  },
  {
    path: '/[slug]/dashboard/pos/POSClient.tsx',
    name: 'PDV',
    lines: 780,
    size: 28000,
    category: 'Dashboard Lojista',
    violation: 'critical'
  },
  {
    path: '/[slug]/dashboard/products/page.tsx',
    name: 'Produtos',
    lines: 720,
    size: 26000,
    category: 'Dashboard Lojista',
    violation: 'critical'
  },
  {
    path: '/[slug]/dashboard/waiters/page.tsx',
    name: 'Garçons',
    lines: 650,
    size: 24000,
    category: 'Dashboard Lojista',
    violation: 'critical'
  },
  {
    path: '/[slug]/dashboard/delivery/page.tsx',
    name: 'Entregadores',
    lines: 580,
    size: 21000,
    category: 'Dashboard Lojista',
    violation: 'critical'
  },
  {
    path: '/[slug]/dashboard/reservations/page.tsx',
    name: 'Reservas',
    lines: 520,
    size: 19000,
    category: 'Dashboard Lojista',
    violation: 'critical'
  },
  {
    path: '/[slug]/dashboard/reviews/page.tsx',
    name: 'Avaliações',
    lines: 480,
    size: 17000,
    category: 'Dashboard Lojista',
    violation: 'warning'
  },
  {
    path: '/[slug]/dashboard/coupons/page.tsx',
    name: 'Cupons',
    lines: 450,
    size: 16000,
    category: 'Dashboard Lojista',
    violation: 'warning'
  },
  {
    path: '/[slug]/dashboard/crm/page.tsx',
    name: 'CRM',
    lines: 420,
    size: 15000,
    category: 'Dashboard Lojista',
    violation: 'warning'
  },
  {
    path: '/[slug]/dashboard/inventory/page.tsx',
    name: 'Estoque',
    lines: 380,
    size: 14000,
    category: 'Dashboard Lojista',
    violation: 'warning'
  },

  // ========== CHECKOUT/CLIENTE ==========
  {
    path: '/[slug]/checkout/CheckoutClient.tsx',
    name: 'Checkout',
    lines: 620,
    size: 23000,
    category: 'Cliente',
    violation: 'critical'
  },
  {
    path: '/[slug]/waiter/page.tsx',
    name: 'Garçom (Cliente)',
    lines: 480,
    size: 17000,
    category: 'Cliente',
    violation: 'warning'
  },
]

export async function GET(request: NextRequest) {
  // Ordenar por número de linhas (decrescente)
  const sortedFiles = [...KNOWN_LARGE_FILES].sort((a, b) => b.lines - a.lines)

  // Agrupar por categoria
  const categories = [...new Set(KNOWN_LARGE_FILES.map(f => f.category))]
  const byCategory = categories.map(cat => ({
    category: cat,
    files: sortedFiles.filter(f => f.category === cat),
    totalLines: sortedFiles.filter(f => f.category === cat).reduce((sum, f) => sum + f.lines, 0)
  }))

  // Estatísticas
  const stats = {
    total: KNOWN_LARGE_FILES.length,
    critical: KNOWN_LARGE_FILES.filter(f => f.violation === 'critical').length,
    warning: KNOWN_LARGE_FILES.filter(f => f.violation === 'warning').length,
    totalLines: KNOWN_LARGE_FILES.reduce((sum, f) => sum + f.lines, 0),
    avgLines: Math.round(KNOWN_LARGE_FILES.reduce((sum, f) => sum + f.lines, 0) / KNOWN_LARGE_FILES.length)
  }

  // Top 10 maiores
  const top10 = sortedFiles.slice(0, 10)

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    limits: LINE_LIMITS,
    stats,
    top10,
    byCategory,
    all: sortedFiles
  })
}
