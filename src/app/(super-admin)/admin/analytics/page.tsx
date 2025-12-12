import { Suspense } from 'react'
import { Store, ShoppingBag, DollarSign, TrendingUp, Loader2, ExternalLink } from 'lucide-react'
import { getAnalyticsMetrics, getTopStores, getDailyTrend, type DateRange } from '@/lib/superadmin/analytics'
import Link from 'next/link'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit'
  })
}

type PageProps = {
  searchParams: { days?: string }
}

export default async function AnalyticsPage({ searchParams }: PageProps) {
  const days = (parseInt(searchParams.days || '7') as DateRange) || 7
  
  const [metrics, topStores, dailyTrend] = await Promise.all([
    getAnalyticsMetrics(days),
    getTopStores(days, 10),
    getDailyTrend(days)
  ])

  const kpis = [
    {
      label: 'Lojas Ativas',
      value: metrics.activeStores.toString(),
      subtext: `últimos ${days} dias`,
      icon: Store,
      color: 'bg-blue-500'
    },
    {
      label: 'Pedidos Hoje',
      value: metrics.ordersToday.toString(),
      subtext: 'hoje',
      icon: ShoppingBag,
      color: 'bg-green-500'
    },
    {
      label: `Pedidos ${days}d`,
      value: metrics.ordersInRange.toString(),
      subtext: `últimos ${days} dias`,
      icon: ShoppingBag,
      color: 'bg-purple-500'
    },
    {
      label: 'GMV Hoje',
      value: formatCurrency(metrics.gmvToday),
      subtext: 'hoje',
      icon: DollarSign,
      color: 'bg-orange-500'
    },
    {
      label: `GMV ${days}d`,
      value: formatCurrency(metrics.gmvInRange),
      subtext: `últimos ${days} dias`,
      icon: TrendingUp,
      color: 'bg-red-500'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">Visão geral de atividade e GMV</p>
          </div>
          
          {/* Date Range Selector */}
          <div className="flex gap-2">
            <Link
              href="/admin/analytics?days=7"
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                days === 7
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              7 dias
            </Link>
            <Link
              href="/admin/analytics?days=14"
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                days === 14
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              14 dias
            </Link>
            <Link
              href="/admin/analytics?days=30"
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                days === 30
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              30 dias
            </Link>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {kpis.map((kpi, idx) => {
            const Icon = kpi.icon
            return (
              <div key={idx} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className={`${kpi.color} p-3 rounded-xl`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{kpi.value}</div>
                <div className="text-sm text-gray-600">{kpi.label}</div>
                <div className="text-xs text-gray-500 mt-1">{kpi.subtext}</div>
              </div>
            )
          })}
        </div>

        {/* Top Stores */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Top 10 Lojas (GMV)</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loja
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tenant
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pedidos
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GMV
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topStores.map((store, idx) => (
                  <tr key={store.store_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {idx + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{store.store_name}</div>
                      <div className="text-sm text-gray-500">/{store.store_slug}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {store.tenant_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                      {store.orders_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-green-600">
                      {formatCurrency(store.gmv)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/${store.store_slug}`}
                          target="_blank"
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          Menu
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                        <span className="text-gray-300">|</span>
                        <Link
                          href={`/${store.store_slug}/dashboard`}
                          target="_blank"
                          className="text-purple-600 hover:text-purple-800 flex items-center gap-1"
                        >
                          Dashboard
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {topStores.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                Nenhuma loja com pedidos no período selecionado
              </div>
            )}
          </div>
        </div>

        {/* Daily Trend */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Tendência Diária</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pedidos
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GMV
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticket Médio
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dailyTrend.map((day) => {
                  const avgTicket = day.orders_count > 0 ? day.gmv / day.orders_count : 0
                  return (
                    <tr key={day.date} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatDate(day.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {day.orders_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">
                        {formatCurrency(day.gmv)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                        {formatCurrency(avgTicket)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Limitations Note */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-900 font-semibold mb-2">⚠️ Limitações Conhecidas:</p>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• Datas em UTC (não considera timezone do tenant/loja)</li>
            <li>• GMV baseado em orders.total_amount (não é MRR do SaaS)</li>
            <li>• Sem integração de billing (Stripe/MercadoPago)</li>
            <li>• Queries podem ser lentas com muitos dados (otimizar com índices)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
