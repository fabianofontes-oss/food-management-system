'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { 
  Users, Bell, BellRing, Clock, DollarSign, CheckCircle,
  Loader2, AlertCircle, LayoutGrid, Coffee, Droplets,
  CreditCard, UtensilsCrossed, Volume2, VolumeX, Zap,
  TrendingUp, Calendar, Timer, RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Table {
  id: string
  number: string
  capacity: number
  status: string
  occupied_at: string | null
  waiter_name: string | null
}

interface WaiterCall {
  id: string
  table_id: string
  call_type: string
  status: string
  created_at: string
  table?: { number: string }
}

interface Commission {
  id: string
  order_amount: number
  commission_amount: number
  status: string
  created_at: string
}

export default function WaiterPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = params.slug as string
  const waiterName = searchParams.get('nome') || ''
  const supabase = useMemo(() => createClient(), [])

  const [loading, setLoading] = useState(true)
  const [storeId, setStoreId] = useState<string | null>(null)
  const [storeName, setStoreName] = useState('')
  const [tables, setTables] = useState<Table[]>([])
  const [calls, setCalls] = useState<WaiterCall[]>([])
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    async function loadStore() {
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
    loadStore()
  }, [slug, supabase])

  useEffect(() => {
    if (storeId) {
      loadTables()
      loadCalls()
      loadCommissions()
    }
  }, [storeId, waiterName])

  // Timer para atualizar tempo
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  // Realtime para chamadas
  useEffect(() => {
    if (!storeId) return

    const channel = supabase
      .channel('waiter-calls-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'waiter_calls', filter: `store_id=eq.${storeId}` },
        (payload: { eventType: string }) => {
          loadCalls()
          if (payload.eventType === 'INSERT') playNotificationSound()
        }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables', filter: `store_id=eq.${storeId}` },
        () => loadTables()
      )
      .subscribe((status: string) => setIsRealtimeConnected(status === 'SUBSCRIBED'))

    return () => { supabase.removeChannel(channel) }
  }, [storeId])

  const playNotificationSound = () => {
    if (!soundEnabled) return
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 800
      gain.gain.value = 0.4
      osc.start()
      setTimeout(() => { osc.stop(); ctx.close() }, 400)
    } catch (e) { console.log('Som erro:', e) }
  }

  async function loadTables() {
    let query = supabase
      .from('tables')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_active', true)
      .order('number')

    if (waiterName) {
      query = query.eq('waiter_name', waiterName)
    }

    const { data } = await query
    setTables(data || [])
  }

  async function loadCalls() {
    const { data } = await supabase
      .from('waiter_calls')
      .select('*, table:tables(number)')
      .eq('store_id', storeId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
    setCalls(data || [])
  }

  async function loadCommissions() {
    const today = new Date()
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()
    
    const { data } = await supabase
      .from('waiter_commissions')
      .select('*')
      .eq('store_id', storeId)
      .gte('created_at', startOfMonth)
      .order('created_at', { ascending: false })
    setCommissions(data || [])
  }

  async function handleAcknowledgeCall(callId: string, tableId: string) {
    await supabase.from('waiter_calls')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', callId)
    
    await supabase.from('tables')
      .update({ waiter_called: false, waiter_called_at: null })
      .eq('id', tableId)
    
    loadCalls()
    loadTables()
  }

  const getOccupiedTime = (occupiedAt: string | null) => {
    if (!occupiedAt) return null
    const diff = currentTime.getTime() - new Date(occupiedAt).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 60) return `${minutes}min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`
  }

  const getCallTypeInfo = (type: string) => {
    const types: Record<string, { icon: any, label: string, color: string }> = {
      'assistance': { icon: Bell, label: 'Garçom', color: 'bg-orange-100 text-orange-700' },
      'order': { icon: UtensilsCrossed, label: 'Pedido', color: 'bg-blue-100 text-blue-700' },
      'water': { icon: Droplets, label: 'Água', color: 'bg-cyan-100 text-cyan-700' },
      'bill': { icon: CreditCard, label: 'Conta', color: 'bg-green-100 text-green-700' }
    }
    return types[type] || types['assistance']
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 border-green-300 text-green-700'
      case 'occupied': return 'bg-red-100 border-red-300 text-red-700'
      case 'reserved': return 'bg-yellow-100 border-yellow-300 text-yellow-700'
      default: return 'bg-gray-100 border-gray-300 text-gray-700'
    }
  }

  // Filtrar chamadas para mesas do garçom (se nome informado)
  const myCalls = waiterName 
    ? calls.filter(c => tables.some(t => t.id === c.table_id))
    : calls

  const todayCommissions = commissions.filter(c => 
    new Date(c.created_at).toDateString() === new Date().toDateString()
  )
  const todayTotal = todayCommissions.reduce((acc, c) => acc + c.commission_amount, 0)
  const monthTotal = commissions.reduce((acc, c) => acc + c.commission_amount, 0)
  const pendingTotal = commissions.filter(c => c.status === 'pending').reduce((acc, c) => acc + c.commission_amount, 0)

  const occupiedTables = tables.filter(t => t.status === 'occupied').length
  const availableTables = tables.filter(t => t.status === 'available').length

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">{storeName}</p>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Users className="w-5 h-5" />
                {waiterName ? `Olá, ${waiterName}` : 'Área do Garçom'}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                isRealtimeConnected ? 'bg-white/20' : 'bg-red-500/50'
              }`}>
                <Zap className="w-3 h-3" />
                {isRealtimeConnected ? 'Ao vivo' : 'Offline'}
              </span>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20"
              >
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
              <button
                onClick={() => { loadTables(); loadCalls(); loadCommissions(); }}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 shadow-lg">
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
              <LayoutGrid className="w-4 h-4" />
              Minhas Mesas
            </div>
            <p className="text-2xl font-bold text-slate-800">{tables.length}</p>
            <p className="text-xs text-slate-500">{occupiedTables} ocupadas • {availableTables} livres</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-lg">
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
              <BellRing className="w-4 h-4 text-red-500" />
              Chamadas
            </div>
            <p className="text-2xl font-bold text-red-600">{myCalls.length}</p>
            <p className="text-xs text-slate-500">pendentes</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-lg">
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
              <DollarSign className="w-4 h-4 text-green-500" />
              Hoje
            </div>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(todayTotal)}</p>
            <p className="text-xs text-slate-500">{todayCommissions.length} vendas</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-lg">
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              Mês
            </div>
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(monthTotal)}</p>
            <p className="text-xs text-amber-600 font-medium">{formatCurrency(pendingTotal)} pendente</p>
          </div>
        </div>

        {/* Chamadas Pendentes */}
        {myCalls.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-4 bg-red-50 border-b border-red-100">
              <h2 className="font-bold text-red-700 flex items-center gap-2">
                <BellRing className="w-5 h-5 animate-pulse" />
                Chamadas Pendentes ({myCalls.length})
              </h2>
            </div>
            <div className="divide-y">
              {myCalls.map(call => {
                const typeInfo = getCallTypeInfo(call.call_type)
                const Icon = typeInfo.icon
                const timeSince = Math.floor((currentTime.getTime() - new Date(call.created_at).getTime()) / 60000)
                return (
                  <div key={call.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${typeInfo.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-lg">Mesa {call.table?.number}</p>
                        <p className="text-sm text-slate-500">{typeInfo.label} • há {timeSince}min</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleAcknowledgeCall(call.id, call.table_id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Atender
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Minhas Mesas */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-purple-600" />
              Minhas Mesas
            </h2>
          </div>
          
          {tables.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <LayoutGrid className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma mesa designada</p>
              {!waiterName && (
                <p className="text-sm mt-2">Adicione ?nome=SeuNome na URL para filtrar</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 p-4">
              {tables.map(table => {
                const hasCall = myCalls.some(c => c.table_id === table.id)
                return (
                  <div
                    key={table.id}
                    className={`relative p-4 rounded-2xl border-2 text-center ${getStatusColor(table.status)}`}
                  >
                    {hasCall && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-bounce">
                        <Bell className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <p className="text-xl font-bold">{table.number}</p>
                    <p className="text-xs mt-1">
                      {table.status === 'available' ? 'Livre' : 
                       table.status === 'occupied' ? 'Ocupada' : 
                       table.status === 'reserved' ? 'Reservada' : table.status}
                    </p>
                    {table.status === 'occupied' && table.occupied_at && (
                      <div className="mt-2 text-xs font-bold flex items-center justify-center gap-1">
                        <Timer className="w-3 h-3" />
                        {getOccupiedTime(table.occupied_at)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Comissões Recentes */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Comissões do Dia
            </h2>
          </div>
          
          {todayCommissions.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma comissão hoje</p>
            </div>
          ) : (
            <div className="divide-y">
              {todayCommissions.slice(0, 10).map(commission => (
                <div key={commission.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">
                      Pedido: {formatCurrency(commission.order_amount)}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(commission.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{formatCurrency(commission.commission_amount)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      commission.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {commission.status === 'paid' ? 'Pago' : 'Pendente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
