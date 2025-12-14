'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { 
  TrendingUp, TrendingDown, DollarSign, Package, 
  Loader2, BarChart3, PieChart, Calendar
} from 'lucide-react'

interface DRETabProps {
  storeId: string
}

interface DREData {
  revenue: number
  costOfGoods: number
  grossProfit: number
  grossMargin: number
  expenses: number
  netProfit: number
  netMargin: number
  orderCount: number
  avgTicket: number
}

export function DRETab({ storeId }: DRETabProps) {
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('month')
  const [data, setData] = useState<DREData>({
    revenue: 0,
    costOfGoods: 0,
    grossProfit: 0,
    grossMargin: 0,
    expenses: 0,
    netProfit: 0,
    netMargin: 0,
    orderCount: 0,
    avgTicket: 0
  })
  const [dailySales, setDailySales] = useState<{date: string; total: number}[]>([])

  useEffect(() => {
    loadDREData()
  }, [storeId, period])

  async function loadDREData() {
    setLoading(true)
    
    const now = new Date()
    let startDate = new Date()
    
    if (period === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    } else if (period === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    // Buscar pedidos
    const { data: orders } = await supabase
      .from('orders')
      .select('id, total_amount, created_at')
      .eq('store_id', storeId)
      .gte('created_at', startDate.toISOString())

    // Buscar despesas pagas
    const { data: expenses } = await supabase
      .from('expenses')
      .select('amount')
      .eq('store_id', storeId)
      .eq('status', 'paid')
      .gte('paid_at', startDate.toISOString())

    // Calcular receita
    const revenue = orders?.reduce((sum: number, o: { total_amount: number }) => sum + (o.total_amount || 0), 0) || 0
    const orderCount = orders?.length || 0
    const avgTicket = orderCount > 0 ? revenue / orderCount : 0

    // CMV estimado (30% da receita - idealmente viria da ficha técnica)
    const costOfGoods = revenue * 0.30
    const grossProfit = revenue - costOfGoods
    const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0

    // Despesas
    const totalExpenses = expenses?.reduce((sum: number, e: { amount: number }) => sum + (e.amount || 0), 0) || 0

    // Lucro líquido
    const netProfit = grossProfit - totalExpenses
    const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0

    setData({
      revenue,
      costOfGoods,
      grossProfit,
      grossMargin,
      expenses: totalExpenses,
      netProfit,
      netMargin,
      orderCount,
      avgTicket
    })

    // Vendas por dia (para gráfico)
    if (orders) {
      const salesByDay: Record<string, number> = {}
      orders.forEach((order: { created_at: string; total_amount: number }) => {
        const date = order.created_at.split('T')[0]
        salesByDay[date] = (salesByDay[date] || 0) + (order.total_amount || 0)
      })
      
      const days = Object.entries(salesByDay)
        .map(([date, total]) => ({ date, total }))
        .sort((a, b) => a.date.localeCompare(b.date))
      
      setDailySales(days)
    }

    setLoading(false)
  }

  const maxSale = Math.max(...dailySales.map(d => d.total), 1)

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Período */}
      <div className="flex gap-2">
        {(['today', 'week', 'month'] as const).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              period === p
                ? 'bg-emerald-500 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border'
            }`}
          >
            {p === 'today' ? 'Hoje' : p === 'week' ? 'Semana' : 'Mês'}
          </button>
        ))}
      </div>

      {/* Cards Principais */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-emerald-100">Receita</span>
            <DollarSign className="w-5 h-5 text-emerald-200" />
          </div>
          <p className="text-3xl font-bold">{formatCurrency(data.revenue)}</p>
          <p className="text-sm text-emerald-200 mt-1">{data.orderCount} pedidos</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500">CMV</span>
            <Package className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-3xl font-bold text-orange-600">{formatCurrency(data.costOfGoods)}</p>
          <p className="text-sm text-slate-400 mt-1">30% da receita</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500">Lucro Bruto</span>
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-blue-600">{formatCurrency(data.grossProfit)}</p>
          <p className="text-sm text-slate-400 mt-1">{data.grossMargin.toFixed(1)}% margem</p>
        </div>

        <div className={`rounded-2xl p-5 border shadow-lg ${data.netProfit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={data.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}>Lucro Líquido</span>
            {data.netProfit >= 0 ? <TrendingUp className="w-5 h-5 text-green-500" /> : <TrendingDown className="w-5 h-5 text-red-500" />}
          </div>
          <p className={`text-3xl font-bold ${data.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(data.netProfit)}
          </p>
          <p className={`text-sm mt-1 ${data.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {data.netMargin.toFixed(1)}% margem
          </p>
        </div>
      </div>

      {/* DRE Detalhado */}
      <div className="bg-white rounded-2xl shadow-lg border p-6">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-600" />
          DRE - Demonstrativo de Resultados
        </h3>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="font-medium text-slate-700">📈 Receita Bruta</span>
            <span className="font-bold text-emerald-600">{formatCurrency(data.revenue)}</span>
          </div>
          
          <div className="flex justify-between items-center py-2 border-b pl-4">
            <span className="text-slate-600">(-) Custo dos Produtos (CMV)</span>
            <span className="text-red-500">- {formatCurrency(data.costOfGoods)}</span>
          </div>
          
          <div className="flex justify-between items-center py-2 border-b bg-blue-50 -mx-6 px-6">
            <span className="font-medium text-blue-700">= Lucro Bruto</span>
            <span className="font-bold text-blue-600">{formatCurrency(data.grossProfit)}</span>
          </div>
          
          <div className="flex justify-between items-center py-2 border-b pl-4">
            <span className="text-slate-600">(-) Despesas Operacionais</span>
            <span className="text-red-500">- {formatCurrency(data.expenses)}</span>
          </div>
          
          <div className={`flex justify-between items-center py-3 -mx-6 px-6 rounded-b-xl ${data.netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
            <span className={`font-bold ${data.netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              = Lucro Líquido
            </span>
            <span className={`text-xl font-bold ${data.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(data.netProfit)}
            </span>
          </div>
        </div>
      </div>

      {/* Gráfico de Vendas Diárias */}
      {dailySales.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border p-6">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            Vendas por Dia
          </h3>
          
          <div className="flex items-end gap-1 h-40">
            {dailySales.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t transition-all hover:from-emerald-600 hover:to-teal-500"
                  style={{ height: `${(day.total / maxSale) * 100}%`, minHeight: day.total > 0 ? '4px' : '0' }}
                  title={`${formatCurrency(day.total)}`}
                />
                <span className="text-xs text-slate-400 mt-1 rotate-45 origin-left">
                  {new Date(day.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Indicadores */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-sm text-slate-500">Ticket Médio</p>
          <p className="text-2xl font-bold text-slate-800">{formatCurrency(data.avgTicket)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-sm text-slate-500">Pedidos</p>
          <p className="text-2xl font-bold text-slate-800">{data.orderCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-sm text-slate-500">Margem Líquida</p>
          <p className={`text-2xl font-bold ${data.netMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {data.netMargin.toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  )
}
