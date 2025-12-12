'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import { Calendar, DollarSign, ShoppingBag, TrendingUp, CreditCard, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ReportMetrics {
  total_orders: number
  total_revenue: number
  average_ticket: number
  paid_count: number
  pending_count: number
}

interface PaymentBreakdown {
  method: string
  count: number
  total: number
}

type DatePreset = 'today' | '7days' | '30days' | 'custom'

export default function ReportsPage() {
  const params = useParams()
  const slug = params.slug as string
  const [storeId, setStoreId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const [datePreset, setDatePreset] = useState<DatePreset>('today')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  
  const [metrics, setMetrics] = useState<ReportMetrics>({
    total_orders: 0,
    total_revenue: 0,
    average_ticket: 0,
    paid_count: 0,
    pending_count: 0
  })
  
  const [paymentBreakdown, setPaymentBreakdown] = useState<PaymentBreakdown[]>([])

  // Carregar store_id
  useEffect(() => {
    async function loadStore() {
      const { data } = await supabase
        .from('stores')
        .select('id')
        .eq('slug', slug)
        .single()
      
      if (data) {
        setStoreId(data.id)
      }
    }
    loadStore()
  }, [slug])

  // Calcular datas baseado no preset
  const getDateRange = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    switch (datePreset) {
      case 'today':
        return {
          start: today.toISOString(),
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
        }
      case '7days':
        const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        return {
          start: sevenDaysAgo.toISOString(),
          end: new Date().toISOString()
        }
      case '30days':
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
        return {
          start: thirtyDaysAgo.toISOString(),
          end: new Date().toISOString()
        }
      case 'custom':
        return {
          start: startDate ? new Date(startDate).toISOString() : today.toISOString(),
          end: endDate ? new Date(endDate + 'T23:59:59').toISOString() : new Date().toISOString()
        }
    }
  }

  // Carregar dados
  useEffect(() => {
    if (!storeId) return

    async function loadReports() {
      setLoading(true)
      setError('')

      try {
        const { start, end } = getDateRange()

        // Buscar pedidos do período (excluir cancelados)
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('id, total_amount, payment_method, payment_status, status, created_at')
          .eq('store_id', storeId)
          .neq('status', 'cancelled')
          .gte('created_at', start)
          .lte('created_at', end)

        if (ordersError) throw ordersError

        if (!orders || orders.length === 0) {
          // Sem pedidos no período
          setMetrics({
            total_orders: 0,
            total_revenue: 0,
            average_ticket: 0,
            paid_count: 0,
            pending_count: 0
          })
          setPaymentBreakdown([])
          setLoading(false)
          return
        }

        // Calcular métricas
        const totalOrders = orders.length
        const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
        const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0
        
        const paidCount = orders.filter(o => o.payment_status === 'paid').length
        const pendingCount = orders.filter(o => o.payment_status === 'pending' || !o.payment_status).length

        setMetrics({
          total_orders: totalOrders,
          total_revenue: totalRevenue,
          average_ticket: averageTicket,
          paid_count: paidCount,
          pending_count: pendingCount
        })

        // Calcular breakdown por método de pagamento
        const breakdown: Record<string, { count: number; total: number }> = {}
        
        orders.forEach(order => {
          const method = order.payment_method || 'cash'
          if (!breakdown[method]) {
            breakdown[method] = { count: 0, total: 0 }
          }
          breakdown[method].count++
          breakdown[method].total += order.total_amount || 0
        })

        const breakdownArray = Object.entries(breakdown).map(([method, data]) => ({
          method,
          count: data.count,
          total: data.total
        }))

        setPaymentBreakdown(breakdownArray)
      } catch (err) {
        console.error('Erro ao carregar relatórios:', err)
        setError('Erro ao carregar relatórios')
      } finally {
        setLoading(false)
      }
    }

    loadReports()
  }, [storeId, datePreset, startDate, endDate])

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      pix: 'PIX',
      cash: 'Dinheiro',
      card: 'Cartão',
      card_on_delivery: 'Cartão na Entrega'
    }
    return labels[method] || method
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 md:w-10 md:h-10 text-blue-600" />
            Relatórios
          </h1>
          <p className="text-gray-600 mt-1">Análise de vendas e desempenho</p>
        </div>

        {/* Filtros de Data */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-bold text-gray-900">Período</h2>
          </div>
          
          <div className="flex flex-wrap gap-3 mb-4">
            <Button
              onClick={() => setDatePreset('today')}
              className={datePreset === 'today' ? 'bg-blue-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}
            >
              Hoje
            </Button>
            <Button
              onClick={() => setDatePreset('7days')}
              className={datePreset === '7days' ? 'bg-blue-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}
            >
              Últimos 7 dias
            </Button>
            <Button
              onClick={() => setDatePreset('30days')}
              className={datePreset === '30days' ? 'bg-blue-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}
            >
              Últimos 30 dias
            </Button>
            <Button
              onClick={() => setDatePreset('custom')}
              className={datePreset === 'custom' ? 'bg-blue-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}
            >
              Personalizado
            </Button>
          </div>

          {datePreset === 'custom' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data Inicial</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data Final</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Carregando relatórios...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 text-red-700">
              <AlertCircle className="w-6 h-6" />
              <p className="font-medium">{error}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Métricas Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <ShoppingBag className="w-6 h-6" />
                  <span className="text-sm font-medium opacity-90">Total de Pedidos</span>
                </div>
                <div className="text-3xl font-bold">{metrics.total_orders}</div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="w-6 h-6" />
                  <span className="text-sm font-medium opacity-90">Receita Total</span>
                </div>
                <div className="text-3xl font-bold">{formatCurrency(metrics.total_revenue)}</div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-6 h-6" />
                  <span className="text-sm font-medium opacity-90">Ticket Médio</span>
                </div>
                <div className="text-3xl font-bold">{formatCurrency(metrics.average_ticket)}</div>
              </div>

              <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <CreditCard className="w-6 h-6" />
                  <span className="text-sm font-medium opacity-90">Status Pagamento</span>
                </div>
                <div className="text-lg font-bold">
                  {metrics.paid_count} Pagos / {metrics.pending_count} Pendentes
                </div>
              </div>
            </div>

            {/* Breakdown por Método de Pagamento */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Vendas por Método de Pagamento</h2>
              
              {paymentBreakdown.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhum pedido encontrado no período selecionado
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-3 px-4 font-bold text-gray-700">Método</th>
                        <th className="text-right py-3 px-4 font-bold text-gray-700">Quantidade</th>
                        <th className="text-right py-3 px-4 font-bold text-gray-700">Total</th>
                        <th className="text-right py-3 px-4 font-bold text-gray-700">% do Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentBreakdown.map((item) => (
                        <tr key={item.method} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{getPaymentMethodLabel(item.method)}</td>
                          <td className="py-3 px-4 text-right">{item.count}</td>
                          <td className="py-3 px-4 text-right font-bold text-green-600">
                            {formatCurrency(item.total)}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-600">
                            {((item.total / metrics.total_revenue) * 100).toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 font-bold">
                        <td className="py-3 px-4">TOTAL</td>
                        <td className="py-3 px-4 text-right">{metrics.total_orders}</td>
                        <td className="py-3 px-4 text-right text-green-600">
                          {formatCurrency(metrics.total_revenue)}
                        </td>
                        <td className="py-3 px-4 text-right">100%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
