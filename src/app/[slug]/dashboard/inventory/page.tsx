'use client'

import { useMemo, useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Package, Plus, Search, AlertTriangle, TrendingDown,
  TrendingUp, Loader2, AlertCircle, Edit, Trash2,
  ArrowUpCircle, ArrowDownCircle, History, Filter,
  Calendar, Truck, ClipboardList, BarChart3, X,
  Clock, Box, ShoppingCart, FileText, CheckCircle,
  Zap, RefreshCw
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface InventoryItem {
  id: string
  name: string
  unit: string
  current_quantity: number
  min_quantity: number
  cost_per_unit: number
  supplier: string | null
  barcode: string | null
  category: string | null
  is_active: boolean
  created_at: string
}

interface Movement {
  id: string
  item_id: string
  type: string
  quantity: number
  previous_quantity: number
  new_quantity: number
  reason: string | null
  batch_number: string | null
  expiry_date: string | null
  created_at: string
  item?: { name: string }
}

interface Batch {
  id: string
  item_id: string
  batch_number: string
  quantity: number
  expiry_date: string | null
  status: string
}

interface PurchaseOrder {
  id: string
  order_number: string
  supplier: string
  status: string
  total_amount: number
  expected_date: string | null
  created_at: string
}

type FilterType = 'all' | 'low' | 'out' | 'expiring'
type TabType = 'items' | 'movements' | 'batches' | 'orders' | 'count'

export default function InventoryPage() {
  const params = useParams()
  const slug = params.slug as string
  const supabase = useMemo(() => createClient(), [])
  
  const [storeId, setStoreId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const [items, setItems] = useState<InventoryItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [showForm, setShowForm] = useState(false)
  const [showMovement, setShowMovement] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  
  // Premium states
  const [activeTab, setActiveTab] = useState<TabType>('items')
  const [movements, setMovements] = useState<Movement[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [showBatchForm, setShowBatchForm] = useState(false)
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [itemMovements, setItemMovements] = useState<Movement[]>([])
  const [expiringBatches, setExpiringBatches] = useState<Batch[]>([])
  
  const [formData, setFormData] = useState({
    name: '',
    unit: 'kg',
    current_quantity: '',
    min_quantity: '',
    cost_per_unit: '',
    supplier: ''
  })
  
  const [movementData, setMovementData] = useState({
    type: 'in' as 'in' | 'out' | 'adjustment',
    quantity: '',
    reason: ''
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
    if (storeId) {
      loadItems()
      loadMovements()
      loadBatches()
      loadPurchaseOrders()
      loadExpiringBatches()
    }
  }, [storeId])

  async function loadMovements() {
    const { data } = await supabase
      .from('inventory_movements')
      .select('*, item:inventory_items(name)')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .limit(100)
    setMovements(data || [])
  }

  async function loadBatches() {
    const { data } = await supabase
      .from('inventory_batches')
      .select('*')
      .eq('store_id', storeId)
      .eq('status', 'active')
      .order('expiry_date')
    setBatches(data || [])
  }

  async function loadPurchaseOrders() {
    const { data } = await supabase
      .from('purchase_orders')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .limit(50)
    setPurchaseOrders(data || [])
  }

  async function loadExpiringBatches() {
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    
    const { data } = await supabase
      .from('inventory_batches')
      .select('*')
      .eq('store_id', storeId)
      .eq('status', 'active')
      .lte('expiry_date', nextWeek.toISOString())
      .order('expiry_date')
    setExpiringBatches(data || [])
  }

  async function loadItemMovements(itemId: string) {
    const { data } = await supabase
      .from('inventory_movements')
      .select('*')
      .eq('item_id', itemId)
      .order('created_at', { ascending: false })
      .limit(50)
    setItemMovements(data || [])
  }

  async function loadItems() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setItems(data || [])
    } catch (err) {
      console.error('Erro ao carregar estoque:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveItem() {
    if (!storeId || !formData.name) return
    
    try {
      if (selectedItem) {
        await supabase
          .from('inventory_items')
          .update({
            name: formData.name,
            unit: formData.unit,
            current_quantity: parseFloat(formData.current_quantity) || 0,
            min_quantity: parseFloat(formData.min_quantity) || 0,
            cost_per_unit: parseFloat(formData.cost_per_unit) || 0,
            supplier: formData.supplier || null
          })
          .eq('id', selectedItem.id)
      } else {
        await supabase
          .from('inventory_items')
          .insert({
            store_id: storeId,
            name: formData.name,
            unit: formData.unit,
            current_quantity: parseFloat(formData.current_quantity) || 0,
            min_quantity: parseFloat(formData.min_quantity) || 0,
            cost_per_unit: parseFloat(formData.cost_per_unit) || 0,
            supplier: formData.supplier || null
          })
      }
      
      setShowForm(false)
      setSelectedItem(null)
      setFormData({ name: '', unit: 'kg', current_quantity: '', min_quantity: '', cost_per_unit: '', supplier: '' })
      loadItems()
    } catch (err) {
      console.error('Erro ao salvar item:', err)
    }
  }

  async function handleMovement() {
    if (!selectedItem || !movementData.quantity) return
    
    try {
      const qty = parseFloat(movementData.quantity)
      const previousQty = selectedItem.current_quantity
      let newQuantity = previousQty
      
      if (movementData.type === 'in') {
        newQuantity += qty
      } else if (movementData.type === 'out') {
        newQuantity -= qty
      } else {
        newQuantity = qty
      }

      const finalQty = Math.max(0, newQuantity)

      // Atualizar quantidade
      await supabase
        .from('inventory_items')
        .update({ current_quantity: finalQty })
        .eq('id', selectedItem.id)

      // Registrar movimentação no histórico
      await supabase
        .from('inventory_movements')
        .insert({
          store_id: storeId,
          item_id: selectedItem.id,
          type: movementData.type,
          quantity: qty,
          previous_quantity: previousQty,
          new_quantity: finalQty,
          reason: movementData.reason || null,
          unit_cost: selectedItem.cost_per_unit,
          total_cost: qty * selectedItem.cost_per_unit
        })
      
      setShowMovement(false)
      setSelectedItem(null)
      setMovementData({ type: 'in', quantity: '', reason: '' })
      loadItems()
      loadMovements()
    } catch (err) {
      console.error('Erro ao registrar movimentação:', err)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja realmente excluir este item?')) return
    
    try {
      await supabase
        .from('inventory_items')
        .update({ is_active: false })
        .eq('id', id)
      loadItems()
    } catch (err) {
      console.error('Erro ao excluir item:', err)
    }
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = 
      filter === 'all' ? true :
      filter === 'low' ? item.current_quantity <= item.min_quantity && item.current_quantity > 0 :
      filter === 'out' ? item.current_quantity === 0 : true
    return matchesSearch && matchesFilter
  })

  const lowStockCount = items.filter(i => i.current_quantity <= i.min_quantity && i.current_quantity > 0).length
  const outOfStockCount = items.filter(i => i.current_quantity === 0).length

  if (loading && !storeId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl shadow-slate-200/50">
          <Loader2 className="w-14 h-14 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 text-lg font-medium">Carregando estoque...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg shadow-blue-500/25">
              <Package className="w-6 h-6 md:w-7 md:h-7 text-white" />
            </div>
            Estoque Premium
          </h1>
          <p className="text-slate-500 mt-2 ml-14">Controle completo de insumos e matéria-prima</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button 
            variant="outline"
            onClick={() => { loadItems(); loadMovements(); loadBatches(); }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button 
            onClick={() => { setSelectedItem(null); setShowForm(true); }}
            className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 shadow-lg shadow-blue-500/25"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Item
          </Button>
        </div>
      </div>

      {/* Tabs de navegação */}
      <div className="bg-white rounded-2xl shadow-sm border p-1 flex gap-1 overflow-x-auto">
        {[
          { id: 'items', label: 'Itens', icon: Package },
          { id: 'movements', label: 'Movimentações', icon: History },
          { id: 'batches', label: 'Lotes/Validade', icon: Calendar },
          { id: 'orders', label: 'Pedidos Compra', icon: ShoppingCart },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
              activeTab === tab.id 
                ? 'bg-blue-500 text-white shadow-lg' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Alertas */}
      {(lowStockCount > 0 || outOfStockCount > 0 || expiringBatches.length > 0) && (
        <div className="flex flex-wrap gap-4">
          {lowStockCount > 0 && (
            <div className="flex items-center gap-3 px-5 py-3 bg-amber-50 border border-amber-200 rounded-xl shadow-sm">
              <div className="p-2 bg-amber-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-sm font-medium text-amber-800">
                {lowStockCount} {lowStockCount === 1 ? 'item' : 'itens'} com estoque baixo
              </span>
            </div>
          )}
          {outOfStockCount > 0 && (
            <div className="flex items-center gap-3 px-5 py-3 bg-red-50 border border-red-200 rounded-xl shadow-sm">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <span className="text-sm font-medium text-red-800">
                {outOfStockCount} {outOfStockCount === 1 ? 'item' : 'itens'} sem estoque
              </span>
            </div>
          )}
          {expiringBatches.length > 0 && (
            <div className="flex items-center gap-3 px-5 py-3 bg-purple-50 border border-purple-200 rounded-xl shadow-sm">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-purple-800">
                {expiringBatches.length} lote{expiringBatches.length > 1 ? 's' : ''} vencendo em 7 dias
              </span>
            </div>
          )}
        </div>
      )}

      {/* Tab: Itens */}
      {activeTab === 'items' && (
      <>
      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar item..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'low', 'out'] as FilterType[]).map(f => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
              className={filter === f ? 'bg-gradient-to-r from-blue-500 to-cyan-600 shadow-lg shadow-blue-500/25' : 'hover:shadow-md transition-all'}
            >
              {f === 'all' ? 'Todos' : f === 'low' ? 'Estoque Baixo' : 'Sem Estoque'}
            </Button>
          ))}
        </div>
      </div>

      {/* Lista de itens */}
      <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
              <Package className="w-10 h-10 text-slate-300" />
            </div>
            <p className="text-slate-400 font-medium">Nenhum item encontrado</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-100">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Item</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Quantidade</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Mínimo</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Custo Unit.</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Status</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredItems.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      {item.supplier && (
                        <p className="text-sm text-gray-500">{item.supplier}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium">{item.current_quantity}</span>
                    <span className="text-gray-500 ml-1">{item.unit}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {item.min_quantity} {item.unit}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    R$ {item.cost_per_unit.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    {item.current_quantity === 0 ? (
                      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                        Sem estoque
                      </span>
                    ) : item.current_quantity <= item.min_quantity ? (
                      <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
                        Estoque baixo
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                        OK
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setSelectedItem(item); setShowMovement(true); }}
                      >
                        <History className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedItem(item)
                          setFormData({
                            name: item.name,
                            unit: item.unit,
                            current_quantity: item.current_quantity.toString(),
                            min_quantity: item.min_quantity.toString(),
                            cost_per_unit: item.cost_per_unit.toString(),
                            supplier: item.supplier || ''
                          })
                          setShowForm(true)
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-semibold mb-4">
              {selectedItem ? 'Editar Item' : 'Novo Item'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Ex: Polpa de Açaí"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.current_quantity}
                    onChange={e => setFormData(prev => ({ ...prev, current_quantity: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
                  <select
                    value={formData.unit}
                    onChange={e => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="kg">Quilogramas (kg)</option>
                    <option value="g">Gramas (g)</option>
                    <option value="L">Litros (L)</option>
                    <option value="ml">Mililitros (ml)</option>
                    <option value="un">Unidades (un)</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qtd. Mínima</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.min_quantity}
                    onChange={e => setFormData(prev => ({ ...prev, min_quantity: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Custo Unit. (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost_per_unit}
                    onChange={e => setFormData(prev => ({ ...prev, cost_per_unit: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fornecedor</label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={e => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Nome do fornecedor"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => { setShowForm(false); setSelectedItem(null); }}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleSaveItem}>
                Salvar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Movimentação */}
      {showMovement && selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-semibold mb-4">
              Movimentação: {selectedItem.name}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Estoque atual: {selectedItem.current_quantity} {selectedItem.unit}
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setMovementData(prev => ({ ...prev, type: 'in' }))}
                    className={`p-3 rounded-lg border flex flex-col items-center gap-1 ${
                      movementData.type === 'in' ? 'border-green-500 bg-green-50' : ''
                    }`}
                  >
                    <ArrowUpCircle className="w-5 h-5 text-green-600" />
                    <span className="text-xs">Entrada</span>
                  </button>
                  <button
                    onClick={() => setMovementData(prev => ({ ...prev, type: 'out' }))}
                    className={`p-3 rounded-lg border flex flex-col items-center gap-1 ${
                      movementData.type === 'out' ? 'border-red-500 bg-red-50' : ''
                    }`}
                  >
                    <ArrowDownCircle className="w-5 h-5 text-red-600" />
                    <span className="text-xs">Saída</span>
                  </button>
                  <button
                    onClick={() => setMovementData(prev => ({ ...prev, type: 'adjustment' }))}
                    className={`p-3 rounded-lg border flex flex-col items-center gap-1 ${
                      movementData.type === 'adjustment' ? 'border-blue-500 bg-blue-50' : ''
                    }`}
                  >
                    <History className="w-5 h-5 text-blue-600" />
                    <span className="text-xs">Ajuste</span>
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {movementData.type === 'adjustment' ? 'Nova Quantidade' : 'Quantidade'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={movementData.quantity}
                  onChange={e => setMovementData(prev => ({ ...prev, quantity: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
                <input
                  type="text"
                  value={movementData.reason}
                  onChange={e => setMovementData(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Ex: Compra, Perda, Inventário..."
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => { setShowMovement(false); setSelectedItem(null); }}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleMovement}>
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}
      </>
      )}

      {/* Tab: Movimentações */}
      {activeTab === 'movements' && (
        <div className="bg-white rounded-2xl shadow-lg border overflow-hidden">
          <div className="p-4 border-b bg-slate-50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <History className="w-5 h-5 text-blue-600" />
              Histórico de Movimentações
            </h3>
          </div>
          <div className="divide-y max-h-[600px] overflow-y-auto">
            {movements.length === 0 ? (
              <p className="text-center text-slate-400 py-12">Nenhuma movimentação registrada</p>
            ) : (
              movements.map(mov => (
                <div key={mov.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-xl ${
                      mov.type === 'in' ? 'bg-green-100' : mov.type === 'out' ? 'bg-red-100' : 'bg-blue-100'
                    }`}>
                      {mov.type === 'in' ? <ArrowUpCircle className="w-5 h-5 text-green-600" /> :
                       mov.type === 'out' ? <ArrowDownCircle className="w-5 h-5 text-red-600" /> :
                       <History className="w-5 h-5 text-blue-600" />}
                    </div>
                    <div>
                      <p className="font-medium">{mov.item?.name || 'Item'}</p>
                      <p className="text-sm text-slate-500">
                        {mov.type === 'in' ? 'Entrada' : mov.type === 'out' ? 'Saída' : 'Ajuste'} • {mov.reason || '-'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${mov.type === 'in' ? 'text-green-600' : mov.type === 'out' ? 'text-red-600' : 'text-blue-600'}`}>
                      {mov.type === 'in' ? '+' : mov.type === 'out' ? '-' : ''}{mov.quantity}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(mov.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab: Lotes/Validade */}
      {activeTab === 'batches' && (
        <div className="bg-white rounded-2xl shadow-lg border overflow-hidden">
          <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              Controle de Lotes e Validade
            </h3>
          </div>
          <div className="divide-y max-h-[600px] overflow-y-auto">
            {batches.length === 0 ? (
              <p className="text-center text-slate-400 py-12">Nenhum lote cadastrado</p>
            ) : (
              batches.map(batch => {
                const item = items.find(i => i.id === batch.item_id)
                const isExpiring = batch.expiry_date && new Date(batch.expiry_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                const isExpired = batch.expiry_date && new Date(batch.expiry_date) < new Date()
                return (
                  <div key={batch.id} className={`p-4 flex items-center justify-between ${isExpired ? 'bg-red-50' : isExpiring ? 'bg-amber-50' : ''}`}>
                    <div>
                      <p className="font-medium">{item?.name || 'Item'}</p>
                      <p className="text-sm text-slate-500">Lote: {batch.batch_number}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{batch.quantity} {item?.unit}</p>
                      {batch.expiry_date && (
                        <p className={`text-sm font-medium ${isExpired ? 'text-red-600' : isExpiring ? 'text-amber-600' : 'text-slate-500'}`}>
                          {isExpired ? '⚠️ VENCIDO' : ''} Vence: {new Date(batch.expiry_date).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Tab: Pedidos de Compra */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl shadow-lg border overflow-hidden">
          <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-green-600" />
              Pedidos de Compra
            </h3>
            <Button size="sm" onClick={() => setShowOrderForm(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Novo Pedido
            </Button>
          </div>
          <div className="divide-y max-h-[600px] overflow-y-auto">
            {purchaseOrders.length === 0 ? (
              <p className="text-center text-slate-400 py-12">Nenhum pedido de compra</p>
            ) : (
              purchaseOrders.map(order => (
                <div key={order.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <p className="font-medium">#{order.order_number || order.id.slice(0,8)}</p>
                    <p className="text-sm text-slate-500">{order.supplier}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{formatCurrency(order.total_amount)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      order.status === 'received' ? 'bg-green-100 text-green-700' :
                      order.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {order.status === 'draft' ? 'Rascunho' : 
                       order.status === 'sent' ? 'Enviado' : 
                       order.status === 'received' ? 'Recebido' : order.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
