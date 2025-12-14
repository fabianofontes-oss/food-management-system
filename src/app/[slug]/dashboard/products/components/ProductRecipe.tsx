'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { 
  X, Plus, Trash2, Package, Calculator, Save, Loader2, AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface InventoryItem {
  id: string
  name: string
  unit: string
  cost_per_unit: number
  current_quantity: number
}

interface ProductIngredient {
  id: string
  product_id: string
  inventory_item_id: string
  quantity: number
  unit: string
  inventory_item?: InventoryItem
}

interface ProductRecipeProps {
  productId: string
  productName: string
  productPrice: number
  storeId: string
  onClose: () => void
  onCostUpdate?: (cost: number) => void
}

export function ProductRecipe({ productId, productName, productPrice, storeId, onClose, onCostUpdate }: ProductRecipeProps) {
  const supabase = useMemo(() => createClient(), [])
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [ingredients, setIngredients] = useState<ProductIngredient[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  
  const [newIngredient, setNewIngredient] = useState({
    inventory_item_id: '',
    quantity: '',
    unit: 'g'
  })

  useEffect(() => {
    loadData()
  }, [productId])

  async function loadData() {
    setLoading(true)
    
    // Carregar ingredientes do produto
    const { data: ingredientsData } = await supabase
      .from('product_ingredients')
      .select('*, inventory_item:inventory_items(*)')
      .eq('product_id', productId)
    
    // Carregar itens de estoque disponíveis
    const { data: itemsData } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_active', true)
      .order('name')
    
    setIngredients(ingredientsData || [])
    setInventoryItems(itemsData || [])
    setLoading(false)
  }

  async function handleAddIngredient() {
    if (!newIngredient.inventory_item_id || !newIngredient.quantity) return
    
    setSaving(true)
    await supabase.from('product_ingredients').insert({
      store_id: storeId,
      product_id: productId,
      inventory_item_id: newIngredient.inventory_item_id,
      quantity: parseFloat(newIngredient.quantity),
      unit: newIngredient.unit
    })
    
    setNewIngredient({ inventory_item_id: '', quantity: '', unit: 'g' })
    await loadData()
    setSaving(false)
  }

  async function handleRemoveIngredient(id: string) {
    setSaving(true)
    await supabase.from('product_ingredients').delete().eq('id', id)
    await loadData()
    setSaving(false)
  }

  async function handleUpdateQuantity(id: string, quantity: number) {
    await supabase.from('product_ingredients').update({ quantity }).eq('id', id)
    setIngredients(prev => prev.map(i => i.id === id ? { ...i, quantity } : i))
  }

  // Calcular custo total
  const totalCost = ingredients.reduce((acc, ing) => {
    const item = ing.inventory_item || inventoryItems.find(i => i.id === ing.inventory_item_id)
    if (!item) return acc
    
    // Converter unidades se necessário (simplificado)
    let costPerUnit = item.cost_per_unit
    if (item.unit === 'kg' && ing.unit === 'g') {
      costPerUnit = item.cost_per_unit / 1000
    } else if (item.unit === 'L' && ing.unit === 'ml') {
      costPerUnit = item.cost_per_unit / 1000
    }
    
    return acc + (ing.quantity * costPerUnit)
  }, 0)

  const profitMargin = productPrice > 0 ? ((productPrice - totalCost) / productPrice) * 100 : 0

  async function handleSaveCost() {
    setSaving(true)
    await supabase.from('products').update({
      cost_price: totalCost,
      profit_margin: profitMargin
    }).eq('id', productId)
    
    if (onCostUpdate) onCostUpdate(totalCost)
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto" />
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-orange-50 to-amber-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Package className="w-5 h-5 text-orange-600" />
                Ficha Técnica
              </h3>
              <p className="text-sm text-slate-500">{productName}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <p className="text-sm text-slate-500">Preço Venda</p>
              <p className="text-xl font-bold text-slate-800">{formatCurrency(productPrice)}</p>
            </div>
            <div className="bg-red-50 rounded-xl p-4 text-center">
              <p className="text-sm text-red-600">Custo Total</p>
              <p className="text-xl font-bold text-red-700">{formatCurrency(totalCost)}</p>
            </div>
            <div className={`rounded-xl p-4 text-center ${profitMargin >= 50 ? 'bg-green-50' : profitMargin >= 30 ? 'bg-amber-50' : 'bg-red-50'}`}>
              <p className="text-sm text-slate-500">Margem</p>
              <p className={`text-xl font-bold ${profitMargin >= 50 ? 'text-green-700' : profitMargin >= 30 ? 'text-amber-700' : 'text-red-700'}`}>
                {profitMargin.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Ingredientes */}
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-700">Ingredientes ({ingredients.length})</h4>
            
            {ingredients.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-xl">
                <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-400">Nenhum ingrediente cadastrado</p>
              </div>
            ) : (
              <div className="space-y-2">
                {ingredients.map(ing => {
                  const item = ing.inventory_item || inventoryItems.find(i => i.id === ing.inventory_item_id)
                  const itemCost = item ? (
                    item.unit === 'kg' && ing.unit === 'g' ? item.cost_per_unit / 1000 :
                    item.unit === 'L' && ing.unit === 'ml' ? item.cost_per_unit / 1000 :
                    item.cost_per_unit
                  ) * ing.quantity : 0
                  
                  return (
                    <div key={ing.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <div className="flex-1">
                        <p className="font-medium text-slate-800">{item?.name || 'Item'}</p>
                        <p className="text-sm text-slate-500">
                          {item?.cost_per_unit ? `R$ ${item.cost_per_unit.toFixed(2)}/${item.unit}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.1"
                          value={ing.quantity}
                          onChange={(e) => handleUpdateQuantity(ing.id, parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border rounded-lg text-center text-sm"
                        />
                        <span className="text-sm text-slate-500">{ing.unit}</span>
                      </div>
                      <div className="w-24 text-right">
                        <p className="font-medium text-slate-700">{formatCurrency(itemCost)}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveIngredient(ing.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Adicionar ingrediente */}
            <div className="flex gap-2 mt-4 p-4 bg-orange-50 rounded-xl border border-orange-100">
              <select
                value={newIngredient.inventory_item_id}
                onChange={(e) => setNewIngredient(prev => ({ ...prev, inventory_item_id: e.target.value }))}
                className="flex-1 px-3 py-2 border rounded-lg text-sm"
              >
                <option value="">Selecione um insumo...</option>
                {inventoryItems
                  .filter(item => !ingredients.some(i => i.inventory_item_id === item.id))
                  .map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} (R$ {item.cost_per_unit?.toFixed(2)}/{item.unit})
                    </option>
                  ))}
              </select>
              <input
                type="number"
                step="0.1"
                value={newIngredient.quantity}
                onChange={(e) => setNewIngredient(prev => ({ ...prev, quantity: e.target.value }))}
                placeholder="Qtd"
                className="w-20 px-2 py-2 border rounded-lg text-sm"
              />
              <select
                value={newIngredient.unit}
                onChange={(e) => setNewIngredient(prev => ({ ...prev, unit: e.target.value }))}
                className="px-2 py-2 border rounded-lg text-sm"
              >
                <option value="g">g</option>
                <option value="kg">kg</option>
                <option value="ml">ml</option>
                <option value="L">L</option>
                <option value="un">un</option>
              </select>
              <Button
                size="sm"
                onClick={handleAddIngredient}
                disabled={!newIngredient.inventory_item_id || !newIngredient.quantity || saving}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {inventoryItems.length === 0 && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                <AlertCircle className="w-4 h-4" />
                Cadastre itens no Estoque para usar na ficha técnica
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Calculator className="w-4 h-4" />
            Lucro: {formatCurrency(productPrice - totalCost)} por unidade
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
            <Button onClick={handleSaveCost} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar Custo
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
