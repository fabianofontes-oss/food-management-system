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
            <LayoutGrid className="w-7 h-7 text-orange-600" />
            Mesas
          </h1>
          <p className="text-gray-500">Gestão de mesas e comandas</p>
        </div>
        <Button onClick={() => { setSelectedTable(null); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Mesa
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 shadow-sm border border-green-200">
          <p className="text-sm text-green-600">Disponíveis</p>
          <p className="text-2xl font-bold text-green-700">{stats.available}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 shadow-sm border border-red-200">
          <p className="text-sm text-red-600">Ocupadas</p>
          <p className="text-2xl font-bold text-red-700">{stats.occupied}</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 shadow-sm border border-yellow-200">
          <p className="text-sm text-yellow-600">Reservadas</p>
          <p className="text-2xl font-bold text-yellow-700">{stats.reserved}</p>
        </div>
      </div>

      {/* Grid de Mesas */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : tables.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <LayoutGrid className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">Nenhuma mesa cadastrada</p>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Mesa
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {tables.map(table => (
            <div
              key={table.id}
              onClick={() => handleViewDetails(table)}
              className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all hover:scale-105 ${getStatusColor(table.status)}`}
            >
              <div className="text-center">
                <Utensils className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-2xl font-bold">{table.number}</p>
                <p className="text-xs mt-1">{getStatusLabel(table.status)}</p>
                <div className="flex items-center justify-center gap-1 mt-2 text-xs opacity-70">
                  <Users className="w-3 h-3" />
                  {table.capacity}
                </div>
              </div>
              
              {table.status === 'occupied' && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                  <Clock className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
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
  )
}
