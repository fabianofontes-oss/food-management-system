'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  Search, Users, TrendingUp, DollarSign, MessageCircle, Loader2,
  AlertTriangle, Clock, Gift, Cake, Star, CheckCircle, XCircle,
  Sparkles, Send
} from 'lucide-react'
import { formatCurrency, formatPhone } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'

type RetentionStatus = 'active' | 'warning' | 'risk' | 'new' | 'inactive'
type CustomerSegment = 'vip' | 'frequent' | 'regular' | 'new' | 'prospect'

interface Customer {
  id: string
  name: string
  phone: string
  email: string
  birth_date?: string
  total_orders: number
  total_spent: number
  last_order_at?: string
  days_inactive: number
  retention_status: RetentionStatus
  is_birthday_period: boolean
  customer_segment: CustomerSegment
  stamps_current: number
  stamps_completed: number
}

interface RetentionMessage {
  id: string
  trigger_type: string
  message_template: string
  include_coupon: boolean
  coupon_code?: string
  coupon_discount_percent?: number
}

const RETENTION_STATUS_CONFIG = {
  active: { 
    label: 'Ativo', 
    color: 'emerald', 
    icon: CheckCircle,
    bgClass: 'bg-emerald-100',
    textClass: 'text-emerald-700',
    borderClass: 'border-emerald-200'
  },
  warning: { 
    label: 'Ausente', 
    color: 'amber', 
    icon: Clock,
    bgClass: 'bg-amber-100',
    textClass: 'text-amber-700',
    borderClass: 'border-amber-200'
  },
  risk: { 
    label: 'Risco', 
    color: 'red', 
    icon: AlertTriangle,
    bgClass: 'bg-red-100',
    textClass: 'text-red-700',
    borderClass: 'border-red-200'
  },
  new: { 
    label: 'Novo', 
    color: 'blue', 
    icon: Sparkles,
    bgClass: 'bg-blue-100',
    textClass: 'text-blue-700',
    borderClass: 'border-blue-200'
  },
  inactive: { 
    label: 'Inativo', 
    color: 'gray', 
    icon: XCircle,
    bgClass: 'bg-gray-100',
    textClass: 'text-gray-700',
    borderClass: 'border-gray-200'
  }
}

const SEGMENT_CONFIG = {
  vip: { label: 'VIP', emoji: '👑', color: 'from-amber-500 to-orange-500' },
  frequent: { label: 'Frequente', emoji: '⭐', color: 'from-purple-500 to-violet-500' },
  regular: { label: 'Regular', emoji: '🙂', color: 'from-blue-500 to-indigo-500' },
  new: { label: 'Novo', emoji: '🌱', color: 'from-emerald-500 to-teal-500' },
  prospect: { label: 'Prospect', emoji: '👀', color: 'from-gray-400 to-gray-500' }
}

