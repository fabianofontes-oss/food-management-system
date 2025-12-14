'use client'

import { useMemo, useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  CalendarDays, Plus, Users, Clock, Phone,
  Loader2, AlertCircle, CheckCircle, XCircle,
  Calendar, User, MessageSquare, Edit, Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Reservation {
  id: string
  customer_name: string
  customer_phone: string
  party_size: number
  date: string
  time: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
  notes: string | null
  table_id: string | null
  created_at: string
}

interface ReservationStats {
  today: number
  pending: number
  confirmed: number
  totalThisWeek: number
}

type FilterType = 'all' | 'today' | 'pending' | 'confirmed'

export default function ReservationsPage() {
  const params = useParams()
  const slug = params.slug as string
  const supabase = useMemo(() => createClient(), [])
  
  const [storeId, setStoreId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [stats, setStats] = useState<ReservationStats>({
    today: 0,
    pending: 0,
    confirmed: 0,
    totalThisWeek: 0
  })
  const [filter, setFilter] = useState<FilterType>('all')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [showForm, setShowForm] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    party_size: '2',
    date: new Date().toISOString().split('T')[0],
    time: '19:00',
    notes: ''
  })

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
    if (storeId) loadReservations()
  }, [storeId])

  async function loadReservations() {
    try {
      setLoading(true)
      
      const today = new Date().toISOString().split('T')[0]
      
      // Mock data - em produção criar tabela reservations
      const mockReservations: Reservation[] = [
        {
          id: '1',
          customer_name: 'João Silva',
          customer_phone: '11999887766',
          party_size: 4,
          date: today,
          time: '19:00',
          status: 'confirmed',
          notes: 'Aniversário',
          table_id: null,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          customer_name: 'Maria Santos',
          customer_phone: '11988776655',
          party_size: 2,
          date: today,
          time: '20:00',
          status: 'pending',
          notes: null,
          table_id: null,
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          customer_name: 'Pedro Oliveira',
          customer_phone: '11977665544',
          party_size: 6,
          date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          time: '19:30',
          status: 'confirmed',
          notes: 'Mesa na área externa',
          table_id: null,
          created_at: new Date().toISOString()
        }
      ]

      setReservations(mockReservations)
      
      const todayReservations = mockReservations.filter(r => r.date === today)
      setStats({
        today: todayReservations.length,
        pending: mockReservations.filter(r => r.status === 'pending').length,
        confirmed: mockReservations.filter(r => r.status === 'confirmed').length,
        totalThisWeek: mockReservations.length
      })
    } catch (err) {
      console.error('Erro ao carregar reservas:', err)
    } finally {
      setLoading(false)
    }
  }

  function handleSaveReservation() {
    if (!formData.customer_name || !formData.customer_phone) return
    
    const newReservation: Reservation = {
      id: Date.now().toString(),
      customer_name: formData.customer_name,
      customer_phone: formData.customer_phone,
      party_size: parseInt(formData.party_size),
      date: formData.date,
      time: formData.time,
      status: 'pending',
      notes: formData.notes || null,
      table_id: null,
      created_at: new Date().toISOString()
    }
    
    if (selectedReservation) {
      setReservations(prev => prev.map(r => 
        r.id === selectedReservation.id ? { ...newReservation, id: r.id, status: r.status } : r
      ))
    } else {
      setReservations(prev => [newReservation, ...prev])
    }
    
    setShowForm(false)
    setSelectedReservation(null)
    setFormData({ customer_name: '', customer_phone: '', party_size: '2', date: new Date().toISOString().split('T')[0], time: '19:00', notes: '' })
  }

  function handleUpdateStatus(reservation: Reservation, newStatus: Reservation['status']) {
    setReservations(prev => prev.map(r => 
      r.id === reservation.id ? { ...r, status: newStatus } : r
    ))
  }

  function handleDelete(id: string) {
    if (!confirm('Deseja cancelar esta reserva?')) return
    setReservations(prev => prev.filter(r => r.id !== id))
  }

  const getStatusBadge = (status: Reservation['status']) => {
    const styles: Record<Reservation['status'], string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      confirmed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
      completed: 'bg-blue-100 text-blue-700',
      no_show: 'bg-gray-100 text-gray-700'
    }
    const labels: Record<Reservation['status'], string> = {
      pending: 'Pendente',
      confirmed: 'Confirmada',
      cancelled: 'Cancelada',
      completed: 'Concluída',
      no_show: 'Não Compareceu'
    }
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  const filteredReservations = reservations.filter(r => {
    const today = new Date().toISOString().split('T')[0]
    if (filter === 'today') return r.date === today
    if (filter === 'pending') return r.status === 'pending'
    if (filter === 'confirmed') return r.status === 'confirmed'
    return true
  }).sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date)
    return a.time.localeCompare(b.time)
  })

  if (loading && !storeId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl shadow-slate-200/50">
          <Loader2 className="w-14 h-14 text-teal-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 text-lg font-medium">Carregando reservas...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl shadow-lg shadow-teal-500/25">
              <CalendarDays className="w-6 h-6 md:w-7 md:h-7 text-white" />
            </div>
            Reservas
          </h1>
          <p className="text-slate-500 mt-2 ml-14">Agendamento de mesas</p>
        </div>
        <Button 
          onClick={() => { setSelectedReservation(null); setShowForm(true); }}
          className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 shadow-lg shadow-teal-500/25"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Reserva
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl p-5 shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-slate-500">Hoje</p>
            <div className="p-2 bg-slate-100 rounded-xl">
              <Calendar className="w-5 h-5 text-slate-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-800">{stats.today}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-slate-500">Pendentes</p>
            <div className="p-2 bg-amber-100 rounded-xl">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-amber-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-slate-500">Confirmadas</p>
            <div className="p-2 bg-emerald-100 rounded-xl">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-emerald-600">{stats.confirmed}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-slate-500">Esta Semana</p>
            <div className="p-2 bg-teal-100 rounded-xl">
              <CalendarDays className="w-5 h-5 text-teal-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-teal-600">{stats.totalThisWeek}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'today', 'pending', 'confirmed'] as FilterType[]).map(f => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
            className={filter === f ? 'bg-gradient-to-r from-teal-500 to-cyan-600 shadow-lg shadow-teal-500/25' : 'hover:shadow-md transition-all'}
          >
            {f === 'all' ? 'Todas' : f === 'today' ? 'Hoje' : f === 'pending' ? 'Pendentes' : 'Confirmadas'}
          </Button>
        ))}
      </div>

      {/* Lista de Reservas */}
      <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
          </div>
        ) : filteredReservations.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
              <CalendarDays className="w-10 h-10 text-slate-300" />
            </div>
            <p className="text-slate-400 font-medium mb-4">Nenhuma reserva encontrada</p>
            <Button 
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-teal-500 to-cyan-600 shadow-lg shadow-teal-500/25"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Reserva
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredReservations.map(reservation => (
              <div key={reservation.id} className="p-5 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{reservation.customer_name}</p>
                        {getStatusBadge(reservation.status)}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(reservation.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {reservation.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {reservation.party_size} pessoas
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {reservation.customer_phone}
                        </span>
                      </div>
                      {reservation.notes && (
                        <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          {reservation.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {reservation.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600"
                          onClick={() => handleUpdateStatus(reservation, 'confirmed')}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600"
                          onClick={() => handleUpdateStatus(reservation, 'cancelled')}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedReservation(reservation)
                        setFormData({
                          customer_name: reservation.customer_name,
                          customer_phone: reservation.customer_phone,
                          party_size: reservation.party_size.toString(),
                          date: reservation.date,
                          time: reservation.time,
                          notes: reservation.notes || ''
                        })
                        setShowForm(true)
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600"
                      onClick={() => handleDelete(reservation.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-semibold mb-4">
              {selectedReservation ? 'Editar Reserva' : 'Nova Reserva'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Cliente</label>
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={e => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Nome completo"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input
                  type="tel"
                  value={formData.customer_phone}
                  onChange={e => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="11999887766"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pessoas</label>
                  <select
                    value={formData.party_size}
                    onChange={e => setFormData(prev => ({ ...prev, party_size: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Horário</label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={e => setFormData(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg resize-none"
                  rows={2}
                  placeholder="Ex: Aniversário, cadeira para bebê..."
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => { setShowForm(false); setSelectedReservation(null); }}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleSaveReservation}>
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
