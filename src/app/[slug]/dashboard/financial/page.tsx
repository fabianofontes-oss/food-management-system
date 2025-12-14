'use client'

import { useMemo, useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { 
  DollarSign, TrendingUp, TrendingDown, Wallet, 
  CreditCard, Banknote, PiggyBank, ArrowUpCircle, 
  ArrowDownCircle, Calendar, Download, Plus, 
  Loader2, AlertCircle, Receipt, BarChart3,
  Clock, CheckCircle, XCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CashRegister {
  id: string
  opened_by: string
  closed_by: string | null
  opening_amount: number
  closing_amount: number | null
  expected_amount: number | null
  difference: number | null
  status: 'open' | 'closed'
  opened_at: string
  closed_at: string | null
  notes: string | null
}

interface CashMovement {
  id: string
  register_id: string
  type: 'sale' | 'withdrawal' | 'deposit' | 'adjustment'
  amount: number
  description: string | null
  payment_method: string | null
  created_at: string
  created_by: string
}

interface FinancialSummary {
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  cashInHand: number
  pendingPayments: number
  todaySales: number
  weekSales: number
  monthSales: number
}

type DateFilter = 'today' | 'week' | 'month' | 'custom'

export default function FinancialPage() {
  const params = useParams()
  const slug = params.slug as string
  const supabase = useMemo(() => createClient(), [])
  
  const [storeId, setStoreId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const [dateFilter, setDateFilter] = useState<DateFilter>('month')
  const [cashRegisters, setCashRegisters] = useState<CashRegister[]>([])
  const [movements, setMovements] = useState<CashMovement[]>([])
  const [summary, setSummary] = useState<FinancialSummary>({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    cashInHand: 0,
    pendingPayments: 0,
    todaySales: 0,
    weekSales: 0,
    monthSales: 0
  })
  
  const [showNewMovement, setShowNewMovement] = useState(false)
  const [newMovement, setNewMovement] = useState({
    type: 'deposit' as 'deposit' | 'withdrawal' | 'adjustment',
    amount: '',
    description: ''
  })

  // Carregar store
  useEffect(() => {
    async function loadStore() {
      try {
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
      } catch (err) {
        console.error('Erro ao carregar loja:', err)
        setError('Erro ao carregar loja')
        setLoading(false)
      }
    }
    loadStore()
  }, [slug, supabase])

  // Carregar dados financeiros
  useEffect(() => {
    if (!storeId) return
    loadFinancialData()
  }, [storeId, dateFilter])

  async function loadFinancialData() {
    try {
      setLoading(true)
      
      // Calcular datas
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

      // Buscar pedidos para calcular receita
      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount, payment_status, created_at')
        .eq('store_id', storeId)
        .gte('created_at', monthAgo.toISOString())

      if (orders) {
        const todaySales = orders
          .filter(o => new Date(o.created_at) >= today)
          .reduce((sum, o) => sum + (o.total_amount || 0), 0)
        
        const weekSales = orders
          .filter(o => new Date(o.created_at) >= weekAgo)
          .reduce((sum, o) => sum + (o.total_amount || 0), 0)
        
        const monthSales = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
        
        const pendingPayments = orders
          .filter(o => o.payment_status === 'pending')
          .reduce((sum, o) => sum + (o.total_amount || 0), 0)

        setSummary(prev => ({
          ...prev,
          todaySales,
          weekSales,
          monthSales,
          totalRevenue: monthSales,
          pendingPayments,
          netProfit: monthSales * 0.7 // Estimativa simplificada
        }))
      }

      // Buscar caixas
      const { data: registers } = await supabase
        .from('cash_registers')
        .select('*')
        .eq('store_id', storeId)
        .order('opened_at', { ascending: false })
        .limit(10)

      if (registers) {
        setCashRegisters(registers)
        
        // Calcular dinheiro em caixa
        const openRegister = registers.find(r => r.status === 'open')
        if (openRegister) {
          setSummary(prev => ({
            ...prev,
            cashInHand: openRegister.opening_amount + (openRegister.expected_amount || 0)
          }))
        }
      }

      // Buscar movimentações
      const { data: movs } = await supabase
        .from('cash_movements')
        .select('*')
        .eq('store_id', storeId)
        .gte('created_at', monthAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(50)

      if (movs) {
        setMovements(movs)
      }

    } catch (err) {
      console.error('Erro ao carregar dados financeiros:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddMovement() {
    if (!storeId || !newMovement.amount) return
    
    try {
      const openRegister = cashRegisters.find(r => r.status === 'open')
      
      const { error } = await supabase
        .from('cash_movements')
        .insert({
          store_id: storeId,
          register_id: openRegister?.id,
          type: newMovement.type,
          amount: parseFloat(newMovement.amount),
          description: newMovement.description || null
        })

      if (error) throw error
      
      setShowNewMovement(false)
      setNewMovement({ type: 'deposit', amount: '', description: '' })
      loadFinancialData()
    } catch (err) {
      console.error('Erro ao adicionar movimentação:', err)
    }
  }

  if (loading && !storeId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl shadow-slate-200/50">
          <Loader2 className="w-14 h-14 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 text-lg font-medium">Carregando dados financeiros...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50/30 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl shadow-slate-200/50">
          <div className="p-4 bg-red-100 rounded-2xl w-fit mx-auto mb-4">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/25">
              <DollarSign className="w-6 h-6 md:w-7 md:h-7 text-white" />
            </div>
            Financeiro
          </h1>
          <p className="text-slate-500 mt-2 ml-14">Controle de caixa e movimentações</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" className="hover:shadow-md transition-all">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button 
            onClick={() => setShowNewMovement(true)}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/25"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Movimentação
          </Button>
        </div>
      </div>

      {/* Filtros de período */}
      <div className="flex gap-2">
        {(['today', 'week', 'month'] as DateFilter[]).map(filter => (
          <Button
            key={filter}
            variant={dateFilter === filter ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateFilter(filter)}
            className={dateFilter === filter ? 'bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg shadow-emerald-500/25' : 'hover:shadow-md transition-all'}
          >
            {filter === 'today' ? 'Hoje' : filter === 'week' ? 'Semana' : 'Mês'}
          </Button>
        ))}
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl p-6 shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Vendas Hoje</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{formatCurrency(summary.todaySales)}</p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-xl">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Vendas do Mês</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(summary.monthSales)}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Pagamentos Pendentes</p>
              <p className="text-2xl font-bold text-amber-600">{formatCurrency(summary.pendingPayments)}</p>
            </div>
            <div className="p-3 bg-amber-100 rounded-xl">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Lucro Estimado</p>
              <p className="text-2xl font-bold text-violet-600">{formatCurrency(summary.netProfit)}</p>
            </div>
            <div className="p-3 bg-violet-100 rounded-xl">
              <PiggyBank className="w-6 h-6 text-violet-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Caixas e Movimentações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status do Caixa */}
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100">
          <div className="p-5 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Wallet className="w-5 h-5 text-slate-600" />
              </div>
              Status do Caixa
            </h2>
          </div>
          <div className="p-5">
            {cashRegisters.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
                  <Wallet className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-400 font-medium">Nenhum caixa registrado</p>
                <Button className="mt-4 bg-gradient-to-r from-emerald-600 to-teal-600" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Abrir Caixa
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {cashRegisters.slice(0, 5).map(register => (
                  <div 
                    key={register.id}
                    className={`p-4 rounded-xl border transition-all ${
                      register.status === 'open' 
                        ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200' 
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {register.status === 'open' ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-gray-400" />
                        )}
                        <span className="font-medium">
                          {register.status === 'open' ? 'Caixa Aberto' : 'Caixa Fechado'}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(register.opened_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Abertura:</span>
                        <span className="ml-2 font-medium">{formatCurrency(register.opening_amount)}</span>
                      </div>
                      {register.closing_amount !== null && (
                        <div>
                          <span className="text-gray-500">Fechamento:</span>
                          <span className="ml-2 font-medium">{formatCurrency(register.closing_amount)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Últimas Movimentações */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Últimas Movimentações
            </h2>
          </div>
          <div className="p-4">
            {movements.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Receipt className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>Nenhuma movimentação</p>
              </div>
            ) : (
              <div className="space-y-2">
                {movements.slice(0, 8).map(mov => (
                  <div 
                    key={mov.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      {mov.type === 'sale' || mov.type === 'deposit' ? (
                        <ArrowUpCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <ArrowDownCircle className="w-5 h-5 text-red-500" />
                      )}
                      <div>
                        <p className="font-medium text-sm">
                          {mov.type === 'sale' ? 'Venda' : 
                           mov.type === 'deposit' ? 'Depósito' :
                           mov.type === 'withdrawal' ? 'Retirada' : 'Ajuste'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {mov.description || mov.payment_method || '-'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${
                        mov.type === 'sale' || mov.type === 'deposit' 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {mov.type === 'sale' || mov.type === 'deposit' ? '+' : '-'}
                        {formatCurrency(mov.amount)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(mov.created_at).toLocaleTimeString('pt-BR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Nova Movimentação */}
      {showNewMovement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Nova Movimentação</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  value={newMovement.type}
                  onChange={e => setNewMovement(prev => ({ 
                    ...prev, 
                    type: e.target.value as 'deposit' | 'withdrawal' | 'adjustment' 
                  }))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="deposit">Depósito / Entrada</option>
                  <option value="withdrawal">Retirada / Sangria</option>
                  <option value="adjustment">Ajuste</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newMovement.amount}
                  onChange={e => setNewMovement(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="0,00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <input
                  type="text"
                  value={newMovement.description}
                  onChange={e => setNewMovement(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Ex: Sangria para depósito bancário"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowNewMovement(false)}
              >
                Cancelar
              </Button>
              <Button 
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={handleAddMovement}
              >
                Salvar
              </Button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
