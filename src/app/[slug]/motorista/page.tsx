'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { 
  Truck, MapPin, Clock, Phone, Package, User, Navigation, 
  CheckCircle, XCircle, Loader2, DollarSign, History, 
  ArrowLeft, Play, CheckCheck, Star, TrendingUp, Calendar
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Delivery {
  id: string
  status: string
  driver_name: string | null
  driver_phone: string | null
  address: string
  estimated_time: number
  delivery_fee: number
  created_at: string
  order?: {
    order_code: string
    customer_name: string
    total_amount: number
  }
}

interface DriverStats {
  todayDeliveries: number
  todayEarnings: number
  weekDeliveries: number
  weekEarnings: number
  totalDeliveries: number
  totalEarnings: number
  rating: number
}

export default function MotoristaPage() {
  const params = useParams()
  const slug = params.slug as string
  const supabase = useMemo(() => createClient(), [])
  
  const [loading, setLoading] = useState(true)
  const [storeId, setStoreId] = useState<string | null>(null)
  const [storeName, setStoreName] = useState('')
  const [driverPhone, setDriverPhone] = useState('')
  const [driverName, setDriverName] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [allDeliveries, setAllDeliveries] = useState<Delivery[]>([])
  const [stats, setStats] = useState<DriverStats | null>(null)
  const [activeTab, setActiveTab] = useState<'pending' | 'history' | 'earnings'>('pending')
  const [commissionPercent, setCommissionPercent] = useState(10)

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
    if (!driverPhone || driverPhone.length < 10) {
      alert('Digite um telefone válido')
      return
    }

    setLoading(true)
    try {
      // Buscar motorista
      const { data: driverData } = await supabase
        .from('drivers')
        .select('*')
        .eq('store_id', storeId)
        .eq('phone', driverPhone)
        .single()

      if (driverData) {
        setDriverName(driverData.name)
        setCommissionPercent(driverData.commission_percent || 10)
        
        // Buscar entregas do motorista
        await fetchDeliveries(driverData.name)
        setIsLoggedIn(true)
      } else {
        // Buscar por entregas com esse telefone
        const { data: deliveriesData } = await supabase
          .from('deliveries')
          .select(`*, order:orders(order_code, customer_name, total_amount)`)
          .eq('store_id', storeId)
          .eq('driver_phone', driverPhone)
          .order('created_at', { ascending: false })

        if (deliveriesData && deliveriesData.length > 0) {
          setDriverName(deliveriesData[0].driver_name || 'Motorista')
          setAllDeliveries(deliveriesData)
          setDeliveries(deliveriesData.filter((d: Delivery) => !['delivered', 'cancelled'].includes(d.status)))
          calculateStats(deliveriesData)
          setIsLoggedIn(true)
        } else {
          alert('Motorista não encontrado')
        }
      }
    } catch (err) {
      console.error('Erro:', err)
      alert('Erro ao acessar')
    } finally {
      setLoading(false)
    }
  }

  const fetchDeliveries = async (name: string) => {
    const { data } = await supabase
      .from('deliveries')
      .select(`*, order:orders(order_code, customer_name, total_amount)`)
      .eq('store_id', storeId)
      .eq('driver_name', name)
      .order('created_at', { ascending: false })

    if (data) {
      setAllDeliveries(data)
      setDeliveries(data.filter((d: Delivery) => !['delivered', 'cancelled'].includes(d.status)))
      calculateStats(data)
    }
  }

  const calculateStats = (deliveriesData: Delivery[]) => {
    const today = new Date().toDateString()
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const todayDelivs = deliveriesData.filter(
      (d: Delivery) => new Date(d.created_at).toDateString() === today && d.status === 'delivered'
    )
    const weekDelivs = deliveriesData.filter(
      (d: Delivery) => new Date(d.created_at) >= weekAgo && d.status === 'delivered'
    )
    const allDelivered = deliveriesData.filter((d: Delivery) => d.status === 'delivered')

    const calcEarnings = (delivs: Delivery[]) => 
      delivs.reduce((acc: number, d: Delivery) => acc + ((d.delivery_fee || 0) * commissionPercent / 100), 0)

    setStats({
      todayDeliveries: todayDelivs.length,
      todayEarnings: calcEarnings(todayDelivs),
      weekDeliveries: weekDelivs.length,
      weekEarnings: calcEarnings(weekDelivs),
      totalDeliveries: allDelivered.length,
      totalEarnings: calcEarnings(allDelivered),
      rating: 4.8
    })
  }

  const updateStatus = async (deliveryId: string, newStatus: string) => {
    try {
      await supabase
        .from('deliveries')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', deliveryId)

      await fetchDeliveries(driverName)
    } catch (err) {
      console.error('Erro:', err)
      alert('Erro ao atualizar status')
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      assigned: 'bg-blue-100 text-blue-700',
      picked_up: 'bg-purple-100 text-purple-700',
      in_transit: 'bg-orange-100 text-orange-700',
      delivered: 'bg-emerald-100 text-emerald-700',
      cancelled: 'bg-red-100 text-red-700'
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendente',
      assigned: 'Atribuído',
      picked_up: 'Coletado',
      in_transit: 'Em Trânsito',
      delivered: 'Entregue',
      cancelled: 'Cancelado'
    }
    return labels[status] || status
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
        <div className="max-w-md mx-auto pt-8">
          <Link href={`/${slug}`} className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600 mb-6">
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </Link>

          <div className="bg-white rounded-3xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Truck className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-800">Área do Motorista</h1>
              <p className="text-slate-500 mt-2">{storeName}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Seu telefone cadastrado
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="tel"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-lg"
                  />
                </div>
              </div>

              <Button
                onClick={handleLogin}
                disabled={loading}
                className="w-full py-4 text-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
              >
                {loading ? 'Entrando...' : 'Acessar'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Link href={`/${slug}`} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <span className="text-sm opacity-90">{storeName}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
              <User className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{driverName}</h1>
              <div className="flex items-center gap-2 text-sm opacity-90">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                {stats?.rating?.toFixed(1) || '5.0'} • {stats?.totalDeliveries || 0} entregas
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de estatísticas */}
      {stats && (
        <div className="max-w-2xl mx-auto px-4 -mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-4 shadow-lg">
              <div className="text-sm text-slate-500 mb-1">Hoje</div>
              <div className="text-2xl font-bold text-indigo-600">{formatCurrency(stats.todayEarnings)}</div>
              <div className="text-xs text-slate-400">{stats.todayDeliveries} entregas</div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-lg">
              <div className="text-sm text-slate-500 mb-1">Esta Semana</div>
              <div className="text-2xl font-bold text-purple-600">{formatCurrency(stats.weekEarnings)}</div>
              <div className="text-xs text-slate-400">{stats.weekDeliveries} entregas</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-2xl mx-auto px-4 mt-6">
        <div className="flex gap-2 bg-white rounded-xl p-1 shadow-md">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'pending' ? 'bg-indigo-500 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Package className="w-5 h-5" />
            Entregas ({deliveries.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'history' ? 'bg-indigo-500 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <History className="w-5 h-5" />
            Histórico
          </button>
          <button
            onClick={() => setActiveTab('earnings')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'earnings' ? 'bg-indigo-500 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <DollarSign className="w-5 h-5" />
            Ganhos
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {activeTab === 'pending' && (
          <div className="space-y-4">
            {deliveries.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-md">
                <Truck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Nenhuma entrega pendente</p>
              </div>
            ) : (
              deliveries.map(delivery => (
                <div key={delivery.id} className="bg-white rounded-2xl p-5 shadow-md">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-bold text-slate-800 text-lg">#{delivery.order?.order_code}</div>
                      <div className="text-sm text-slate-500">{delivery.order?.customer_name}</div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(delivery.status)}`}>
                      {getStatusLabel(delivery.status)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-600 mb-3">
                    <MapPin className="w-4 h-4 text-red-500" />
                    <span className="text-sm">{delivery.address}</span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-500" />
                      <span className="font-bold text-emerald-600">
                        +{formatCurrency((delivery.delivery_fee || 0) * commissionPercent / 100)}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {delivery.status === 'assigned' && (
                        <Button 
                          onClick={() => updateStatus(delivery.id, 'picked_up')}
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <Package className="w-4 h-4 mr-1" />
                          Coletei
                        </Button>
                      )}
                      {delivery.status === 'picked_up' && (
                        <Button 
                          onClick={() => updateStatus(delivery.id, 'in_transit')}
                          size="sm"
                          className="bg-orange-600 hover:bg-orange-700"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Saí
                        </Button>
                      )}
                      {delivery.status === 'in_transit' && (
                        <Button 
                          onClick={() => updateStatus(delivery.id, 'delivered')}
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          <CheckCheck className="w-4 h-4 mr-1" />
                          Entreguei
                        </Button>
                      )}
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(delivery.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button size="sm" variant="outline">
                          <Navigation className="w-4 h-4" />
                        </Button>
                      </a>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            {allDeliveries.filter(d => d.status === 'delivered').length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-md">
                <History className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Nenhuma entrega concluída</p>
              </div>
            ) : (
              allDeliveries.filter(d => d.status === 'delivered').slice(0, 20).map(delivery => (
                <div key={delivery.id} className="bg-white rounded-2xl p-4 shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800">#{delivery.order?.order_code}</div>
                      <div className="text-xs text-slate-500">
                        {new Date(delivery.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-600">
                        +{formatCurrency((delivery.delivery_fee || 0) * commissionPercent / 100)}
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                        Entregue
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'earnings' && stats && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 shadow-md">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                Resumo de Ganhos
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl">
                  <div>
                    <div className="font-medium text-slate-700">Hoje</div>
                    <div className="text-sm text-slate-500">{stats.todayDeliveries} entregas</div>
                  </div>
                  <div className="text-2xl font-bold text-indigo-600">
                    {formatCurrency(stats.todayEarnings)}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
                  <div>
                    <div className="font-medium text-slate-700">Esta Semana</div>
                    <div className="text-sm text-slate-500">{stats.weekDeliveries} entregas</div>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(stats.weekEarnings)}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl">
                  <div>
                    <div className="font-medium text-slate-700">Total Acumulado</div>
                    <div className="text-sm text-slate-500">{stats.totalDeliveries} entregas</div>
                  </div>
                  <div className="text-2xl font-bold text-emerald-600">
                    {formatCurrency(stats.totalEarnings)}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-md">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-600" />
                Sua Comissão
              </h3>
              <div className="text-center p-4 bg-orange-50 rounded-xl">
                <div className="text-4xl font-bold text-orange-600">{commissionPercent}%</div>
                <div className="text-sm text-orange-700 mt-1">por entrega</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
