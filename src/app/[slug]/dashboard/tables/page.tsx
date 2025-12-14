'use client'

import { useMemo, useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { 
  LayoutGrid, Plus, Users, Clock, Receipt,
  Loader2, AlertCircle, Edit, Trash2, QrCode,
  CheckCircle, XCircle, ArrowRight, Utensils
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
  
  const [formData, setFormData] = useState({
    number: '',
    capacity: '4'
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
    if (storeId) loadTables()
  }, [storeId])

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
    
    try {
      if (selectedTable) {
        await supabase
          .from('tables')
          .update({
            number: formData.number,
            capacity: parseInt(formData.capacity) || 4
          })
          .eq('id', selectedTable.id)
      } else {
        await supabase
          .from('tables')
          .insert({
            store_id: storeId,
            number: formData.number,
            capacity: parseInt(formData.capacity) || 4,
            status: 'available'
          })
      }
      
      setShowForm(false)
      setSelectedTable(null)
      setFormData({ number: '', capacity: '4' })
      loadTables()
    } catch (err) {
      console.error('Erro ao salvar mesa:', err)
    }
  }

  async function handleChangeStatus(table: Table, newStatus: Table['status']) {
    try {
      await supabase
        .from('tables')
        .update({ status: newStatus })
        .eq('id', table.id)
      loadTables()
    } catch (err) {
      console.error('Erro ao alterar status:', err)
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-lg shadow-orange-500/25">
              <LayoutGrid className="w-6 h-6 md:w-7 md:h-7 text-white" />
            </div>
            Mesas
          </h1>
          <p className="text-slate-500 mt-2 ml-14">Gestão de mesas e comandas</p>
        </div>
        <Button 
          onClick={() => { setSelectedTable(null); setShowForm(true); }}
          className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-lg shadow-orange-500/25"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Mesa
        </Button>
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
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-white/50 rounded-xl flex items-center justify-center">
                  <Utensils className="w-6 h-6 opacity-70" />
                </div>
                <p className="text-2xl font-bold">{table.number}</p>
                <p className="text-xs mt-1 font-medium">{getStatusLabel(table.status)}</p>
                <div className="flex items-center justify-center gap-1 mt-3 text-xs opacity-80">
                  <Users className="w-3.5 h-3.5" />
                  <span className="font-medium">{table.capacity}</span>
                </div>
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
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número/Nome da Mesa
                </label>
                <input
                  type="text"
                  value={formData.number}
                  onChange={e => setFormData(prev => ({ ...prev, number: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Ex: 01, A1, Varanda..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacidade (pessoas)
                </label>
                <select
                  value={formData.capacity}
                  onChange={e => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {[2, 4, 6, 8, 10, 12].map(n => (
                    <option key={n} value={n}>{n} pessoas</option>
                  ))}
                </select>
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

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFormData({
                      number: selectedTable.number,
                      capacity: selectedTable.capacity.toString()
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
      </div>
    </div>
  )
}
