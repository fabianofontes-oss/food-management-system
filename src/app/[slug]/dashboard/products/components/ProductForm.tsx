import { useState, useEffect, useRef } from 'react'
import { X, Plus, Trash2, Clock, DollarSign, Package, Image, Upload, Layers, Coffee, TrendingUp, Percent, Tag, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Product, ProductFormData, ProductCategory, MeasurementUnit, AddonGroup } from '@/types/products'
import { createClient } from '@/lib/supabase/client'

interface ProductFormProps {
  product?: Product
  categories: ProductCategory[]
  units: MeasurementUnit[]
  allProducts: Product[]
  addonGroups: AddonGroup[]
  storeId: string
  onSubmit: (data: ProductFormData) => Promise<void>
  onClose: () => void
}

export const ProductForm = ({ product, categories, units, allProducts, addonGroups, storeId, onSubmit, onClose }: ProductFormProps) => {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState<ProductFormData>({
    name: product?.name || '',
    description: product?.description || '',
    price: (product as any)?.price || (product as any)?.base_price || 0,
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
    has_variations: product?.has_variations || false,
    sale_type: (product as any)?.sale_type || 'ready',
    min_order_quantity: (product as any)?.min_order_quantity || 1,
    advance_days: (product as any)?.advance_days || 0,
    max_daily_quantity: (product as any)?.max_daily_quantity || null,
    ingredients: product?.ingredients?.map(ing => ({
      ingredient_id: ing.ingredient_id,
      quantity: ing.quantity,
      unit_id: ing.unit_id,
      is_optional: ing.is_optional
    })) || [],
    variations: product?.variations?.map(v => ({
      id: v.id,
      name: v.name,
      price: v.price,
      is_default: v.is_default
    })) || [],
    addon_group_ids: product?.addon_groups?.map(ag => ag.addon_group_id) || []
  })
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(product?.image_url || null)
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [creatingCategory, setCreatingCategory] = useState(false)

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

  // Upload de imagem
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem válida')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB')
      return
    }

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${storeId}/${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName)

      setFormData({ ...formData, image_url: publicUrl })
      setImagePreview(publicUrl)
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      alert('Erro ao fazer upload da imagem')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = () => {
    setFormData({ ...formData, image_url: '' })
    setImagePreview(null)
  }

  // Variações
  const addVariation = () => {
    setFormData(prev => ({
      ...prev,
      variations: [...prev.variations, { name: '', price: 0, is_default: prev.variations.length === 0 }]
    }))
  }

  const removeVariation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variations: prev.variations.filter((_, i) => i !== index)
    }))
  }

  const updateVariation = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      variations: prev.variations.map((v, i) => {
        if (i === index) {
          if (field === 'is_default' && value === true) {
            return { ...v, [field]: value }
          }
          return { ...v, [field]: value }
        }
        if (field === 'is_default' && value === true) {
          return { ...v, is_default: false }
        }
        return v
      })
    }))
  }

  // Grupos de adicionais
  const toggleAddonGroup = (groupId: string) => {
    setFormData(prev => ({
      ...prev,
      addon_group_ids: prev.addon_group_ids.includes(groupId)
        ? prev.addon_group_ids.filter(id => id !== groupId)
        : [...prev.addon_group_ids, groupId]
    }))
  }

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
          {/* Imagem do Produto */}
          <div className="bg-indigo-50 rounded-xl p-4">
            <h3 className="font-bold text-indigo-900 mb-4 flex items-center gap-2">
              <Image className="w-5 h-5" />
              Imagem do Produto
            </h3>
            <div className="flex items-start gap-4">
              <div className="relative">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-xl border-2 border-indigo-200"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-32 h-32 border-2 border-dashed border-indigo-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-100/50 transition-all"
                  >
                    {uploading ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-indigo-400 mb-2" />
                        <span className="text-xs text-indigo-500 text-center">Clique para<br />adicionar</span>
                      </>
                    )}
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-2">
                  📷 Adicione uma foto atraente do seu produto
                </p>
                <p className="text-xs text-gray-500">
                  Formatos: JPG, PNG, WebP • Máx: 5MB
                </p>
                {!imagePreview && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="mt-3"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading ? 'Enviando...' : 'Escolher Imagem'}
                  </Button>
                )}
              </div>
            </div>
          </div>

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
                {showNewCategoryInput ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Nome da nova categoria"
                      className="flex-1 px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (!newCategoryName.trim()) return
                        setCreatingCategory(true)
                        try {
                          const { data, error } = await supabase
                            .from('categories')
                            .insert([{ name: newCategoryName, store_id: storeId, sort_order: categories.length }])
                            .select()
                            .single()
                          if (!error && data) {
                            setFormData({ ...formData, category_id: data.id })
                            setNewCategoryName('')
                            setShowNewCategoryInput(false)
                          }
                        } catch (err) {
                          console.error('Erro ao criar categoria:', err)
                        } finally {
                          setCreatingCategory(false)
                        }
                      }}
                      disabled={!newCategoryName.trim() || creatingCategory}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {creatingCategory ? '...' : '✓'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewCategoryInput(false)
                        setNewCategoryName('')
                      }}
                      className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <select
                      value={formData.category_id || ''}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value || null })}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Sem categoria</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowNewCategoryInput(true)}
                      className="px-3 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 flex items-center gap-1"
                      title="Nova Categoria"
                    >
                      <Plus className="w-4 h-4" />
                      <Tag className="w-4 h-4" />
                    </button>
                  </div>
                )}
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
              Preços e Margem de Lucro
            </h3>
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preço Venda *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
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
                  onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              {/* Cálculo de Margem */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Margem de Lucro</label>
                {(() => {
                  const lucro = (formData.price || 0) - (formData.cost_price || 0)
                  const margem = formData.price > 0 ? (lucro / formData.price) * 100 : 0
                  const isPositive = lucro >= 0
                  
                  return (
                    <div className={`p-3 rounded-lg border-2 ${
                      formData.cost_price > 0 
                        ? isPositive 
                          ? margem >= 30 ? 'bg-emerald-50 border-emerald-200' : margem >= 15 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'
                          : 'bg-red-50 border-red-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      {formData.cost_price > 0 ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded-lg ${
                              isPositive 
                                ? margem >= 30 ? 'bg-emerald-100' : margem >= 15 ? 'bg-yellow-100' : 'bg-red-100'
                                : 'bg-red-100'
                            }`}>
                              {isPositive ? (
                                <TrendingUp className={`w-4 h-4 ${
                                  margem >= 30 ? 'text-emerald-600' : margem >= 15 ? 'text-yellow-600' : 'text-red-600'
                                }`} />
                              ) : (
                                <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />
                              )}
                            </div>
                            <div>
                              <div className={`text-lg font-bold ${
                                isPositive 
                                  ? margem >= 30 ? 'text-emerald-700' : margem >= 15 ? 'text-yellow-700' : 'text-red-700'
                                  : 'text-red-700'
                              }`}>
                                {isPositive ? '+' : ''}R$ {lucro.toFixed(2)}
                              </div>
                              <div className="text-xs text-gray-500">Lucro por unidade</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-2xl font-bold flex items-center gap-1 ${
                              isPositive 
                                ? margem >= 30 ? 'text-emerald-600' : margem >= 15 ? 'text-yellow-600' : 'text-red-600'
                                : 'text-red-600'
                            }`}>
                              {margem.toFixed(1)}%
                              <Percent className="w-4 h-4" />
                            </div>
                            <div className="text-xs text-gray-500">
                              {margem >= 30 ? '✅ Ótima' : margem >= 15 ? '⚠️ Aceitável' : '❌ Baixa'}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 text-center py-1">
                          💡 Informe o custo para ver a margem
                        </div>
                      )}
                    </div>
                  )
                })()}
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

          {/* Tipo de Venda / Encomenda */}
          <div className="bg-amber-50 rounded-xl p-4">
            <h3 className="font-bold text-amber-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Tipo de Venda
            </h3>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                {[
                  { value: 'ready', label: '🚀 Pronta Entrega', desc: 'Venda imediata' },
                  { value: 'order', label: '📅 Sob Encomenda', desc: 'Precisa agendar' },
                  { value: 'both', label: '🔄 Ambos', desc: 'Pronta + Encomenda' }
                ].map(opt => (
                  <label 
                    key={opt.value}
                    className={`flex-1 min-w-[140px] p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.sale_type === opt.value 
                        ? 'border-amber-500 bg-amber-100' 
                        : 'border-amber-200 bg-white hover:border-amber-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="sale_type"
                      value={opt.value}
                      checked={formData.sale_type === opt.value}
                      onChange={(e) => setFormData({ ...formData, sale_type: e.target.value as any })}
                      className="sr-only"
                    />
                    <div className="text-center">
                      <div className="font-medium text-amber-900">{opt.label}</div>
                      <div className="text-xs text-amber-600">{opt.desc}</div>
                    </div>
                  </label>
                ))}
              </div>

              {(formData.sale_type === 'order' || formData.sale_type === 'both') && (
                <div className="grid md:grid-cols-3 gap-4 pt-3 border-t border-amber-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade Mínima</label>
                    <input
                      type="number"
                      value={formData.min_order_quantity}
                      onChange={(e) => setFormData({ ...formData, min_order_quantity: parseInt(e.target.value) || 1 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      min={1}
                    />
                    <p className="text-xs text-gray-500 mt-1">Ex: 50 unidades</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Antecedência (dias)</label>
                    <input
                      type="number"
                      value={formData.advance_days}
                      onChange={(e) => setFormData({ ...formData, advance_days: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      min={0}
                    />
                    <p className="text-xs text-gray-500 mt-1">Ex: 2 dias antes</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Máx/Dia (opcional)</label>
                    <input
                      type="number"
                      value={formData.max_daily_quantity || ''}
                      onChange={(e) => setFormData({ ...formData, max_daily_quantity: e.target.value ? parseInt(e.target.value) : null })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="Ilimitado"
                    />
                    <p className="text-xs text-gray-500 mt-1">Capacidade diária</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Variações / Tamanhos */}
          <div className="bg-cyan-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.has_variations}
                  onChange={(e) => {
                    setFormData({ ...formData, has_variations: e.target.checked })
                    if (e.target.checked && formData.variations.length === 0) {
                      addVariation()
                    }
                  }}
                  className="w-4 h-4 text-cyan-600 rounded focus:ring-cyan-500"
                />
                <span className="font-bold text-cyan-900">
                  <Layers className="w-4 h-4 inline mr-1" />
                  Produto com Variações (Tamanhos)
                </span>
              </label>
              {formData.has_variations && (
                <Button type="button" onClick={addVariation} size="sm" className="bg-cyan-600 hover:bg-cyan-700">
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar Tamanho
                </Button>
              )}
            </div>

            {formData.has_variations && (
              <div className="space-y-2">
                <p className="text-sm text-cyan-700 mb-3">
                  Ex: 300ml - R$ 15,00 | 500ml - R$ 18,00 | 1L - R$ 28,00
                </p>
                {formData.variations.map((variation, index) => (
                  <div key={index} className="flex gap-2 items-center bg-white p-3 rounded-lg">
                    <input
                      type="text"
                      value={variation.name}
                      onChange={(e) => updateVariation(index, 'name', e.target.value)}
                      placeholder="Ex: 300ml, 500ml, 1L, Pequeno, Médio..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      required
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-gray-500">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={variation.price}
                        onChange={(e) => updateVariation(index, 'price', parseFloat(e.target.value) || 0)}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="Preço"
                        required
                      />
                    </div>
                    <label className="flex items-center gap-1 text-sm whitespace-nowrap">
                      <input
                        type="radio"
                        name="default_variation"
                        checked={variation.is_default}
                        onChange={() => updateVariation(index, 'is_default', true)}
                        className="w-4 h-4 text-cyan-600"
                      />
                      Padrão
                    </label>
                    <button
                      type="button"
                      onClick={() => removeVariation(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      disabled={formData.variations.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Grupos de Adicionais */}
          {addonGroups.length > 0 && (
            <div className="bg-pink-50 rounded-xl p-4">
              <h3 className="font-bold text-pink-900 mb-4 flex items-center gap-2">
                <Coffee className="w-5 h-5" />
                Grupos de Adicionais
              </h3>
              <p className="text-sm text-pink-700 mb-3">
                Selecione os grupos de adicionais disponíveis para este produto (ex: Frutas, Caldas, Extras)
              </p>
              <div className="grid md:grid-cols-2 gap-2">
                {addonGroups.map(group => (
                  <label
                    key={group.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      formData.addon_group_ids.includes(group.id)
                        ? 'border-pink-500 bg-pink-100'
                        : 'border-gray-200 bg-white hover:border-pink-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.addon_group_ids.includes(group.id)}
                      onChange={() => toggleAddonGroup(group.id)}
                      className="w-4 h-4 text-pink-600 rounded focus:ring-pink-500"
                    />
                    <div>
                      <div className="font-medium text-gray-800">{group.name}</div>
                      {group.description && (
                        <div className="text-xs text-gray-500">{group.description}</div>
                      )}
                      <div className="text-xs text-pink-600 mt-1">
                        {group.is_required ? 'Obrigatório' : 'Opcional'} • 
                        {group.min_selections > 0 ? ` Mín: ${group.min_selections}` : ''} 
                        {group.max_selections > 0 ? ` Máx: ${group.max_selections}` : ''}
                        {group.addons?.length ? ` • ${group.addons.length} itens` : ''}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

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
