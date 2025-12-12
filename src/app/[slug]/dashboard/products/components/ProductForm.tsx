import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Clock, DollarSign, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Product, ProductFormData, ProductCategory, MeasurementUnit } from '@/types/products'

interface ProductFormProps {
  product?: Product
  categories: ProductCategory[]
  units: MeasurementUnit[]
  allProducts: Product[]
  onSubmit: (data: ProductFormData) => Promise<void>
  onClose: () => void
}

export const ProductForm = ({ product, categories, units, allProducts, onSubmit, onClose }: ProductFormProps) => {
  const [formData, setFormData] = useState<ProductFormData>({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || 0,
    category_id: product?.category_id || null,
    unit_id: product?.unit_id || null,
    prep_time: product?.prep_time || 0,
    is_composed: product?.is_composed || false,
    cost_price: product?.cost_price || 0,
    stock_quantity: product?.stock_quantity || 0,
    min_stock: product?.min_stock || 0,
    sku: product?.sku || '',
    barcode: product?.barcode || '',
    image_url: product?.image_url || '',
    requires_kitchen: product?.requires_kitchen || false,
    is_active: product?.is_active ?? true,
    ingredients: product?.ingredients?.map(ing => ({
      ingredient_id: ing.ingredient_id,
      quantity: ing.quantity,
      unit_id: ing.unit_id,
      is_optional: ing.is_optional
    })) || []
  })
  const [submitting, setSubmitting] = useState(false)

  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { ingredient_id: '', quantity: 1, unit_id: null, is_optional: false }]
    }))
  }

  const removeIngredient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }))
  }

  const updateIngredient = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) => 
        i === index ? { ...ing, [field]: value } : ing
      )
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit(formData)
      onClose()
    } catch (error) {
      console.error('Erro ao salvar produto:', error)
      alert('Erro ao salvar produto')
    } finally {
      setSubmitting(false)
    }
  }

  const availableIngredients = allProducts.filter(p => p.id !== product?.id && !p.is_composed)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {product ? 'Editar Produto' : 'Novo Produto'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informações Básicas */}
          <div className="bg-blue-50 rounded-xl p-4">
            <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Informações Básicas
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <select
                  value={formData.category_id || ''}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value || null })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Sem categoria</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Preços e Unidade */}
          <div className="bg-green-50 rounded-xl p-4">
            <h3 className="font-bold text-green-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Preços e Unidade
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preço Venda *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Custo</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cost_price}
                  onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
                <select
                  value={formData.unit_id || ''}
                  onChange={(e) => setFormData({ ...formData, unit_id: e.target.value || null })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Selecione</option>
                  {units.map(unit => (
                    <option key={unit.id} value={unit.id}>{unit.name} ({unit.code})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Estoque e Tempo */}
          <div className="bg-purple-50 rounded-xl p-4">
            <h3 className="font-bold text-purple-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Estoque e Preparo
            </h3>
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estoque Atual</label>
                <input
                  type="number"
                  step="0.001"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estoque Mínimo</label>
                <input
                  type="number"
                  step="0.001"
                  value={formData.min_stock}
                  onChange={(e) => setFormData({ ...formData, min_stock: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tempo Preparo (min)</label>
                <input
                  type="number"
                  value={formData.prep_time}
                  onChange={(e) => setFormData({ ...formData, prep_time: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.requires_kitchen}
                    onChange={(e) => setFormData({ ...formData, requires_kitchen: e.target.checked })}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Requer Cozinha</span>
                </label>
              </div>
            </div>
          </div>

          {/* Produto Composto */}
          <div className="bg-orange-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_composed}
                  onChange={(e) => setFormData({ ...formData, is_composed: e.target.checked })}
                  className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                />
                <span className="font-bold text-orange-900">Produto Composto (Receita)</span>
              </label>
              {formData.is_composed && (
                <Button type="button" onClick={addIngredient} size="sm" className="bg-orange-600 hover:bg-orange-700">
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar Ingrediente
                </Button>
              )}
            </div>

            {formData.is_composed && (
              <div className="space-y-2">
                {formData.ingredients.map((ing, index) => (
                  <div key={index} className="flex gap-2 items-start bg-white p-3 rounded-lg">
                    <select
                      value={ing.ingredient_id}
                      onChange={(e) => updateIngredient(index, 'ingredient_id', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      required
                    >
                      <option value="">Selecione o ingrediente</option>
                      {availableIngredients.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      step="0.001"
                      value={ing.quantity}
                      onChange={(e) => updateIngredient(index, 'quantity', parseFloat(e.target.value))}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Qtd"
                      required
                    />
                    <select
                      value={ing.unit_id || ''}
                      onChange={(e) => updateIngredient(index, 'unit_id', e.target.value || null)}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">Unidade</option>
                      {units.map(unit => (
                        <option key={unit.id} value={unit.id}>{unit.code}</option>
                      ))}
                    </select>
                    <label className="flex items-center gap-1 text-sm">
                      <input
                        type="checkbox"
                        checked={ing.is_optional}
                        onChange={(e) => updateIngredient(index, 'is_optional', e.target.checked)}
                        className="w-4 h-4"
                      />
                      Opcional
                    </label>
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Outros Campos */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código de Barras</label>
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label className="text-sm font-medium text-gray-700">Produto Ativo</label>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button type="button" onClick={onClose} variant="outline" className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting} className="flex-1 bg-blue-600 hover:bg-blue-700">
              {submitting ? 'Salvando...' : product ? 'Atualizar' : 'Criar Produto'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
