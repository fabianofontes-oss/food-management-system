'use client'

import { useMemo, useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { 
  Users, Plus, Search, Loader2, AlertCircle, Edit, Trash2,
  Calendar, Clock, DollarSign, Phone, Mail, UserCheck,
  LayoutGrid, X, CheckCircle, TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Waiter {
  id: string
  name: string
  phone: string | null
  email: string | null
  commission_percent: number
  is_active: boolean
}

interface Schedule {
  id: string
  waiter_id: string
  schedule_date: string
  shift: string
  start_time: string | null
  end_time: string | null
  tables_assigned: string[]
}

interface Commission {
  id: string
  waiter_id: string
  order_amount: number
  commission_amount: number
  status: string
  created_at: string
}

type TabType = 'waiters' | 'schedules' | 'commissions'

export default function WaitersPage() {
  const params = useParams()
  const slug = params.slug as string
  const supabase = useMemo(() => createClient(), [])
  
  const [storeId, setStoreId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const [waiters, setWaiters] = useState<Waiter[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [activeTab, setActiveTab] = useState<TabType>('waiters')
  const [showForm, setShowForm] = useState(false)
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [selectedWaiter, setSelectedWaiter] = useState<Waiter | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    commission_percent: '10'
  })

  const [scheduleForm, setScheduleForm] = useState({
    waiter_id: '',
    schedule_date: '',
    shift: 'morning',
    start_time: '08:00',
    end_time: '14:00',
    tables_assigned: ''
  })

  useEffect(() => {
    async function loadStore() {
      const { data } = await supabase
        .from('stores')
        .select('id')
        .eq('slug', slug)
        .single()

      if (data) {
        setStoreId(data.id)
      } else {
        setError('Loja não encontrada')
        setLoading(false)
      }
    }
    loadStore()
  }, [slug, supabase])

  useEffect(() => {
    if (storeId) {
      loadWaiters()
      loadSchedules()
      loadCommissions()
    }
  }, [storeId])

  async function loadWaiters() {
    setLoading(true)
    const { data } = await supabase
      .from('store_waiters')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_active', true)
      .order('name')
    setWaiters(data || [])
    setLoading(false)
  }

  async function loadSchedules() {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('waiter_schedules')
      .select('*')
      .eq('store_id', storeId)
      .gte('schedule_date', today)
      .order('schedule_date')
    setSchedules(data || [])
  }

  async function loadCommissions() {
    const { data } = await supabase
      .from('waiter_commissions')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .limit(100)
    setCommissions(data || [])
  }

  async function handleSaveWaiter() {
    if (!storeId || !formData.name) return
    
    const waiterData = {
      name: formData.name,
      phone: formData.phone || null,
      email: formData.email || null,
      commission_percent: parseFloat(formData.commission_percent) || 10
    }
    
    if (selectedWaiter) {
      await supabase.from('store_waiters').update(waiterData).eq('id', selectedWaiter.id)
    } else {
      await supabase.from('store_waiters').insert({ store_id: storeId, ...waiterData })
    }
    
    setShowForm(false)
    setSelectedWaiter(null)
    setFormData({ name: '', phone: '', email: '', commission_percent: '10' })
    loadWaiters()
  }

  async function handleSaveSchedule() {
    if (!storeId || !scheduleForm.waiter_id || !scheduleForm.schedule_date) return
    
    await supabase.from('waiter_schedules').insert({
      store_id: storeId,
      waiter_id: scheduleForm.waiter_id,
      schedule_date: scheduleForm.schedule_date,
      shift: scheduleForm.shift,
      start_time: scheduleForm.start_time,
      end_time: scheduleForm.end_time,
      tables_assigned: scheduleForm.tables_assigned.split(',').map(t => t.trim()).filter(Boolean)
    })
    
    setShowScheduleForm(false)
    setScheduleForm({ waiter_id: '', schedule_date: '', shift: 'morning', start_time: '08:00', end_time: '14:00', tables_assigned: '' })
    loadSchedules()
  }

  async function handleDeleteWaiter(id: string) {
    if (!confirm('Deseja desativar este garçom?')) return
    await supabase.from('store_waiters').update({ is_active: false }).eq('id', id)
    loadWaiters()
  }

  async function handlePayCommission(id: string) {
    await supabase.from('waiter_commissions')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', id)
    loadCommissions()
  }

  const getShiftLabel = (shift: string) => {
    const labels: Record<string, string> = {
      'morning': '☀️ Manhã',
      'afternoon': '🌤️ Tarde',
      'evening': '🌆 Noite',
      'night': '🌙 Madrugada'
    }
    return labels[shift] || shift
  }

  const totalPendingCommissions = commissions
    .filter(c => c.status === 'pending')
    .reduce((acc, c) => acc + c.commission_amount, 0)

  if (loading && !storeId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg shadow-purple-500/25">
                <Users className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
              Garçons
            </h1>
            <p className="text-slate-500 mt-2 ml-14">Equipe, escalas e comissões</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => { setSelectedWaiter(null); setShowForm(true); }}
              className="bg-gradient-to-r from-purple-500 to-pink-600 shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Garçom
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-lg border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500">Garçons Ativos</p>
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-slate-800">{waiters.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-lg border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500">Escalas Hoje</p>
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-slate-800">
              {schedules.filter(s => s.schedule_date === new Date().toISOString().split('T')[0]).length}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-lg border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500">Comissões Pendentes</p>
              <DollarSign className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-3xl font-bold text-amber-600">{formatCurrency(totalPendingCommissions)}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-lg border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500">Total Comissões Mês</p>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(commissions.reduce((acc, c) => acc + c.commission_amount, 0))}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border p-1 flex gap-1">
          {[
            { id: 'waiters', label: 'Garçons', icon: Users },
            { id: 'schedules', label: 'Escalas', icon: Calendar },
            { id: 'commissions', label: 'Comissões', icon: DollarSign },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                activeTab === tab.id 
                  ? 'bg-purple-500 text-white shadow-lg' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: Garçons */}
        {activeTab === 'waiters' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {waiters.length === 0 ? (
              <div className="col-span-full text-center py-12 text-slate-400">
                Nenhum garçom cadastrado
              </div>
            ) : (
              waiters.map(waiter => (
                <div key={waiter.id} className="bg-white rounded-2xl p-5 shadow-lg border hover:shadow-xl transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <UserCheck className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800">{waiter.name}</h3>
                        <p className="text-sm text-purple-600 font-medium">{waiter.commission_percent}% comissão</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedWaiter(waiter)
                          setFormData({
                            name: waiter.name,
                            phone: waiter.phone || '',
                            email: waiter.email || '',
                            commission_percent: waiter.commission_percent.toString()
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
                        onClick={() => handleDeleteWaiter(waiter.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm text-slate-500">
                    {waiter.phone && (
                      <p className="flex items-center gap-2"><Phone className="w-4 h-4" /> {waiter.phone}</p>
                    )}
                    {waiter.email && (
                      <p className="flex items-center gap-2"><Mail className="w-4 h-4" /> {waiter.email}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab: Escalas */}
        {activeTab === 'schedules' && (
          <div className="bg-white rounded-2xl shadow-lg border overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Escalas de Trabalho
              </h3>
              <Button size="sm" onClick={() => setShowScheduleForm(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Nova Escala
              </Button>
            </div>
            <div className="divide-y">
              {schedules.length === 0 ? (
                <p className="text-center text-slate-400 py-12">Nenhuma escala cadastrada</p>
              ) : (
                schedules.map(schedule => {
                  const waiter = waiters.find(w => w.id === schedule.waiter_id)
                  return (
                    <div key={schedule.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-xs text-slate-500">
                            {new Date(schedule.schedule_date).toLocaleDateString('pt-BR', { weekday: 'short' })}
                          </p>
                          <p className="font-bold text-lg">
                            {new Date(schedule.schedule_date).getDate()}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">{waiter?.name || 'Garçom'}</p>
                          <p className="text-sm text-slate-500">
                            {getShiftLabel(schedule.shift)} • {schedule.start_time} - {schedule.end_time}
                          </p>
                        </div>
                      </div>
                      {schedule.tables_assigned?.length > 0 && (
                        <div className="flex items-center gap-1">
                          <LayoutGrid className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-500">
                            Mesas: {schedule.tables_assigned.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* Tab: Comissões */}
        {activeTab === 'commissions' && (
          <div className="bg-white rounded-2xl shadow-lg border overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Comissões
              </h3>
            </div>
            <div className="divide-y">
              {commissions.length === 0 ? (
                <p className="text-center text-slate-400 py-12">Nenhuma comissão registrada</p>
              ) : (
                commissions.map(commission => {
                  const waiter = waiters.find(w => w.id === commission.waiter_id)
                  return (
                    <div key={commission.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <p className="font-medium">{waiter?.name || 'Garçom'}</p>
                        <p className="text-sm text-slate-500">
                          Pedido: {formatCurrency(commission.order_amount)}
                        </p>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <p className="font-bold text-green-600">{formatCurrency(commission.commission_amount)}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            commission.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {commission.status === 'paid' ? 'Pago' : 'Pendente'}
                          </span>
                        </div>
                        {commission.status === 'pending' && (
                          <Button size="sm" onClick={() => handlePayCommission(commission.id)}>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Pagar
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* Modal Novo Garçom */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <h3 className="text-lg font-semibold mb-4">
                {selectedWaiter ? 'Editar Garçom' : 'Novo Garçom'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Nome completo"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Comissão %</label>
                    <input
                      type="number"
                      value={formData.commission_percent}
                      onChange={e => setFormData(prev => ({ ...prev, commission_percent: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <Button variant="outline" className="flex-1" onClick={() => { setShowForm(false); setSelectedWaiter(null); }}>
                  Cancelar
                </Button>
                <Button className="flex-1" onClick={handleSaveWaiter}>
                  Salvar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Nova Escala */}
        {showScheduleForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <h3 className="text-lg font-semibold mb-4">Nova Escala</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Garçom</label>
                  <select
                    value={scheduleForm.waiter_id}
                    onChange={e => setScheduleForm(prev => ({ ...prev, waiter_id: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Selecione...</option>
                    {waiters.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                    <input
                      type="date"
                      value={scheduleForm.schedule_date}
                      onChange={e => setScheduleForm(prev => ({ ...prev, schedule_date: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Turno</label>
                    <select
                      value={scheduleForm.shift}
                      onChange={e => setScheduleForm(prev => ({ ...prev, shift: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="morning">☀️ Manhã</option>
                      <option value="afternoon">🌤️ Tarde</option>
                      <option value="evening">🌆 Noite</option>
                      <option value="night">🌙 Madrugada</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Entrada</label>
                    <input
                      type="time"
                      value={scheduleForm.start_time}
                      onChange={e => setScheduleForm(prev => ({ ...prev, start_time: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Saída</label>
                    <input
                      type="time"
                      value={scheduleForm.end_time}
                      onChange={e => setScheduleForm(prev => ({ ...prev, end_time: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mesas (separadas por vírgula)</label>
                  <input
                    type="text"
                    value={scheduleForm.tables_assigned}
                    onChange={e => setScheduleForm(prev => ({ ...prev, tables_assigned: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="01, 02, 03..."
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <Button variant="outline" className="flex-1" onClick={() => setShowScheduleForm(false)}>
                  Cancelar
                </Button>
                <Button className="flex-1" onClick={handleSaveSchedule}>
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