export default function CRMPage() {
  const params = useParams()
  const slug = params.slug as string
  const supabase = useMemo(() => createClient(), [])
  
  const [storeId, setStoreId] = useState<string | null>(null)
  const [storeConfig, setStoreConfig] = useState<{
    loyalty_active: boolean
    loyalty_retention_first_warning_days: number
    loyalty_retention_second_warning_days: number
    loyalty_retention_second_warning_discount: number
    loyalty_stamps_to_reward: number
  } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<RetentionStatus | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [messages, setMessages] = useState<RetentionMessage[]>([])
  const [loading, setLoading] = useState(true)

  // Carregar store e config
  useEffect(() => {
    async function loadStore() {
      if (!slug) return
      const { data } = await supabase
        .from('stores')
        .select(`
          id,
          loyalty_active,
          loyalty_retention_first_warning_days,
          loyalty_retention_second_warning_days,
          loyalty_retention_second_warning_discount,
          loyalty_stamps_to_reward
        `)
        .eq('slug', slug)
        .single()
      
      if (data) {
        setStoreId(data.id)
        setStoreConfig({
          loyalty_active: data.loyalty_active ?? true,
          loyalty_retention_first_warning_days: data.loyalty_retention_first_warning_days ?? 30,
          loyalty_retention_second_warning_days: data.loyalty_retention_second_warning_days ?? 60,
          loyalty_retention_second_warning_discount: data.loyalty_retention_second_warning_discount ?? 15,
          loyalty_stamps_to_reward: data.loyalty_stamps_to_reward ?? 10
        })
      }
    }
    loadStore()
  }, [slug, supabase])

  // Carregar clientes e mensagens
  useEffect(() => {
    async function fetchData() {
      if (!storeId) return
      setLoading(true)

      try {
        // Buscar clientes com dados de fidelidade
        const { data: customersData } = await supabase
          .from('customers')
          .select(`
            id, name, phone, email, birth_date, created_at,
            customer_loyalty (
              points_balance, stamps_current, stamps_completed,
              total_orders, total_spent, last_order_at
            )
          `)
          .eq('store_id', storeId)
          .order('created_at', { ascending: false })

        // Buscar mensagens de retenção
        const { data: messagesData } = await supabase
          .from('retention_messages')
          .select('*')
          .eq('store_id', storeId)

        if (messagesData) setMessages(messagesData)

        // Processar clientes
        const firstWarning = storeConfig?.loyalty_retention_first_warning_days || 30
        const secondWarning = storeConfig?.loyalty_retention_second_warning_days || 60

        const processedCustomers: Customer[] = (customersData || []).map((c: any) => {
          const loyalty = c.customer_loyalty?.[0] || {}
          const lastOrder = loyalty.last_order_at ? new Date(loyalty.last_order_at) : null
          const createdAt = new Date(c.created_at)
          
          // Calcular dias de inatividade
          const referenceDate = lastOrder || createdAt
          const daysInactive = Math.floor((Date.now() - referenceDate.getTime()) / (1000 * 60 * 60 * 24))
          
          // Determinar status de retenção
          let retentionStatus: RetentionStatus = 'active'
          if (!lastOrder && daysInactive <= 7) {
            retentionStatus = 'new'
          } else if (daysInactive > secondWarning) {
            retentionStatus = 'risk'
          } else if (daysInactive > firstWarning) {
            retentionStatus = 'warning'
          } else if (!lastOrder) {
            retentionStatus = 'inactive'
          }
          
          // Verificar aniversário
          let isBirthday = false
          if (c.birth_date) {
            const birth = new Date(c.birth_date)
            const today = new Date()
            const diffDays = Math.abs(
              (today.getMonth() * 30 + today.getDate()) - 
              (birth.getMonth() * 30 + birth.getDate())
            )
            isBirthday = diffDays <= 3
          }
          
          // Determinar segmento
          let segment: CustomerSegment = 'prospect'
          const totalSpent = loyalty.total_spent || 0
          const totalOrders = loyalty.total_orders || 0
          if (totalSpent >= 500) segment = 'vip'
          else if (totalOrders >= 10) segment = 'frequent'
          else if (totalOrders >= 3) segment = 'regular'
          else if (totalOrders >= 1) segment = 'new'

          return {
            id: c.id,
            name: c.name,
            phone: c.phone,
            email: c.email || '',
            birth_date: c.birth_date,
            total_orders: totalOrders,
            total_spent: totalSpent,
            last_order_at: loyalty.last_order_at,
            days_inactive: daysInactive,
            retention_status: retentionStatus,
            is_birthday_period: isBirthday,
            customer_segment: segment,
            stamps_current: loyalty.stamps_current || 0,
            stamps_completed: loyalty.stamps_completed || 0
          }
        })

        setCustomers(processedCustomers)
      } catch (error) {
        console.error('Erro ao buscar dados:', error)
        toast.error('Erro ao carregar clientes')
      } finally {
        setLoading(false)
      }
    }
    
    if (storeId && storeConfig) fetchData()
  }, [storeId, storeConfig, supabase])

  // Filtrar clientes
  const filteredCustomers = customers.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         c.phone.includes(searchQuery)
    const matchesStatus = selectedStatus ? c.retention_status === selectedStatus : true
    return matchesSearch && matchesStatus
  })

  // Estatísticas
  const stats = {
    total: customers.length,
    active: customers.filter(c => c.retention_status === 'active').length,
    warning: customers.filter(c => c.retention_status === 'warning').length,
    risk: customers.filter(c => c.retention_status === 'risk').length,
    birthday: customers.filter(c => c.is_birthday_period).length,
    vip: customers.filter(c => c.customer_segment === 'vip').length,
    totalRevenue: customers.reduce((sum, c) => sum + c.total_spent, 0)
  }

  // Gerar mensagem WhatsApp
  const generateWhatsAppMessage = (customer: Customer): string => {
    let template = ''
    
    if (customer.is_birthday_period) {
      const msg = messages.find(m => m.trigger_type === 'birthday')
      template = msg?.message_template || 'Feliz Aniversário, {nome}! 🎂'
    } else if (customer.retention_status === 'risk') {
      const msg = messages.find(m => m.trigger_type === 'second_warning')
      template = msg?.message_template || 'Oi {nome}, estamos com saudades! 💜'
    } else if (customer.retention_status === 'warning') {
      const msg = messages.find(m => m.trigger_type === 'first_warning')
      template = msg?.message_template || 'Oi {nome}! Faz tempo que não te vemos. 👋'
    } else {
      template = 'Olá {nome}! Tudo bem? 😊'
    }
    
    return template.replace('{nome}', customer.name.split(' ')[0])
  }

  const sendWhatsApp = (customer: Customer) => {
    const message = generateWhatsAppMessage(customer)
    const phone = customer.phone.replace(/\D/g, '')
    const url = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
    toast.success(`Abrindo WhatsApp para ${customer.name}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl">
          <Loader2 className="w-14 h-14 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 text-lg font-medium">Carregando CRM...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg shadow-purple-500/25">
              <Users className="w-6 h-6 md:w-7 md:h-7 text-white" />
            </div>
            CRM - Retenção de Clientes
          </h1>
          <p className="text-slate-500 mt-2 ml-14">Semáforo de relacionamento e fidelização</p>
        </div>

        {/* Cards de Semáforo */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {/* Ativos */}
          <button
            onClick={() => setSelectedStatus(selectedStatus === 'active' ? null : 'active')}
            className={`p-4 rounded-2xl border-2 transition-all ${
              selectedStatus === 'active' ? 'border-emerald-500 shadow-lg' : 'border-transparent'
            } bg-gradient-to-br from-emerald-50 to-emerald-100 hover:shadow-md`}
          >
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
              <span className="text-2xl">🟢</span>
            </div>
            <p className="text-2xl font-bold text-emerald-700">{stats.active}</p>
            <p className="text-sm text-emerald-600">Ativos</p>
          </button>

          {/* Warning */}
          <button
            onClick={() => setSelectedStatus(selectedStatus === 'warning' ? null : 'warning')}
            className={`p-4 rounded-2xl border-2 transition-all ${
              selectedStatus === 'warning' ? 'border-amber-500 shadow-lg' : 'border-transparent'
            } bg-gradient-to-br from-amber-50 to-amber-100 hover:shadow-md`}
          >
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-6 h-6 text-amber-600" />
              <span className="text-2xl">🟡</span>
            </div>
            <p className="text-2xl font-bold text-amber-700">{stats.warning}</p>
            <p className="text-sm text-amber-600">Ausentes ({storeConfig?.loyalty_retention_first_warning_days}+ dias)</p>
          </button>

          {/* Risk */}
          <button
            onClick={() => setSelectedStatus(selectedStatus === 'risk' ? null : 'risk')}
            className={`p-4 rounded-2xl border-2 transition-all ${
              selectedStatus === 'risk' ? 'border-red-500 shadow-lg' : 'border-transparent'
            } bg-gradient-to-br from-red-50 to-red-100 hover:shadow-md`}
          >
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <span className="text-2xl">🔴</span>
            </div>
            <p className="text-2xl font-bold text-red-700">{stats.risk}</p>
            <p className="text-sm text-red-600">Risco ({storeConfig?.loyalty_retention_second_warning_days}+ dias)</p>
          </button>

          {/* Aniversariantes */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-50 to-pink-100">
            <div className="flex items-center justify-between mb-2">
              <Cake className="w-6 h-6 text-pink-600" />
              <span className="text-2xl">🎂</span>
            </div>
            <p className="text-2xl font-bold text-pink-700">{stats.birthday}</p>
            <p className="text-sm text-pink-600">Aniversariantes</p>
          </div>

          {/* VIPs */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-100">
            <div className="flex items-center justify-between mb-2">
              <Star className="w-6 h-6 text-amber-600" />
              <span className="text-2xl">👑</span>
            </div>
            <p className="text-2xl font-bold text-amber-700">{stats.vip}</p>
            <p className="text-sm text-amber-600">VIPs</p>
          </div>
        </div>

        {/* Receita e Total */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total de Clientes</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{stats.total}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Receita Total</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mt-1">
                  {formatCurrency(stats.totalRevenue)}
                </p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-xl">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Busca */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou telefone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Tabela de Clientes */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-slate-700">Status</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-slate-700">Cliente</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-slate-700">Fidelidade</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-slate-700">Última Compra</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-slate-700">Total Gasto</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-slate-700">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => {
                    const statusConfig = RETENTION_STATUS_CONFIG[customer.retention_status]
                    const segmentConfig = SEGMENT_CONFIG[customer.customer_segment]
                    const StatusIcon = statusConfig.icon
                    const stampsToReward = storeConfig?.loyalty_stamps_to_reward || 10
                    
                    return (
                      <tr key={customer.id} className="hover:bg-slate-50/50 transition-colors">
                        {/* Status */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg ${statusConfig.bgClass}`}>
                              <StatusIcon className={`w-4 h-4 ${statusConfig.textClass}`} />
                            </div>
                            <div>
                              <span className={`text-xs font-semibold ${statusConfig.textClass}`}>
                                {statusConfig.label}
                              </span>
                              {customer.days_inactive > 0 && (
                                <p className="text-xs text-slate-400">{customer.days_inactive} dias</p>
                              )}
                            </div>
                            {customer.is_birthday_period && (
                              <span className="text-lg" title="Aniversariante!">🎂</span>
                            )}
                          </div>
                        </td>
                        
                        {/* Cliente */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{segmentConfig.emoji}</span>
                            <div>
                              <p className="font-semibold text-slate-800">{customer.name}</p>
                              <p className="text-sm text-slate-500">{formatPhone(customer.phone)}</p>
                            </div>
                          </div>
                        </td>
                        
                        {/* Fidelidade */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {Array.from({ length: stampsToReward }).map((_, i) => (
                              <div
                                key={i}
                                className={`w-3 h-3 rounded-full ${
                                  i < customer.stamps_current
                                    ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                                    : 'bg-slate-200'
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {customer.stamps_current}/{stampsToReward} selos
                            {customer.stamps_completed > 0 && (
                              <span className="text-emerald-600 ml-1">
                                ({customer.stamps_completed}x completo)
                              </span>
                            )}
                          </p>
                        </td>
                        
                        {/* Última Compra */}
                        <td className="px-4 py-3">
                          {customer.last_order_at ? (
                            <span className="text-sm text-slate-600">
                              {new Date(customer.last_order_at).toLocaleDateString('pt-BR')}
                            </span>
                          ) : (
                            <span className="text-sm text-slate-400">Nunca</span>
                          )}
                        </td>
                        
                        {/* Total Gasto */}
                        <td className="px-4 py-3">
                          <span className="font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                            {formatCurrency(customer.total_spent)}
                          </span>
                          <p className="text-xs text-slate-400">{customer.total_orders} pedidos</p>
                        </td>
                        
                        {/* Ação */}
                        <td className="px-4 py-3">
                          <button
                            onClick={() => sendWhatsApp(customer)}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium transition-all shadow-md hover:shadow-lg ${
                              customer.retention_status === 'risk'
                                ? 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700'
                                : customer.retention_status === 'warning'
                                ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700'
                                : customer.is_birthday_period
                                ? 'bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700'
                                : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                            }`}
                          >
                            <MessageCircle className="w-4 h-4" />
                            {customer.retention_status === 'risk' ? 'Resgatar' :
                             customer.retention_status === 'warning' ? 'Reativar' :
                             customer.is_birthday_period ? 'Parabenizar' : 'Contatar'}
                          </button>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
                        <Users className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-slate-400 font-medium">Nenhum cliente encontrado</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
