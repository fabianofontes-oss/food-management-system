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
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-gray-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-green-600" />
            Financeiro
          </h1>
          <p className="text-gray-500">Controle de caixa e movimentações</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button 
            onClick={() => setShowNewMovement(true)}
            className="bg-green-600 hover:bg-green-700"
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
          >
            {filter === 'today' ? 'Hoje' : filter === 'week' ? 'Semana' : 'Mês'}
          </Button>
        ))}
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Vendas Hoje</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.todaySales)}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Vendas do Mês</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.monthSales)}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pagamentos Pendentes</p>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(summary.pendingPayments)}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Lucro Estimado</p>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(summary.netProfit)}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <PiggyBank className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Caixas e Movimentações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status do Caixa */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Status do Caixa
            </h2>
          </div>
          <div className="p-4">
            {cashRegisters.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Wallet className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>Nenhum caixa registrado</p>
                <Button className="mt-4" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Abrir Caixa
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {cashRegisters.slice(0, 5).map(register => (
                  <div 
                    key={register.id}
                    className={`p-4 rounded-lg border ${
                      register.status === 'open' 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-gray-50'
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
  )
}
