'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { 
  User, Package, MapPin, Clock, Star, Gift, Trophy, 
  ChevronRight, Phone, Mail, History, Truck, CheckCircle,
  XCircle, Loader2, ArrowLeft, QrCode, Percent, Coins
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Order {
  id: string
  order_code: string
  status: string
  total_amount: number
  created_at: string
  order_type: string
  payment_method: string
  payment_status: string
}

interface CustomerReward {
  id: string
  points: number
  total_orders: number
  total_spent: number
  level: string
  rewards_available: number
}

export default function MinhaContaPage() {
  const params = useParams()
  const slug = params.slug as string
  const supabase = useMemo(() => createClient(), [])
  
  const [loading, setLoading] = useState(true)
  const [storeId, setStoreId] = useState<string | null>(null)
  const [storeName, setStoreName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerData, setCustomerData] = useState<any>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [rewards, setRewards] = useState<CustomerReward | null>(null)
  const [activeTab, setActiveTab] = useState<'orders' | 'rewards' | 'tracking'>('orders')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [trackingId, setTrackingId] = useState('')

  useEffect(() => {
    async function fetchStore() {
      const { data } = await supabase
        .from('stores')
        .select('id, name')
        .eq('slug', slug)
        .single()
      
      if (data) {
        setStoreId(data.id)
        setStoreName(data.name)
      }
      setLoading(false)
    }
    if (slug) fetchStore()
  }, [slug, supabase])

  const handleLogin = async () => {
    if (!customerPhone || customerPhone.length < 10) {
      alert('Digite um telefone válido')
      return
    }

    setLoading(true)
    try {
      // Buscar pedidos pelo telefone
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('store_id', storeId)
        .eq('customer_phone', customerPhone)
        .order('created_at', { ascending: false })

      if (ordersData && ordersData.length > 0) {
        setOrders(ordersData)
        setCustomerData({
          name: ordersData[0].customer_name,
          phone: customerPhone,
          email: ordersData[0].customer_email
        })
        
        // Calcular recompensas
        const totalSpent = ordersData.reduce((acc: number, o: Order) => acc + (o.total_amount || 0), 0)
        const points = Math.floor(totalSpent / 10) // 1 ponto a cada R$10
        const level = points >= 500 ? 'Ouro' : points >= 200 ? 'Prata' : 'Bronze'
        
        setRewards({
          id: '1',
          points,
          total_orders: ordersData.length,
          total_spent: totalSpent,
          level,
          rewards_available: Math.floor(points / 100) // 1 recompensa a cada 100 pontos
        })
        
        setIsLoggedIn(true)
      } else {
        alert('Nenhum pedido encontrado com este telefone')
      }
    } catch (err) {
      console.error('Erro:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendente',
      confirmed: 'Confirmado',
      preparing: 'Preparando',
      ready: 'Pronto',
      out_for_delivery: 'Saiu para Entrega',
      delivered: 'Entregue',
      cancelled: 'Cancelado'
    }
    return labels[status] || status
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      confirmed: 'bg-blue-100 text-blue-700',
      preparing: 'bg-orange-100 text-orange-700',
      ready: 'bg-green-100 text-green-700',
      out_for_delivery: 'bg-purple-100 text-purple-700',
      delivered: 'bg-emerald-100 text-emerald-700',
      cancelled: 'bg-red-100 text-red-700'
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      Bronze: 'from-amber-600 to-amber-800',
      Prata: 'from-gray-400 to-gray-600',
      Ouro: 'from-yellow-400 to-amber-500'
    }
    return colors[level] || 'from-gray-400 to-gray-600'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50 p-4">
        <div className="max-w-md mx-auto pt-8">
          <Link href={`/${slug}`} className="inline-flex items-center gap-2 text-slate-600 hover:text-orange-600 mb-6">
            <ArrowLeft className="w-5 h-5" />
            Voltar ao cardápio
          </Link>

          <div className="bg-white rounded-3xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                <User className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-800">Minha Conta</h1>
              <p className="text-slate-500 mt-2">{storeName}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Seu telefone
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all text-lg"
                  />
                </div>
              </div>

              <Button
                onClick={handleLogin}
                disabled={loading}
                className="w-full py-4 text-lg bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
              >
                {loading ? 'Buscando...' : 'Acessar'}
              </Button>

              <div className="text-center">
                <p className="text-sm text-slate-500">
                  Use o telefone cadastrado nos seus pedidos
                </p>
              </div>
            </div>

            {/* Rastreio Rápido */}
            <div className="mt-8 pt-8 border-t border-slate-200">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5 text-orange-600" />
                Rastrear Entrega
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  placeholder="Código do pedido"
                  className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-orange-500 outline-none"
                />
                <Link href={`/${slug}/rastreio/${trackingId}`}>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <MapPin className="w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-6 pb-20">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Link href={`/${slug}`} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <span className="text-sm opacity-90">{storeName}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{customerData?.name}</h1>
              <p className="text-sm opacity-90">{customerData?.phone}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Card de Recompensas */}
      {rewards && (
        <div className="max-w-2xl mx-auto px-4 -mt-12">
          <div className={`bg-gradient-to-r ${getLevelColor(rewards.level)} rounded-2xl p-6 text-white shadow-xl`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-6 h-6" />
                <span className="font-bold text-lg">Nível {rewards.level}</span>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{rewards.points}</div>
                <div className="text-sm opacity-90">pontos</div>
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span>{rewards.total_orders} pedidos</span>
              <span>{formatCurrency(rewards.total_spent)} gastos</span>
              <span>{rewards.rewards_available} recompensas</span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-2xl mx-auto px-4 mt-6">
        <div className="flex gap-2 bg-white rounded-xl p-1 shadow-md">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'orders' ? 'bg-orange-500 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <History className="w-5 h-5" />
            Pedidos
          </button>
          <button
            onClick={() => setActiveTab('rewards')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'rewards' ? 'bg-orange-500 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Gift className="w-5 h-5" />
            Recompensas
          </button>
          <button
            onClick={() => setActiveTab('tracking')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'tracking' ? 'bg-orange-500 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Truck className="w-5 h-5" />
            Rastrear
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <h2 className="font-bold text-slate-800 text-lg">Histórico de Pedidos</h2>
            {orders.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-md">
                <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Nenhum pedido encontrado</p>
              </div>
            ) : (
              orders.map(order => (
                <div key={order.id} className="bg-white rounded-2xl p-5 shadow-md hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-bold text-slate-800 text-lg">#{order.order_code}</div>
                      <div className="text-sm text-slate-500">
                        {new Date(order.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="text-slate-600">{order.order_type === 'delivery' ? '🚚 Delivery' : '🍽️ Mesa'}</span>
                    <span className="font-bold text-lg text-emerald-600">{formatCurrency(order.total_amount)}</span>
                  </div>
                  {order.status === 'out_for_delivery' && (
                    <Link href={`/${slug}/rastreio/${order.id}`}>
                      <Button className="w-full mt-3 bg-purple-600 hover:bg-purple-700">
                        <MapPin className="w-4 h-4 mr-2" />
                        Rastrear Entrega
                      </Button>
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'rewards' && rewards && (
          <div className="space-y-4">
            <h2 className="font-bold text-slate-800 text-lg">Programa de Recompensas</h2>
            
            {/* Progresso */}
            <div className="bg-white rounded-2xl p-6 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <span className="font-medium text-slate-700">Próximo nível</span>
                <span className="text-sm text-slate-500">
                  {rewards.level === 'Bronze' ? `${200 - rewards.points} pontos para Prata` :
                   rewards.level === 'Prata' ? `${500 - rewards.points} pontos para Ouro` :
                   '🏆 Nível máximo!'}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-orange-500 to-red-600 h-3 rounded-full transition-all"
                  style={{ 
                    width: `${Math.min(
                      rewards.level === 'Bronze' ? (rewards.points / 200) * 100 :
                      rewards.level === 'Prata' ? ((rewards.points - 200) / 300) * 100 :
                      100
                    , 100)}%` 
                  }}
                />
              </div>
            </div>

            {/* Como ganhar pontos */}
            <div className="bg-white rounded-2xl p-6 shadow-md">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Coins className="w-5 h-5 text-yellow-500" />
                Como ganhar pontos
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-700">A cada R$10 em compras</span>
                  <span className="font-bold text-orange-600">+1 ponto</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-700">Avalie um pedido</span>
                  <span className="font-bold text-orange-600">+5 pontos</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-700">Indique um amigo</span>
                  <span className="font-bold text-orange-600">+20 pontos</span>
                </div>
              </div>
            </div>

            {/* Recompensas disponíveis */}
            <div className="bg-white rounded-2xl p-6 shadow-md">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Gift className="w-5 h-5 text-pink-500" />
                Recompensas Disponíveis
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-pink-50 to-orange-50 rounded-xl border border-pink-200">
                  <div>
                    <div className="font-bold text-slate-800">Frete Grátis</div>
                    <div className="text-sm text-slate-500">Em pedidos acima de R$30</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-pink-600">50 pts</div>
                    <Button size="sm" disabled={rewards.points < 50} className="mt-1 bg-pink-600 hover:bg-pink-700">
                      Resgatar
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                  <div>
                    <div className="font-bold text-slate-800">10% de Desconto</div>
                    <div className="text-sm text-slate-500">Em qualquer pedido</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-purple-600">100 pts</div>
                    <Button size="sm" disabled={rewards.points < 100} className="mt-1 bg-purple-600 hover:bg-purple-700">
                      Resgatar
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-200">
                  <div>
                    <div className="font-bold text-slate-800">Sobremesa Grátis</div>
                    <div className="text-sm text-slate-500">Escolha uma sobremesa</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-amber-600">150 pts</div>
                    <Button size="sm" disabled={rewards.points < 150} className="mt-1 bg-amber-600 hover:bg-amber-700">
                      Resgatar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tracking' && (
          <div className="space-y-4">
            <h2 className="font-bold text-slate-800 text-lg">Rastrear Entrega</h2>
            
            {/* Campo de busca */}
            <div className="bg-white rounded-2xl p-6 shadow-md">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  placeholder="Código do pedido ou ID da entrega"
                  className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-purple-500 outline-none"
                />
                <Link href={`/${slug}/rastreio/${trackingId}`}>
                  <Button className="bg-purple-600 hover:bg-purple-700 h-full px-6">
                    <MapPin className="w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Entregas em andamento */}
            <h3 className="font-bold text-slate-700 mt-6">Entregas em Andamento</h3>
            {orders.filter(o => o.status === 'out_for_delivery').length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-md">
                <Truck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Nenhuma entrega em andamento</p>
              </div>
            ) : (
              orders.filter(o => o.status === 'out_for_delivery').map(order => (
                <Link key={order.id} href={`/${slug}/rastreio/${order.id}`}>
                  <div className="bg-white rounded-2xl p-5 shadow-md hover:shadow-lg transition-all cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-800">#{order.order_code}</div>
                        <div className="text-sm text-purple-600">🚚 Saiu para entrega</div>
                      </div>
                      <ChevronRight className="w-6 h-6 text-slate-400" />
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
