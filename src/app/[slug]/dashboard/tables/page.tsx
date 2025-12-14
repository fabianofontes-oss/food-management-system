'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { 
  LayoutGrid, Plus, Users, Clock, Receipt,
  Loader2, AlertCircle, Edit, Trash2, QrCode,
  CheckCircle, XCircle, ArrowRight, Utensils,
  Bell, BellRing, Calendar, History, Link2, Copy,
  Phone, Mail, Timer, Merge, Volume2, VolumeX, Zap,
  X, Download, ExternalLink, Coffee, FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Table {
  id: string
  number: string
  capacity: number
  qr_code: string | null
  status: 'available' | 'occupied' | 'reserved' | 'cleaning'
  current_order_id: string | null
  is_active: boolean
  occupied_at: string | null
  merged_with: string[] | null
  waiter_called: boolean
  waiter_called_at: string | null
}

interface Reservation {
  id: string
  table_id: string
  customer_name: string
  customer_phone: string | null
  party_size: number
  reservation_date: string
  reservation_time: string
  status: string
  notes: string | null
}

interface WaiterCall {
  id: string
  table_id: string
  call_type: string
  status: string
  created_at: string
}

interface TableSession {
  id: string
  table_id: string
  order_id: string | null
  started_at: string
  ended_at: string | null
  total_amount: number
}

interface TableOrder {
  id: string
  code: string
  total_amount: number
  status: string
  customer_name: string | null
  created_at: string
}

