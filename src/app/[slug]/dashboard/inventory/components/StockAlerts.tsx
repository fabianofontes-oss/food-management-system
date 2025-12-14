'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { 
  AlertTriangle, ShoppingCart, Package, TrendingDown,
  Bell, X, Check, ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LowStockItem {
  id: string
  name: string
  current_quantity: number
  min_quantity: number
  unit: string
  cost_per_unit: number
  supplier_name?: string
  supplier_id?: string
}

interface StockAlertsProps {
  storeId: string
  onCreateOrder?: (items: LowStockItem[]) => void
}

export function StockAlerts({ storeId, onCreateOrder }: StockAlertsProps) {
  const supabase = createClient()
  
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    loadLowStockItems()
  }, [storeId])

  async function loadLowStockItems() {
    setLoading(true)
    
    // Buscar itens com estoque baixo
    const { data } = await supabase
      .from('inventory_items')
      .select('id, name, current_quantity, min_quantity, unit, cost_per_unit, supplier_id, suppliers(name)')
      .eq('store_id', storeId)
      .eq('is_active', true)
    
    if (data) {
      const lowStock = data
        .filter((item: any) => item.current_quantity <= item.min_quantity)
        .map((item: any) => ({
          ...item,
          supplier_name: item.suppliers?.name
        }))
        .sort((a: LowStockItem, b: LowStockItem) => 
          (a.current_quantity / a.min_quantity) - (b.current_quantity / b.min_quantity)
        )
      
      setLowStockItems(lowStock)
    }
    
    setLoading(false)
  }

  function toggleItem(id: string) {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  function selectAll() {
    if (selectedItems.length === lowStockItems.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(lowStockItems.map(i => i.id))
    }
  }

  function handleCreateOrder() {
    const items = lowStockItems.filter(i => selectedItems.includes(i.id))
    onCreateOrder?.(items)
  }

  function getStockLevel(item: LowStockItem) {
    const ratio = item.current_quantity / item.min_quantity
    if (ratio === 0) return { color: 'red', label: 'ZERADO', bg: 'bg-red-100' }
    if (ratio <= 0.5) return { color: 'red', label: 'CRÍTICO', bg: 'bg-red-50' }
    return { color: 'yellow', label: 'BAIXO', bg: 'bg-yellow-50' }
  }

  const displayItems = showAll ? lowStockItems : lowStockItems.slice(0, 5)
  const totalValue = lowStockItems.reduce((sum, i) => 
    sum + ((i.min_quantity * 2 - i.current_quantity) * i.cost_per_unit), 0
  )

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 border animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-12 bg-slate-100 rounded"></div>
          <div className="h-12 bg-slate-100 rounded"></div>
        </div>
      </div>
    )
  }

  if (lowStockItems.length === 0) {
    return (
      <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-100 rounded-xl">
            <Check className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="font-bold text-green-800">Estoque OK!</h3>
            <p className="text-sm text-green-600">Todos os itens estão acima do mínimo</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-red-500 to-orange-500 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold">Alertas de Estoque</h3>
              <p className="text-sm text-white/80">{lowStockItems.length} itens com estoque baixo</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-white/80">Valor estimado</p>
            <p className="text-xl font-bold">{formatCurrency(totalValue)}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-3 bg-slate-50 border-b flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input
            type="checkbox"
            checked={selectedItems.length === lowStockItems.length}
            onChange={selectAll}
            className="w-4 h-4 rounded"
          />
          Selecionar todos
        </label>
        {selectedItems.length > 0 && (
          <Button size="sm" onClick={handleCreateOrder} className="bg-blue-500 hover:bg-blue-600">
            <ShoppingCart className="w-4 h-4 mr-1" />
            Criar Pedido ({selectedItems.length})
          </Button>
        )}
      </div>

      {/* Lista */}
      <div className="divide-y">
        {displayItems.map(item => {
          const level = getStockLevel(item)
          const suggestedQty = Math.max(item.min_quantity * 2 - item.current_quantity, item.min_quantity)
          
          return (
            <div 
              key={item.id} 
              className={`p-4 flex items-center gap-4 hover:bg-slate-50 ${level.bg}`}
            >
              <input
                type="checkbox"
                checked={selectedItems.includes(item.id)}
                onChange={() => toggleItem(item.id)}
                className="w-4 h-4 rounded"
              />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-800 truncate">{item.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    level.color === 'red' ? 'bg-red-200 text-red-700' : 'bg-yellow-200 text-yellow-700'
                  }`}>
                    {level.label}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                  <span>Atual: <strong className={level.color === 'red' ? 'text-red-600' : 'text-yellow-600'}>
                    {item.current_quantity} {item.unit}
                  </strong></span>
                  <span>Mínimo: {item.min_quantity} {item.unit}</span>
                  {item.supplier_name && <span>📦 {item.supplier_name}</span>}
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm text-slate-500">Sugestão compra</p>
                <p className="font-bold text-blue-600">{suggestedQty} {item.unit}</p>
                <p className="text-xs text-slate-400">{formatCurrency(suggestedQty * item.cost_per_unit)}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Ver mais */}
      {lowStockItems.length > 5 && (
        <div className="p-3 border-t bg-slate-50 text-center">
          <button 
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {showAll ? 'Mostrar menos' : `Ver todos (${lowStockItems.length})`}
          </button>
        </div>
      )}
    </div>
  )
}
