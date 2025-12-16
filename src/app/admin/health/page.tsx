import { createClient } from '@/lib/supabase/server'
import { AlertTriangle, AlertCircle, CheckCircle, Database, Store, Package, Image, DollarSign, Palette, Clock, ArrowRight, Wrench } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface HealthIssue {
  id: string
  title: string
  count: number
  description: string
  severity: 'critical' | 'warning' | 'info'
  action?: {
    label: string
    href?: string
    autoFix?: boolean
  }
}

async function getHealthData() {
  const supabase = await createClient()
  const startTime = Date.now()

  // Executar todas as queries em paralelo
  const [
    storesResult,
    storesWithoutModernLayout,
    productsWithoutCategory,
    productsWithoutImage,
    productsWithZeroPrice,
    categoriesWithoutColor,
    orphanOrderItems,
    totalProducts,
    totalCategories,
    totalOrders
  ] = await Promise.all([
    // Total de lojas
    supabase.from('stores').select('id, name, slug, menu_theme', { count: 'exact' }),
    
    // Lojas sem layout modern
    supabase.from('stores').select('id, name, slug, menu_theme')
      .or('menu_theme.is.null,menu_theme->layout.neq.modern'),
    
    // Produtos sem categoria
    supabase.from('products').select('id, name, store_id', { count: 'exact' })
      .is('category_id', null),
    
    // Produtos sem imagem
    supabase.from('products').select('id, name, store_id', { count: 'exact' })
      .or('image_url.is.null,image_url.eq.'),
    
    // Produtos com preço zero
    supabase.from('products').select('id, name, store_id', { count: 'exact' })
      .or('base_price.is.null,base_price.eq.0'),
    
    // Categorias sem cor
    supabase.from('categories').select('id, name, store_id', { count: 'exact' })
      .is('color', null),
    
    // Itens de pedido órfãos (sem pedido pai)
    supabase.rpc('count_orphan_order_items').single(),
    
    // Totais
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase.from('categories').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('id', { count: 'exact', head: true })
  ])

  const latency = Date.now() - startTime

  // Montar lista de issues
  const issues: HealthIssue[] = []

  // CRÍTICOS
  const layoutIssueCount = storesWithoutModernLayout.data?.filter((s: any) => {
    const theme = s.menu_theme as any
    return !theme || theme?.layout !== 'modern'
  }).length || 0

  if (layoutIssueCount > 0) {
    issues.push({
      id: 'layout-outdated',
      title: 'Lojas sem Layout Moderno',
      count: layoutIssueCount,
      description: 'Lojas usando layout antigo (classic) ou sem layout definido',
      severity: 'critical',
      action: { label: 'Executar Migration', href: '/admin/debug' }
    })
  }

  if ((productsWithoutCategory.count || 0) > 0) {
    issues.push({
      id: 'products-no-category',
      title: 'Produtos sem Categoria',
      count: productsWithoutCategory.count || 0,
      description: 'Produtos órfãos que não aparecem no cardápio',
      severity: 'critical',
      action: { label: 'Ver Produtos', href: '/admin/debug' }
    })
  }

  const orphanCount = (orphanOrderItems.data as any)?.count || 0
  if (orphanCount > 0) {
    issues.push({
      id: 'orphan-order-items',
      title: 'Itens de Pedido Órfãos',
      count: orphanCount,
      description: 'Itens de pedido sem pedido pai associado',
      severity: 'critical',
      action: { label: 'Limpar Órfãos', autoFix: true }
    })
  }

  // ATENÇÃO
  if ((productsWithoutImage.count || 0) > 0) {
    issues.push({
      id: 'products-no-image',
      title: 'Produtos sem Imagem',
      count: productsWithoutImage.count || 0,
      description: 'Produtos que aparecerão sem foto no cardápio',
      severity: 'warning',
      action: { label: 'Ver Lista', href: '/admin/debug' }
    })
  }

  if ((productsWithZeroPrice.count || 0) > 0) {
    issues.push({
      id: 'products-zero-price',
      title: 'Produtos com Preço R$ 0,00',
      count: productsWithZeroPrice.count || 0,
      description: 'Produtos gratuitos ou com preço não definido',
      severity: 'warning',
      action: { label: 'Ver Lista', href: '/admin/debug' }
    })
  }

  if ((categoriesWithoutColor.count || 0) > 0) {
    issues.push({
      id: 'categories-no-color',
      title: 'Categorias sem Cor',
      count: categoriesWithoutColor.count || 0,
      description: 'Categorias sem cor definida para o badge',
      severity: 'warning',
      action: { label: 'Corrigir Auto', autoFix: true }
    })
  }

  return {
    issues,
    stats: {
      latency,
      totalStores: storesResult.count || 0,
      totalProducts: totalProducts.count || 0,
      totalCategories: totalCategories.count || 0,
      totalOrders: totalOrders.count || 0
    },
    stores: storesResult.data || []
  }
}