export default function TablesPage() {
  const params = useParams()
  const slug = params.slug as string
  const supabase = useMemo(() => createClient(), [])
  
  const [storeId, setStoreId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const [tables, setTables] = useState<Table[]>([])
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [tableOrder, setTableOrder] = useState<TableOrder | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  
  // Premium features states
  const [waiterCalls, setWaiterCalls] = useState<WaiterCall[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [tableHistory, setTableHistory] = useState<TableSession[]>([])
  const [showReservations, setShowReservations] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showQRCode, setShowQRCode] = useState(false)
  const [showMerge, setShowMerge] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [reservationForm, setReservationForm] = useState({
    customer_name: '',
    customer_phone: '',
    party_size: '2',
    reservation_date: '',
    reservation_time: '',
    notes: ''
  })
  
  const [formData, setFormData] = useState({
    number: '',
    capacity: '4',
    location: '',
    waiter_name: '',
    min_consumption: '',
    is_smoking: false,
    is_accessible: false,
    shape: 'square'
  })
  const [storeWaiters, setStoreWaiters] = useState<{id: string, name: string}[]>([])

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

  useEffect(() => {
    if (storeId) {
      loadTables()
      loadWaiterCalls()
      loadReservations()
    }
  }, [storeId])

  // Timer para atualizar tempo de ocupação
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  // Realtime para mesas e chamadas
  useEffect(() => {
    if (!storeId) return

    const channel = supabase
      .channel('tables-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables', filter: `store_id=eq.${storeId}` },
        () => loadTables()
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'waiter_calls', filter: `store_id=eq.${storeId}` },
        (payload: { eventType: string }) => {
          loadWaiterCalls()
          if (payload.eventType === 'INSERT') playNotificationSound()
        }
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
      osc.frequency.value = 880
      gain.gain.value = 0.3
      osc.start()
      setTimeout(() => { osc.stop(); ctx.close() }, 300)
    } catch (e) { console.log('Som erro:', e) }
  }

  async function loadWaiterCalls() {
    const { data } = await supabase
      .from('waiter_calls')
      .select('*')
      .eq('store_id', storeId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    setWaiterCalls(data || [])
  }

  async function loadReservations() {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('table_reservations')
      .select('*')
      .eq('store_id', storeId)
      .gte('reservation_date', today)
      .in('status', ['pending', 'confirmed'])
      .order('reservation_date')
      .order('reservation_time')
    setReservations(data || [])
  }

  async function loadTableHistory(tableId: string) {
    const { data } = await supabase
      .from('table_sessions')
      .select('*')
      .eq('table_id', tableId)
      .order('started_at', { ascending: false })
      .limit(20)
    setTableHistory(data || [])
  }

  async function loadTables() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('number')

      if (error) throw error
      setTables(data || [])
    } catch (err) {
      console.error('Erro ao carregar mesas:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveTable() {
    if (!storeId || !formData.number) return
    
    const tableData = {
      number: formData.number,
      capacity: parseInt(formData.capacity) || 4,
      location: formData.location || null,
      waiter_name: formData.waiter_name || null,
      min_consumption: parseFloat(formData.min_consumption) || 0,
      is_smoking: formData.is_smoking,
      is_accessible: formData.is_accessible,
      shape: formData.shape
    }
    
    try {
      if (selectedTable) {
        await supabase
          .from('tables')
          .update(tableData)
          .eq('id', selectedTable.id)
      } else {
        await supabase
          .from('tables')
          .insert({
            store_id: storeId,
            ...tableData,
            status: 'available'
          })
      }
      
      setShowForm(false)
      setSelectedTable(null)
      setFormData({ number: '', capacity: '4', location: '', waiter_name: '', min_consumption: '', is_smoking: false, is_accessible: false, shape: 'square' })
      loadTables()
    } catch (err) {
      console.error('Erro ao salvar mesa:', err)
    }
  }

  async function handleChangeStatus(table: Table, newStatus: Table['status']) {
    try {
      const updateData: any = { status: newStatus }
      
      if (newStatus === 'occupied' && table.status !== 'occupied') {
        updateData.occupied_at = new Date().toISOString()
        // Criar sessão da mesa
        await supabase.from('table_sessions').insert({
          store_id: storeId,
          table_id: table.id,
          started_at: new Date().toISOString()
        })
      } else if (newStatus === 'available' && table.status === 'occupied') {
        updateData.occupied_at = null
        updateData.waiter_called = false
        // Fechar sessão da mesa
        await supabase.from('table_sessions')
          .update({ ended_at: new Date().toISOString() })
          .eq('table_id', table.id)
          .is('ended_at', null)
      }
      
      await supabase.from('tables').update(updateData).eq('id', table.id)
      loadTables()
    } catch (err) {
      console.error('Erro ao alterar status:', err)
    }
  }

  // Atender chamada de garçom
  async function handleAcknowledgeCall(callId: string) {
    await supabase.from('waiter_calls')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', callId)
    
    // Limpar flag na mesa
    const call = waiterCalls.find(c => c.id === callId)
    if (call) {
      await supabase.from('tables')
        .update({ waiter_called: false, waiter_called_at: null })
        .eq('id', call.table_id)
    }
    
    loadWaiterCalls()
    loadTables()
  }

  // Criar reserva
  async function handleCreateReservation() {
    if (!selectedTable || !reservationForm.customer_name || !reservationForm.reservation_date) return
    
    await supabase.from('table_reservations').insert({
      store_id: storeId,
      table_id: selectedTable.id,
      customer_name: reservationForm.customer_name,
      customer_phone: reservationForm.customer_phone || null,
      party_size: parseInt(reservationForm.party_size) || 2,
      reservation_date: reservationForm.reservation_date,
      reservation_time: reservationForm.reservation_time || '19:00',
      notes: reservationForm.notes || null,
      status: 'confirmed'
    })
    
    setReservationForm({ customer_name: '', customer_phone: '', party_size: '2', reservation_date: '', reservation_time: '', notes: '' })
    setShowReservations(false)
    loadReservations()
  }

  // Cancelar reserva
  async function handleCancelReservation(reservationId: string) {
    await supabase.from('table_reservations')
      .update({ status: 'cancelled' })
      .eq('id', reservationId)
    loadReservations()
  }

  // Gerar QR Code URL
  const getQRCodeUrl = (table: Table) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `${baseUrl}/${slug}?mesa=${table.number}`
  }

  // Copiar link da mesa
  const copyTableLink = async (table: Table) => {
    const link = getQRCodeUrl(table)
    await navigator.clipboard.writeText(link)
    alert('Link copiado!')
  }

  // Calcular tempo de ocupação
  const getOccupiedTime = (occupiedAt: string | null) => {
    if (!occupiedAt) return null
    const diff = currentTime.getTime() - new Date(occupiedAt).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 60) return `${minutes}min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`
  }

  // Verificar se mesa tem chamada pendente
  const hasWaiterCall = (tableId: string) => waiterCalls.some(c => c.table_id === tableId)
  
  // Obter reservas do dia para uma mesa
  const getTableReservations = (tableId: string) => reservations.filter(r => r.table_id === tableId)

  // Imprimir comanda
  const printComanda = (table: Table) => {
    const printWindow = window.open('', '', 'width=400,height=600')
    if (!printWindow) return

    const occupiedTime = table.occupied_at ? getOccupiedTime(table.occupied_at) : '-'
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Comanda Mesa ${table.number}</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 20px; max-width: 300px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .info { margin: 10px 0; }
            .footer { text-align: center; border-top: 2px dashed #000; padding-top: 10px; margin-top: 20px; font-size: 12px; }
            h1 { font-size: 24px; margin: 0; }
            h2 { font-size: 18px; margin: 5px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>MESA ${table.number}</h1>
            <h2>Capacidade: ${table.capacity} pessoas</h2>
          </div>
          <div class="info">
            <p><strong>Status:</strong> ${table.status === 'occupied' ? 'Ocupada' : table.status}</p>
            <p><strong>Tempo:</strong> ${occupiedTime}</p>
            <p><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
          </div>
          ${tableOrder ? `
            <div class="info">
              <p><strong>Pedido:</strong> ${tableOrder.code}</p>
              <p><strong>Total:</strong> R$ ${tableOrder.total_amount.toFixed(2)}</p>
            </div>
          ` : ''}
          <div class="footer">
            <p>Obrigado pela preferência!</p>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  // Juntar mesas
  const handleMergeTables = async (targetTableId: string) => {
    if (!selectedTable) return
    
    try {
      const currentMerged = selectedTable.merged_with || []
      const newMerged = [...currentMerged, targetTableId]
      
      await supabase.from('tables').update({ 
        merged_with: newMerged 
      }).eq('id', selectedTable.id)
      
      // Marcar mesa alvo como ocupada
      await supabase.from('tables').update({ 
        status: 'occupied',
        occupied_at: new Date().toISOString()
      }).eq('id', targetTableId)
      
      setShowMerge(false)
      loadTables()
      alert('Mesas unidas com sucesso!')
    } catch (err) {
      console.error('Erro:', err)
    }
  }

  // Transferir pedido para outra mesa
  const handleTransferTable = async (targetTableId: string) => {
    if (!selectedTable || !selectedTable.current_order_id) return
    
    try {
      // Transferir pedido
      await supabase.from('tables').update({ 
        current_order_id: selectedTable.current_order_id,
        status: 'occupied',
        occupied_at: new Date().toISOString()
      }).eq('id', targetTableId)
      
      // Liberar mesa original
      await supabase.from('tables').update({ 
        current_order_id: null,
        status: 'available',
        occupied_at: null
      }).eq('id', selectedTable.id)
      
      setShowDetails(false)
      loadTables()
      alert('Pedido transferido com sucesso!')
    } catch (err) {
      console.error('Erro:', err)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja realmente excluir esta mesa?')) return
    
    try {
      await supabase
        .from('tables')
        .update({ is_active: false })
        .eq('id', id)
      loadTables()
    } catch (err) {
      console.error('Erro ao excluir mesa:', err)
    }
  }

  async function handleViewDetails(table: Table) {
    setSelectedTable(table)
    setShowDetails(true)
    
    if (table.current_order_id) {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('id', table.current_order_id)
        .single()
      
      if (data) setTableOrder(data)
    } else {
      setTableOrder(null)
    }
  }

  const getStatusColor = (status: Table['status']) => {
    switch (status) {
      case 'available': return 'bg-green-100 border-green-300 text-green-700'
      case 'occupied': return 'bg-red-100 border-red-300 text-red-700'
      case 'reserved': return 'bg-yellow-100 border-yellow-300 text-yellow-700'
      case 'cleaning': return 'bg-blue-100 border-blue-300 text-blue-700'
      default: return 'bg-gray-100 border-gray-300 text-gray-700'
    }
  }

  const getStatusLabel = (status: Table['status']) => {
    switch (status) {
      case 'available': return 'Disponível'
      case 'occupied': return 'Ocupada'
      case 'reserved': return 'Reservada'
      case 'cleaning': return 'Limpeza'
      default: return status
    }
  }

  const stats = {
    total: tables.length,
    available: tables.filter(t => t.status === 'available').length,
    occupied: tables.filter(t => t.status === 'occupied').length,
    reserved: tables.filter(t => t.status === 'reserved').length
  }

  if (loading && !storeId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl shadow-slate-200/50">
          <Loader2 className="w-14 h-14 text-orange-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 text-lg font-medium">Carregando mesas...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-lg shadow-orange-500/25">
              <LayoutGrid className="w-6 h-6 md:w-7 md:h-7 text-white" />
            </div>
            Mesas
            {/* Indicador Realtime */}
            <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
              isRealtimeConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              <Zap className="w-3 h-3" />
              {isRealtimeConnected ? 'Ao vivo' : 'Offline'}
            </span>
          </h1>
          <p className="text-slate-500 mt-2 ml-14">Gestão premium de mesas e comandas</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Chamadas de garçom pendentes */}
          {waiterCalls.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-xl animate-pulse">
              <BellRing className="w-5 h-5" />
              <span className="font-bold">{waiterCalls.length} chamada{waiterCalls.length > 1 ? 's' : ''}</span>
            </div>
          )}
          {/* Toggle Som */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={soundEnabled ? '' : 'opacity-50'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
          {/* Reservas */}
          <Button
            variant="outline"
            onClick={() => setShowReservations(true)}
            className="flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Reservas
            {reservations.length > 0 && (
              <span className="px-1.5 py-0.5 bg-amber-500 text-white text-xs rounded-full">{reservations.length}</span>
            )}
          </Button>
          <Button 
            onClick={() => { setSelectedTable(null); setShowForm(true); }}
            className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-lg shadow-orange-500/25"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Mesa
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl p-5 shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-slate-500">Total</p>
            <div className="p-2 bg-slate-100 rounded-xl">
              <LayoutGrid className="w-5 h-5 text-slate-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-800">{stats.total}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-slate-500">Disponíveis</p>
            <div className="p-2 bg-emerald-100 rounded-xl">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-emerald-600">{stats.available}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-slate-500">Ocupadas</p>
            <div className="p-2 bg-red-100 rounded-xl">
              <Users className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-red-600">{stats.occupied}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-slate-500">Reservadas</p>
            <div className="p-2 bg-amber-100 rounded-xl">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-amber-600">{stats.reserved}</p>
        </div>
      </div>

      {/* Grid de Mesas */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-10 h-10 animate-spin text-orange-600" />
        </div>
      ) : tables.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-16 text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
            <LayoutGrid className="w-10 h-10 text-slate-300" />
          </div>
          <p className="text-slate-400 font-medium mb-4">Nenhuma mesa cadastrada</p>
          <Button 
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-orange-500 to-amber-600 shadow-lg shadow-orange-500/25"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Mesa
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
          {tables.map(table => (
            <div
              key={table.id}
              onClick={() => handleViewDetails(table)}
              className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl ${getStatusColor(table.status)} shadow-lg`}
            >
              {/* Indicador de chamada de garçom */}
              {hasWaiterCall(table.id) && (
                <div className="absolute -top-2 -left-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                  <BellRing className="w-4 h-4 text-white" />
                </div>
              )}
              
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-white/50 rounded-xl flex items-center justify-center">
                  <Utensils className="w-6 h-6 opacity-70" />
                </div>
                <p className="text-2xl font-bold">{table.number}</p>
                <p className="text-xs mt-1 font-medium">{getStatusLabel(table.status)}</p>
                
                {/* Timer de ocupação */}
                {table.status === 'occupied' && table.occupied_at && (
                  <div className="flex items-center justify-center gap-1 mt-2 text-xs font-bold text-red-600 bg-red-50 rounded-full px-2 py-0.5">
                    <Timer className="w-3 h-3" />
                    {getOccupiedTime(table.occupied_at)}
                  </div>
                )}
                
                <div className="flex items-center justify-center gap-1 mt-2 text-xs opacity-80">
                  <Users className="w-3.5 h-3.5" />
                  <span className="font-medium">{table.capacity}</span>
                </div>
                
                {/* Reservas do dia */}
                {getTableReservations(table.id).length > 0 && (
                  <div className="mt-2 text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">
                    {getTableReservations(table.id).length} reserva{getTableReservations(table.id).length > 1 ? 's' : ''}
                  </div>
                )}
              </div>
              
              {table.status === 'occupied' && (
                <div className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/50">
                  <Clock className="w-3.5 h-3.5 text-white" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-semibold mb-4">
              {selectedTable ? 'Editar Mesa' : 'Nova Mesa'}
            </h3>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número/Nome
                  </label>
                  <input
                    type="text"
                    value={formData.number}
                    onChange={e => setFormData(prev => ({ ...prev, number: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Ex: 01, A1..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacidade
                  </label>
                  <select
                    value={formData.capacity}
                    onChange={e => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {[2, 4, 6, 8, 10, 12, 15, 20].map(n => (
                      <option key={n} value={n}>{n} pessoas</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Localização/Setor
                  </label>
                  <select
                    value={formData.location}
                    onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Selecione...</option>
                    <option value="interno">Área Interna</option>
                    <option value="externo">Área Externa</option>
                    <option value="varanda">Varanda</option>
                    <option value="terraco">Terraço</option>
                    <option value="jardim">Jardim</option>
                    <option value="vip">Área VIP</option>
                    <option value="reservado">Reservado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Formato
                  </label>
                  <select
                    value={formData.shape}
                    onChange={e => setFormData(prev => ({ ...prev, shape: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="square">Quadrada</option>
                    <option value="round">Redonda</option>
                    <option value="rectangle">Retangular</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Garçom Responsável
                </label>
                <input
                  type="text"
                  value={formData.waiter_name}
                  onChange={e => setFormData(prev => ({ ...prev, waiter_name: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Nome do garçom responsável"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Consumo Mínimo (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.min_consumption}
                  onChange={e => setFormData(prev => ({ ...prev, min_consumption: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="0.00"
                />
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_accessible}
                    onChange={e => setFormData(prev => ({ ...prev, is_accessible: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">♿ Acessível PCD</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_smoking}
                    onChange={e => setFormData(prev => ({ ...prev, is_smoking: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">🚬 Área Fumante</span>
                </label>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => { setShowForm(false); setSelectedTable(null); }}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleSaveTable}>
                Salvar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalhes */}
      {showDetails && selectedTable && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Mesa {selectedTable.number}</h3>
              <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(selectedTable.status)}`}>
                {getStatusLabel(selectedTable.status)}
              </span>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {selectedTable.capacity} pessoas
                </div>
              </div>

              {tableOrder && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700">Pedido Atual</p>
                  <p className="text-lg font-bold">{tableOrder.code}</p>
                  <p className="text-sm text-gray-500">
                    {tableOrder.customer_name || 'Cliente não identificado'}
                  </p>
                  <p className="text-xl font-bold text-purple-600 mt-2">
                    {formatCurrency(tableOrder.total_amount)}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleChangeStatus(selectedTable, 'available')}
                  disabled={selectedTable.status === 'available'}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Disponível
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleChangeStatus(selectedTable, 'occupied')}
                  disabled={selectedTable.status === 'occupied'}
                >
                  <Users className="w-4 h-4 mr-1" />
                  Ocupar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleChangeStatus(selectedTable, 'reserved')}
                  disabled={selectedTable.status === 'reserved'}
                >
                  <Clock className="w-4 h-4 mr-1" />
                  Reservar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleChangeStatus(selectedTable, 'cleaning')}
                  disabled={selectedTable.status === 'cleaning'}
                >
                  <LayoutGrid className="w-4 h-4 mr-1" />
                  Limpeza
                </Button>
              </div>

              {/* Ações Premium */}
              {selectedTable.status === 'occupied' && (
                <div className="grid grid-cols-2 gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMerge(true)}
                  >
                    <Merge className="w-4 h-4 mr-1" />
                    Juntar Mesas
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => printComanda(selectedTable)}
                  >
                    <FileText className="w-4 h-4 mr-1" />
                    Imprimir
                  </Button>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFormData({
                      number: selectedTable.number,
                      capacity: selectedTable.capacity.toString(),
                      location: (selectedTable as any).location || '',
                      waiter_name: (selectedTable as any).waiter_name || '',
                      min_consumption: (selectedTable as any).min_consumption?.toString() || '',
                      is_smoking: (selectedTable as any).is_smoking || false,
                      is_accessible: (selectedTable as any).is_accessible || false,
                      shape: (selectedTable as any).shape || 'square'
                    })
                    setShowDetails(false)
                    setShowForm(true)
                  }}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600"
                  onClick={() => { handleDelete(selectedTable.id); setShowDetails(false); }}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Excluir
                </Button>
              </div>
            </div>
            
            {/* Botões Premium */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setShowQRCode(true); }}
                className="flex-1"
              >
                <QrCode className="w-4 h-4 mr-1" />
                QR Code
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { loadTableHistory(selectedTable.id); setShowHistory(true); }}
                className="flex-1"
              >
                <History className="w-4 h-4 mr-1" />
                Histórico
              </Button>
            </div>

            <Button 
              variant="outline" 
              className="w-full mt-4" 
              onClick={() => { setShowDetails(false); setSelectedTable(null); }}
            >
              Fechar
            </Button>
          </div>
        </div>
      )}

      {/* Modal QR Code */}
      {showQRCode && selectedTable && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
            <h3 className="text-lg font-semibold mb-4">QR Code - Mesa {selectedTable.number}</h3>
            
            <div className="bg-white p-4 rounded-xl border-2 border-dashed border-slate-200 mb-4">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(getQRCodeUrl(selectedTable))}`}
                alt="QR Code"
                className="mx-auto"
              />
            </div>
            
            <p className="text-sm text-slate-500 mb-4">
              Cliente escaneia e faz pedido direto no celular
            </p>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => copyTableLink(selectedTable)}
              >
                <Copy className="w-4 h-4 mr-1" />
                Copiar Link
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => window.open(getQRCodeUrl(selectedTable), '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                Abrir
              </Button>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full mt-4" 
              onClick={() => setShowQRCode(false)}
            >
              Fechar
            </Button>
          </div>
        </div>
      )}

      {/* Modal Histórico */}
      {showHistory && selectedTable && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-slate-600" />
              Histórico - Mesa {selectedTable.number}
            </h3>
            
            <div className="flex-1 overflow-y-auto space-y-3">
              {tableHistory.length === 0 ? (
                <p className="text-center text-slate-400 py-8">Nenhum histórico</p>
              ) : (
                tableHistory.map(session => (
                  <div key={session.id} className="p-3 bg-slate-50 rounded-xl">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium">
                          {new Date(session.started_at).toLocaleDateString('pt-BR')}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(session.started_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          {session.ended_at && ` - ${new Date(session.ended_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                        </p>
                      </div>
                      {session.total_amount > 0 && (
                        <span className="font-bold text-emerald-600">
                          {formatCurrency(session.total_amount)}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <Button 
              variant="outline" 
              className="w-full mt-4" 
              onClick={() => setShowHistory(false)}
            >
              Fechar
            </Button>
          </div>
        </div>
      )}

      {/* Modal Reservas */}
      {showReservations && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-600" />
                Reservas
              </h3>
              <button onClick={() => setShowReservations(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Formulário de nova reserva */}
            <div className="p-4 bg-amber-50 rounded-xl mb-4">
              <h4 className="font-medium text-amber-800 mb-3">Nova Reserva</h4>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Nome do cliente"
                  value={reservationForm.customer_name}
                  onChange={e => setReservationForm(prev => ({ ...prev, customer_name: e.target.value }))}
                  className="col-span-2 px-3 py-2 border rounded-lg text-sm"
                />
                <input
                  type="tel"
                  placeholder="Telefone"
                  value={reservationForm.customer_phone}
                  onChange={e => setReservationForm(prev => ({ ...prev, customer_phone: e.target.value }))}
                  className="px-3 py-2 border rounded-lg text-sm"
                />
                <select
                  value={reservationForm.party_size}
                  onChange={e => setReservationForm(prev => ({ ...prev, party_size: e.target.value }))}
                  className="px-3 py-2 border rounded-lg text-sm"
                >
                  {[1,2,3,4,5,6,8,10,12].map(n => (
                    <option key={n} value={n}>{n} pessoa{n > 1 ? 's' : ''}</option>
                  ))}
                </select>
                <input
                  type="date"
                  value={reservationForm.reservation_date}
                  onChange={e => setReservationForm(prev => ({ ...prev, reservation_date: e.target.value }))}
                  className="px-3 py-2 border rounded-lg text-sm"
                />
                <input
                  type="time"
                  value={reservationForm.reservation_time}
                  onChange={e => setReservationForm(prev => ({ ...prev, reservation_time: e.target.value }))}
                  className="px-3 py-2 border rounded-lg text-sm"
                />
                <select
                  value={selectedTable?.id || ''}
                  onChange={e => setSelectedTable(tables.find(t => t.id === e.target.value) || null)}
                  className="col-span-2 px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="">Selecione a mesa</option>
                  {tables.map(t => (
                    <option key={t.id} value={t.id}>Mesa {t.number} ({t.capacity} pessoas)</option>
                  ))}
                </select>
              </div>
              <Button
                onClick={handleCreateReservation}
                disabled={!selectedTable || !reservationForm.customer_name || !reservationForm.reservation_date}
                className="w-full mt-3 bg-amber-600 hover:bg-amber-700"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                Criar Reserva
              </Button>
            </div>
            
            {/* Lista de reservas */}
            <div className="flex-1 overflow-y-auto space-y-3">
              {reservations.length === 0 ? (
                <p className="text-center text-slate-400 py-8">Nenhuma reserva agendada</p>
              ) : (
                reservations.map(reservation => (
                  <div key={reservation.id} className="p-4 bg-slate-50 rounded-xl flex items-start justify-between">
                    <div>
                      <p className="font-medium">{reservation.customer_name}</p>
                      <p className="text-sm text-slate-500">
                        Mesa {tables.find(t => t.id === reservation.table_id)?.number} • {reservation.party_size} pessoas
                      </p>
                      <p className="text-sm text-amber-600 font-medium">
                        {new Date(reservation.reservation_date).toLocaleDateString('pt-BR')} às {reservation.reservation_time}
                      </p>
                      {reservation.customer_phone && (
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                          <Phone className="w-3 h-3" /> {reservation.customer_phone}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600"
                      onClick={() => handleCancelReservation(reservation.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Painel de Chamadas de Garçom */}
      {waiterCalls.length > 0 && (
        <div className="fixed bottom-4 right-4 z-40">
          <div className="bg-white rounded-2xl shadow-2xl border border-red-200 p-4 max-w-sm">
            <h4 className="font-bold text-red-700 flex items-center gap-2 mb-3">
              <BellRing className="w-5 h-5" />
              Chamadas Pendentes
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {waiterCalls.map(call => {
                const table = tables.find(t => t.id === call.table_id)
                const callTypeLabels: Record<string, string> = {
                  'assistance': '🔔 Garçom',
                  'order': '🍽️ Pedido',
                  'water': '💧 Água',
                  'bill': '💳 Conta'
                }
                return (
                  <div key={call.id} className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                    <div>
                      <p className="font-bold">Mesa {table?.number}</p>
                      <p className="text-xs text-slate-500">
                        {callTypeLabels[call.call_type] || call.call_type} • {new Date(call.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAcknowledgeCall(call.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Atender
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal Juntar Mesas */}
      {showMerge && selectedTable && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Merge className="w-5 h-5 text-purple-600" />
                Juntar com Mesa {selectedTable.number}
              </h3>
              <button onClick={() => setShowMerge(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm text-slate-500 mb-4">Selecione a mesa para unir:</p>
            
            <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto">
              {tables
                .filter(t => t.id !== selectedTable.id && t.status === 'available')
                .map(t => (
                  <button
                    key={t.id}
                    onClick={() => handleMergeTables(t.id)}
                    className="p-3 bg-green-50 hover:bg-green-100 rounded-xl text-center border-2 border-green-200 hover:border-green-400 transition-colors"
                  >
                    <p className="font-bold text-green-700">{t.number}</p>
                    <p className="text-xs text-green-600">{t.capacity}p</p>
                  </button>
                ))}
            </div>
            
            {tables.filter(t => t.id !== selectedTable.id && t.status === 'available').length === 0 && (
              <p className="text-center text-slate-400 py-4">Nenhuma mesa disponível para unir</p>
            )}

            {/* Transferir pedido */}
            {selectedTable.current_order_id && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-medium text-slate-700 mb-2">Ou transferir pedido para:</h4>
                <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                  {tables
                    .filter(t => t.id !== selectedTable.id && t.status === 'available')
                    .map(t => (
                      <button
                        key={t.id}
                        onClick={() => handleTransferTable(t.id)}
                        className="p-3 bg-blue-50 hover:bg-blue-100 rounded-xl text-center border-2 border-blue-200 hover:border-blue-400 transition-colors"
                      >
                        <p className="font-bold text-blue-700">{t.number}</p>
                        <p className="text-xs text-blue-600">{t.capacity}p</p>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
