import { createClient } from '@/lib/supabase/server'
import { AlertTriangle, AlertCircle, CheckCircle, Database, Store, Package, DollarSign, Palette, Clock, ArrowRight, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface HealthIssue {
  id: string
  title: string
  count: number
  description: string
  severity: 'critical' | 'warning' | 'info'
  action?: { label: string; href?: string }
}

async function getHealthData() {
  const supabase = await createClient()
  const startTime = Date.now()

  const [
    storesResult,
    storesWithoutModernLayout,
    productsWithoutCategory,
    productsWithoutImage,
    productsWithZeroPrice,
    categoriesWithoutColor,
    totalProducts,
    totalCategories,
    totalOrders
  ] = await Promise.all([
    supabase.from('stores').select('id, name, slug, menu_theme', { count: 'exact' }),
    supabase.from('stores').select('id, name, slug, menu_theme')
      .or('menu_theme.is.null,menu_theme->layout.neq.modern'),
    supabase.from('products').select('id, name, store_id', { count: 'exact' })
      .is('category_id', null),
    supabase.from('products').select('id, name, store_id', { count: 'exact' })
      .or('image_url.is.null,image_url.eq.'),
    supabase.from('products').select('id, name, store_id', { count: 'exact' })
      .or('base_price.is.null,base_price.eq.0'),
    supabase.from('categories').select('id, name, store_id', { count: 'exact' })
      .is('color', null),
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase.from('categories').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('id', { count: 'exact', head: true })
  ])

  const latency = Date.now() - startTime
  const issues: HealthIssue[] = []

  const layoutIssueCount = storesWithoutModernLayout.data?.filter((s: any) => {
    const theme = s.menu_theme as any
    return !theme || theme?.layout !== 'modern'
  }).length || 0

  if (layoutIssueCount > 0) {
    issues.push({
      id: 'layout-outdated',
      title: 'Lojas sem Layout Moderno',
      count: layoutIssueCount,
      description: 'Lojas usando layout antigo',
      severity: 'critical',
      action: { label: 'Ver Builder', href: '/admin/health/builder' }
    })
  }

  if ((productsWithoutCategory.count || 0) > 0) {
    issues.push({
      id: 'products-no-category',
      title: 'Produtos sem Categoria',
      count: productsWithoutCategory.count || 0,
      description: 'Produtos órfãos',
      severity: 'critical',
      action: { label: 'Ver Debug', href: '/admin/health/debug' }
    })
  }

  if ((productsWithoutImage.count || 0) > 0) {
    issues.push({
      id: 'products-no-image',
      title: 'Produtos sem Imagem',
      count: productsWithoutImage.count || 0,
      description: 'Produtos sem foto',
      severity: 'warning',
      action: { label: 'Ver Scanner', href: '/admin/health/images' }
    })
  }

  if ((productsWithZeroPrice.count || 0) > 0) {
    issues.push({
      id: 'products-zero-price',
      title: 'Produtos com Preço R$ 0',
      count: productsWithZeroPrice.count || 0,
      description: 'Preço não definido',
      severity: 'warning'
    })
  }

  if ((categoriesWithoutColor.count || 0) > 0) {
    issues.push({
      id: 'categories-no-color',
      title: 'Categorias sem Cor',
      count: categoriesWithoutColor.count || 0,
      description: 'Sem cor definida',
      severity: 'warning'
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
    }
  }
}

export default async function MonitorPage() {
  const { issues, stats } = await getHealthData()
  const criticalIssues = issues.filter(i => i.severity === 'critical')
  const warningIssues = issues.filter(i => i.severity === 'warning')

  const getLatencyColor = (ms: number) => {
    if (ms < 500) return 'text-emerald-600 bg-emerald-100'
    if (ms < 1500) return 'text-amber-600 bg-amber-100'
    return 'text-red-600 bg-red-100'
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link href="/admin/health" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
          <h1 className="text-3xl font-bold text-slate-800">🩺 Health Monitor</h1>
        </div>

        {/* Status Geral */}
        <div className={`mb-8 p-6 rounded-2xl border-2 ${
          criticalIssues.length > 0 ? 'bg-red-50 border-red-200' : 
          warningIssues.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'
        }`}>
          <div className="flex items-center gap-4">
            {criticalIssues.length > 0 ? (
              <>
                <AlertTriangle className="w-10 h-10 text-red-500" />
                <div>
                  <h2 className="text-xl font-bold text-red-700">{criticalIssues.length} Problema(s) Crítico(s)</h2>
                  <p className="text-red-600">Ação imediata necessária</p>
                </div>
              </>
            ) : warningIssues.length > 0 ? (
              <>
                <AlertCircle className="w-10 h-10 text-amber-500" />
                <div>
                  <h2 className="text-xl font-bold text-amber-700">{warningIssues.length} Aviso(s)</h2>
                  <p className="text-amber-600">Recomendado corrigir</p>
                </div>
              </>
            ) : (
              <>
                <CheckCircle className="w-10 h-10 text-emerald-500" />
                <div>
                  <h2 className="text-xl font-bold text-emerald-700">Sistema Saudável</h2>
                  <p className="text-emerald-600">Nenhum problema</p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CRÍTICO */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-red-50 border-b border-red-100">
              <h3 className="font-bold text-red-700">🔴 CRÍTICO</h3>
            </div>
            <div className="p-4 space-y-3">
              {criticalIssues.length > 0 ? criticalIssues.map(issue => (
                <IssueCard key={issue.id} issue={issue} />
              )) : (
                <div className="text-center py-8 text-slate-400">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 text-emerald-300" />
                  <p>Nenhum problema crítico</p>
                </div>
              )}
            </div>
          </div>

          {/* ATENÇÃO */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-amber-50 border-b border-amber-100">
              <h3 className="font-bold text-amber-700">🟡 ATENÇÃO</h3>
            </div>
            <div className="p-4 space-y-3">
              {warningIssues.length > 0 ? warningIssues.map(issue => (
                <IssueCard key={issue.id} issue={issue} />
              )) : (
                <div className="text-center py-8 text-slate-400">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 text-emerald-300" />
                  <p>Dados de qualidade</p>
                </div>
              )}
            </div>
          </div>

          {/* STATUS */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100">
              <h3 className="font-bold text-emerald-700">🟢 STATUS</h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-700">Latência</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${getLatencyColor(stats.latency)}`}>
                  {stats.latency}ms
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Store className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-700">Lojas</span>
                </div>
                <span className="px-3 py-1 rounded-full text-sm font-bold bg-violet-100 text-violet-600">
                  {stats.totalStores}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-700">Produtos</span>
                </div>
                <span className="px-3 py-1 rounded-full text-sm font-bold bg-emerald-100 text-emerald-600">
                  {stats.totalProducts}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-700">Pedidos</span>
                </div>
                <span className="px-3 py-1 rounded-full text-sm font-bold bg-blue-100 text-blue-600">
                  {stats.totalOrders}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-slate-500">
          Última verificação: {new Date().toLocaleString('pt-BR')}
        </div>
      </div>
    </div>
  )
}

function IssueCard({ issue }: { issue: HealthIssue }) {
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
      <div className="flex items-center gap-2 mb-1">
        <h4 className="font-semibold text-slate-800">{issue.title}</h4>
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${countColors[issue.severity]}`}>
          {issue.count}
        </span>
      </div>
      <p className="text-xs text-slate-500 mb-2">{issue.description}</p>
      {issue.action?.href && (
        <Link href={issue.action.href} className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-800">
          {issue.action.label}
          <ArrowRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  )
}