export default async function HealthPage() {
  const { issues, stats, stores } = await getHealthData()

  const criticalIssues = issues.filter(i => i.severity === 'critical')
  const warningIssues = issues.filter(i => i.severity === 'warning')

  const getLatencyColor = (ms: number) => {
    if (ms < 500) return 'text-emerald-600 bg-emerald-100'
    if (ms < 1500) return 'text-amber-600 bg-amber-100'
    return 'text-red-600 bg-red-100'
  }

  const getLatencyLabel = (ms: number) => {
    if (ms < 500) return 'Excelente'
    if (ms < 1500) return 'Normal'
    return 'Lento'
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-violet-100 rounded-xl">
              <Database className="w-6 h-6 text-violet-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800">🩺 System Health Monitor</h1>
          </div>
          <p className="text-slate-600">
            Diagnóstico de integridade de dados e status da infraestrutura.
          </p>
        </div>

        {/* Status Geral */}
        <div className={`mb-8 p-6 rounded-2xl border-2 ${
          criticalIssues.length > 0 
            ? 'bg-red-50 border-red-200' 
            : warningIssues.length > 0 
              ? 'bg-amber-50 border-amber-200'
              : 'bg-emerald-50 border-emerald-200'
        }`}>
          <div className="flex items-center gap-4">
            {criticalIssues.length > 0 ? (
              <>
                <AlertTriangle className="w-10 h-10 text-red-500" />
                <div>
                  <h2 className="text-xl font-bold text-red-700">
                    {criticalIssues.length} Problema{criticalIssues.length > 1 ? 's' : ''} Crítico{criticalIssues.length > 1 ? 's' : ''}
                  </h2>
                  <p className="text-red-600">Ação imediata necessária</p>
                </div>
              </>
            ) : warningIssues.length > 0 ? (
              <>
                <AlertCircle className="w-10 h-10 text-amber-500" />
                <div>
                  <h2 className="text-xl font-bold text-amber-700">
                    {warningIssues.length} Aviso{warningIssues.length > 1 ? 's' : ''} de Qualidade
                  </h2>
                  <p className="text-amber-600">Recomendado corrigir para melhor experiência</p>
                </div>
              </>
            ) : (
              <>
                <CheckCircle className="w-10 h-10 text-emerald-500" />
                <div>
                  <h2 className="text-xl font-bold text-emerald-700">Sistema Saudável</h2>
                  <p className="text-emerald-600">Nenhum problema detectado</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Grid de 3 Colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* COLUNA 1: CRÍTICO */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-red-50 border-b border-red-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h3 className="font-bold text-red-700">🔴 CRÍTICO</h3>
              </div>
              <p className="text-sm text-red-600 mt-1">Ação Imediata Necessária</p>
            </div>
            <div className="p-4 space-y-3">
              {criticalIssues.length > 0 ? (
                criticalIssues.map(issue => (
                  <IssueCard key={issue.id} issue={issue} />
                ))
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 text-emerald-300" />
                  <p>Nenhum problema crítico</p>
                </div>
              )}
            </div>
          </div>

          {/* COLUNA 2: ATENÇÃO */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-amber-50 border-b border-amber-100">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-amber-700">🟡 ATENÇÃO</h3>
              </div>
              <p className="text-sm text-amber-600 mt-1">Qualidade dos Dados</p>
            </div>
            <div className="p-4 space-y-3">
              {warningIssues.length > 0 ? (
                warningIssues.map(issue => (
                  <IssueCard key={issue.id} issue={issue} />
                ))
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 text-emerald-300" />
                  <p>Dados de qualidade</p>
                </div>
              )}
            </div>
          </div>

          {/* COLUNA 3: STATUS */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-emerald-700">🟢 STATUS</h3>
              </div>
              <p className="text-sm text-emerald-600 mt-1">Infraestrutura</p>
            </div>
            <div className="p-4 space-y-4">
              {/* Latência */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-slate-400" />
                  <div>
                    <div className="font-medium text-slate-700">Latência do Banco</div>
                    <div className="text-xs text-slate-400">{getLatencyLabel(stats.latency)}</div>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${getLatencyColor(stats.latency)}`}>
                  {stats.latency}ms
                </span>
              </div>

              {/* Lojas */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Store className="w-5 h-5 text-slate-400" />
                  <div>
                    <div className="font-medium text-slate-700">Lojas Ativas</div>
                    <div className="text-xs text-slate-400">Total cadastradas</div>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-sm font-bold bg-violet-100 text-violet-600">
                  {stats.totalStores}
                </span>
              </div>

              {/* Produtos */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-slate-400" />
                  <div>
                    <div className="font-medium text-slate-700">Total Produtos</div>
                    <div className="text-xs text-slate-400">Em todas as lojas</div>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-sm font-bold bg-emerald-100 text-emerald-600">
                  {stats.totalProducts}
                </span>
              </div>

              {/* Categorias */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Palette className="w-5 h-5 text-slate-400" />
                  <div>
                    <div className="font-medium text-slate-700">Total Categorias</div>
                    <div className="text-xs text-slate-400">Em todas as lojas</div>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-sm font-bold bg-amber-100 text-amber-600">
                  {stats.totalCategories}
                </span>
              </div>

              {/* Pedidos */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-slate-400" />
                  <div>
                    <div className="font-medium text-slate-700">Total Pedidos</div>
                    <div className="text-xs text-slate-400">Histórico completo</div>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-sm font-bold bg-blue-100 text-blue-600">
                  {stats.totalOrders}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Links Úteis */}
        <div className="mt-8 flex flex-wrap gap-4">
          <Link 
            href="/admin/debug"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Database className="w-4 h-4" />
            Ver Diagnóstico Completo
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-slate-500">
          Última verificação: {new Date().toLocaleString('pt-BR')}
        </div>
      </div>
    </div>
  )
}

function IssueCard({ issue }: { issue: HealthIssue }) {
  const getIcon = () => {
    switch (issue.id) {
      case 'layout-outdated': return <Store className="w-5 h-5" />
      case 'products-no-category': return <Package className="w-5 h-5" />
      case 'products-no-image': return <Image className="w-5 h-5" />
      case 'products-zero-price': return <DollarSign className="w-5 h-5" />
      case 'categories-no-color': return <Palette className="w-5 h-5" />
      default: return <AlertTriangle className="w-5 h-5" />
    }
  }

  const severityColors = {
    critical: 'border-red-200 bg-red-50',
    warning: 'border-amber-200 bg-amber-50',
    info: 'border-blue-200 bg-blue-50'
  }

  const countColors = {
    critical: 'bg-red-100 text-red-700',
    warning: 'bg-amber-100 text-amber-700',
    info: 'bg-blue-100 text-blue-700'
  }

  return (
    <div className={`p-4 rounded-xl border ${severityColors[issue.severity]}`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${countColors[issue.severity]}`}>
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-slate-800 truncate">{issue.title}</h4>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${countColors[issue.severity]}`}>
              {issue.count}
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-3">{issue.description}</p>
          
          {issue.action && (
            issue.action.href ? (
              <Link
                href={issue.action.href}
                className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-800"
              >
                {issue.action.label}
                <ArrowRight className="w-3 h-3" />
              </Link>
            ) : issue.action.autoFix ? (
              <button className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-800">
                <Wrench className="w-3 h-3" />
                {issue.action.label}
              </button>
            ) : null
          )}
        </div>
      </div>
    </div>
  )
}
