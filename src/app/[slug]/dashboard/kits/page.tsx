'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { 
  Package, Plus, Edit, Trash2, X, Save, Loader2, 
  AlertCircle, Check, GripVertical, ChevronDown, ChevronUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Product {
  id: string
  name: string
  base_price: number
}

interface KitItem {
  id: string
  kit_id: string
  product_id: string
  default_quantity: number
  max_quantity: number | null
  extra_price: number
  product?: Product
}

interface Kit {
  id: string
  store_id: string
  name: string
  description: string | null
  base_quantity: number
  min_varieties: number
  max_varieties: number
  min_per_variety: number
  base_price: number
  price_per_extra: number
  advance_days: number
  image_url: string | null
  is_active: boolean
  items?: KitItem[]
}

export default function KitsPage() {
  const params = useParams()
  const slug = params.slug as string
  const supabase = useMemo(() => createClient(), [])

  const [storeId, setStoreId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [kits, setKits] = useState<Kit[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingKit, setEditingKit] = useState<Kit | null>(null)
  const [expandedKit, setExpandedKit] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    base_quantity: 100,
    min_varieties: 1,
    max_varieties: 5,
    min_per_variety: 10,
    base_price: 0,
    price_per_extra: 0,
    advance_days: 2,
    selectedProducts: [] as string[]
  })

  useEffect(() => {
    async function loadStore() {
      const { data } = await supabase
        .from('stores')
        .select('id')
        .eq('slug', slug)
        .single()
      if (data) setStoreId(data.id)
      setLoading(false)
    }
    loadStore()
  }, [slug, supabase])

  useEffect(() => {
    if (storeId) {
      loadKits()
      loadProducts()
    }
  }, [storeId])

  async function loadKits() {
    const { data } = await supabase
      .from('product_kits')
      .select('*, items:product_kit_items(*, product:products(id, name, base_price))')
      .eq('store_id', storeId)
      .order('name')
    setKits(data || [])
  }

  async function loadProducts() {
    const { data } = await supabase
      .from('products')
      .select('id, name, base_price')
      .eq('store_id', storeId)
      .eq('is_active', true)
      .order('name')
    setProducts(data || [])
  }

  function openNewForm() {
    setEditingKit(null)
    setFormData({
      name: '',
      description: '',
      base_quantity: 100,
      min_varieties: 1,
      max_varieties: 5,
      min_per_variety: 10,
      base_price: 0,
      price_per_extra: 0,
      advance_days: 2,
      selectedProducts: []
    })
    setShowForm(true)
  }

  function openEditForm(kit: Kit) {
    setEditingKit(kit)
    setFormData({
      name: kit.name,
      description: kit.description || '',
      base_quantity: kit.base_quantity,
      min_varieties: kit.min_varieties,
      max_varieties: kit.max_varieties,
      min_per_variety: kit.min_per_variety,
      base_price: kit.base_price,
      price_per_extra: kit.price_per_extra,
      advance_days: kit.advance_days,
      selectedProducts: kit.items?.map(i => i.product_id) || []
    })
    setShowForm(true)
  }

  async function handleSave() {
    if (!storeId || !formData.name) return
    
    setSaving(true)
    
    const kitData = {
      store_id: storeId,
      name: formData.name,
      description: formData.description || null,
      base_quantity: formData.base_quantity,
      min_varieties: formData.min_varieties,
      max_varieties: formData.max_varieties,
      min_per_variety: formData.min_per_variety,
      base_price: formData.base_price,
      price_per_extra: formData.price_per_extra,
      advance_days: formData.advance_days
    }

    let kitId = editingKit?.id

    if (editingKit) {
      await supabase.from('product_kits').update(kitData).eq('id', editingKit.id)
    } else {
      const { data } = await supabase.from('product_kits').insert(kitData).select('id').single()
      kitId = data?.id
    }

    if (kitId) {
      // Remover itens antigos e adicionar novos
      await supabase.from('product_kit_items').delete().eq('kit_id', kitId)
      
      if (formData.selectedProducts.length > 0) {
        const items = formData.selectedProducts.map(productId => ({
          kit_id: kitId,
          product_id: productId,
          default_quantity: 0,
          max_quantity: null,
          extra_price: 0
        }))
        await supabase.from('product_kit_items').insert(items)
      }
    }

    setShowForm(false)
    setEditingKit(null)
    loadKits()
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este kit?')) return
    await supabase.from('product_kits').delete().eq('id', id)
    loadKits()
  }

  async function toggleActive(kit: Kit) {
    await supabase.from('product_kits').update({ is_active: !kit.is_active }).eq('id', kit.id)
    loadKits()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-orange-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30 p-4 md:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-lg shadow-orange-500/25">
                <Package className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
              Kits e Combos
            </h1>
            <p className="text-slate-500 mt-2 ml-14">Centos de salgados, kits festa, combos personalizáveis</p>
          </div>
          <Button onClick={openNewForm} className="bg-gradient-to-r from-orange-500 to-amber-600">
            <Plus className="w-4 h-4 mr-2" />
            Novo Kit
          </Button>
        </div>

        {/* Info */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium">O que são Kits?</p>
            <p className="mt-1">Kits são produtos onde o cliente escolhe os itens. Ex: "Cento de Salgados" onde o cliente escolhe 40 coxinhas + 30 esfihas + 30 bolinhas.</p>
          </div>
        </div>

        {/* Lista de Kits */}
        {kits.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Package className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-800 mb-2">Nenhum kit cadastrado</h3>
            <p className="text-slate-500 mb-6">Crie seu primeiro kit configurável</p>
            <Button onClick={openNewForm}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Kit
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {kits.map(kit => (
              <div 
                key={kit.id} 
                className={`bg-white rounded-2xl shadow-lg border overflow-hidden ${!kit.is_active ? 'opacity-60' : ''}`}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-lg text-slate-800">{kit.name}</h3>
                        {!kit.is_active && (
                          <span className="text-xs px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full">Inativo</span>
                        )}
                      </div>
                      {kit.description && (
                        <p className="text-sm text-slate-500 mt-1">{kit.description}</p>
                      )}
                      <div className="flex flex-wrap gap-4 mt-3 text-sm">
                        <span className="text-slate-600">
                          📦 <strong>{kit.base_quantity}</strong> unidades
                        </span>
                        <span className="text-slate-600">
                          🔢 Até <strong>{kit.max_varieties}</strong> tipos
                        </span>
                        <span className="text-slate-600">
                          📋 Mín <strong>{kit.min_per_variety}</strong> por tipo
                        </span>
                        <span className="text-slate-600">
                          📅 <strong>{kit.advance_days}</strong> dias antec.
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(kit.base_price)}</p>
                      <div className="flex gap-1 mt-2">
                        <Button size="sm" variant="outline" onClick={() => openEditForm(kit)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => toggleActive(kit)}>
                          {kit.is_active ? '🔴' : '🟢'}
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleDelete(kit.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Produtos do Kit */}
                  <button
                    onClick={() => setExpandedKit(expandedKit === kit.id ? null : kit.id)}
                    className="mt-4 pt-4 border-t w-full flex items-center justify-between text-sm text-slate-600 hover:text-slate-800"
                  >
                    <span>📋 {kit.items?.length || 0} produtos disponíveis</span>
                    {expandedKit === kit.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {expandedKit === kit.id && kit.items && kit.items.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
                      {kit.items.map(item => (
                        <div key={item.id} className="bg-slate-50 rounded-lg p-2 text-sm">
                          {item.product?.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Form */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b sticky top-0 bg-white rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">
                    {editingKit ? 'Editar Kit' : 'Novo Kit'}
                  </h3>
                  <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Info básica */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Kit *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-2 border rounded-lg"
                      placeholder="Ex: Cento de Salgados Mistos"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-2 border rounded-lg"
                      placeholder="Ex: Escolha até 5 tipos de salgados"
                    />
                  </div>
                </div>

                {/* Configurações */}
                <div className="bg-orange-50 rounded-xl p-4">
                  <h4 className="font-medium text-orange-900 mb-4">Configuração do Kit</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Quantidade Total</label>
                      <input
                        type="number"
                        value={formData.base_quantity}
                        onChange={e => setFormData(prev => ({ ...prev, base_quantity: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                      <p className="text-xs text-gray-500 mt-1">Ex: 100 un</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Máx de Tipos</label>
                      <input
                        type="number"
                        value={formData.max_varieties}
                        onChange={e => setFormData(prev => ({ ...prev, max_varieties: parseInt(e.target.value) || 1 }))}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                      <p className="text-xs text-gray-500 mt-1">Ex: 5 tipos</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Mín por Tipo</label>
                      <input
                        type="number"
                        value={formData.min_per_variety}
                        onChange={e => setFormData(prev => ({ ...prev, min_per_variety: parseInt(e.target.value) || 1 }))}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                      <p className="text-xs text-gray-500 mt-1">Ex: 10 de cada</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Antecedência</label>
                      <input
                        type="number"
                        value={formData.advance_days}
                        onChange={e => setFormData(prev => ({ ...prev, advance_days: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                      <p className="text-xs text-gray-500 mt-1">dias</p>
                    </div>
                  </div>
                </div>

                {/* Preço */}
                <div className="bg-green-50 rounded-xl p-4">
                  <h4 className="font-medium text-green-900 mb-4">Preço</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Preço Base (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.base_price}
                        onChange={e => setFormData(prev => ({ ...prev, base_price: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Preço por Extra (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.price_per_extra}
                        onChange={e => setFormData(prev => ({ ...prev, price_per_extra: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                      <p className="text-xs text-gray-500 mt-1">Por unidade extra</p>
                    </div>
                  </div>
                </div>

                {/* Produtos */}
                <div>
                  <h4 className="font-medium text-slate-800 mb-3">Produtos Disponíveis no Kit</h4>
                  <p className="text-sm text-slate-500 mb-3">Selecione os produtos que o cliente pode escolher</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto border rounded-lg p-3">
                    {products.map(product => (
                      <label
                        key={product.id}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                          formData.selectedProducts.includes(product.id)
                            ? 'bg-orange-100 border-orange-300 border'
                            : 'bg-slate-50 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.selectedProducts.includes(product.id)}
                          onChange={e => {
                            if (e.target.checked) {
                              setFormData(prev => ({ ...prev, selectedProducts: [...prev.selectedProducts, product.id] }))
                            } else {
                              setFormData(prev => ({ ...prev, selectedProducts: prev.selectedProducts.filter(id => id !== product.id) }))
                            }
                          }}
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-sm truncate">{product.name}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    {formData.selectedProducts.length} produtos selecionados
                  </p>
                </div>
              </div>

              <div className="p-6 border-t bg-slate-50 flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
                <Button className="flex-1" onClick={handleSave} disabled={saving || !formData.name}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
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
