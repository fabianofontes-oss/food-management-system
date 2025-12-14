'use client'

import { useMemo, useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { 
  DollarSign, TrendingUp, Loader2, AlertCircle, 
  BarChart3, Receipt, ArrowDownLeft, ArrowUpRight
} from 'lucide-react'
import { ExpensesTab } from './components/ExpensesTab'
import { ReceivablesTab } from './components/ReceivablesTab'
import { DRETab } from './components/DRETab'
import { CashControlTab } from './components/CashControlTab'

type TabType = 'resumo' | 'caixa' | 'despesas' | 'receber'

export default function FinancialPage() {
  const params = useParams()
  const slug = params.slug as string
  const supabase = useMemo(() => createClient(), [])
  
  const [storeId, setStoreId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<TabType>('resumo')
  
  const [summary, setSummary] = useState({
    todaySales: 0,
    weekSales: 0,
    monthSales: 0,
    pendingExpenses: 0,
    pendingReceivables: 0
  })

  useEffect(() => {
    async function loadStore() {
      const { data, error: storeError } = await supabase
        .from('stores')
        .select('id')
        .eq('slug', slug)
        .single()

      if (storeError || !data) {
        setError('Loja não encontrada')
        setLoading(false)
        return
      }
      setStoreId(data.id)
    }
    loadStore()
  }, [slug, supabase])

  useEffect(() => {
    if (!storeId) return
    loadSummary()
  }, [storeId])

  async function loadSummary() {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const { data: orders } = await supabase
      .from('orders')
      .select('total_amount, created_at')
      .eq('store_id', storeId)
      .gte('created_at', monthStart.toISOString())

    const todaySales = orders?.filter((o: { created_at: string }) => new Date(o.created_at) >= today)
      .reduce((sum: number, o: { total_amount: number }) => sum + (o.total_amount || 0), 0) || 0
    const weekSales = orders?.filter((o: { created_at: string }) => new Date(o.created_at) >= weekAgo)
      .reduce((sum: number, o: { total_amount: number }) => sum + (o.total_amount || 0), 0) || 0
    const monthSales = orders?.reduce((sum: number, o: { total_amount: number }) => sum + (o.total_amount || 0), 0) || 0

    const { data: expenses } = await supabase
      .from('expenses')
      .select('amount')
      .eq('store_id', storeId)
      .eq('status', 'pending')
    const pendingExpenses = expenses?.reduce((sum: number, e: { amount: number }) => sum + (e.amount || 0), 0) || 0

    const { data: receivables } = await supabase
      .from('receivables')
      .select('amount')
      .eq('store_id', storeId)
      .eq('status', 'pending')
    const pendingReceivables = receivables?.reduce((sum: number, r: { amount: number }) => sum + (r.amount || 0), 0) || 0

    setSummary({ todaySales, weekSales, monthSales, pendingExpenses, pendingReceivables })
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
              <DollarSign className="w-6 h-6 md:w-7 md:h-7 text-white" />
            </div>
            Financeiro
          </h1>
          <p className="text-slate-500 mt-2 ml-14">Controle completo de receitas e despesas</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 text-white">
            <div className="flex items-center justify-between mb-1">
              <span className="text-emerald-100 text-sm">Hoje</span>
              <TrendingUp className="w-5 h-5 text-emerald-200" />
            </div>
            <p className="text-2xl font-bold">{formatCurrency(summary.todaySales)}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border shadow-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-500 text-sm">Semana</span>
              <BarChart3 className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(summary.weekSales)}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border shadow-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-500 text-sm">Mês</span>
              <Receipt className="w-5 h-5 text-violet-500" />
            </div>
            <p className="text-2xl font-bold text-violet-600">{formatCurrency(summary.monthSales)}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border shadow-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-500 text-sm">A Pagar</span>
              <ArrowDownLeft className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.pendingExpenses)}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border shadow-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-500 text-sm">A Receber</span>
              <ArrowUpRight className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.pendingReceivables)}</p>
          </div>
        </div>

        <div className="flex gap-2 border-b pb-2">
          {([
            { id: 'resumo' as TabType, label: 'DRE / Resumo' },
            { id: 'caixa' as TabType, label: 'Controle de Caixa' },
            { id: 'despesas' as TabType, label: 'Contas a Pagar' },
            { id: 'receber' as TabType, label: 'Contas a Receber' }
          ]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-t-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-emerald-600 border border-b-0 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-lg border p-6">
          {activeTab === 'resumo' && storeId && <DRETab storeId={storeId} />}
          {activeTab === 'caixa' && storeId && <CashControlTab storeId={storeId} />}
          {activeTab === 'despesas' && storeId && <ExpensesTab storeId={storeId} />}
          {activeTab === 'receber' && storeId && <ReceivablesTab storeId={storeId} />}
        </div>
      </div>
    </div>
  )
}
