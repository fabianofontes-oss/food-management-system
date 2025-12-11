'use client'

import { useState } from 'react'
import { Store, Plus, Edit, Trash2, MapPin, Phone, Clock, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface StoreData {
  id: string
  tenant_id: string
  tenant_name: string
  name: string
  slug: string
  phone: string
  address: string
  niche: string
  mode: string
  is_active: boolean
  created_at: string
}

export default function StoresPage() {
  const [stores, setStores] = useState<StoreData[]>([
    {
      id: '1',
      tenant_id: '1',
      tenant_name: 'Tenant Demo',
      name: 'Açaí Sabor Real',
      slug: 'acai-sabor-real',
      phone: '(11) 99999-9999',
      address: 'Rua das Flores, 123 - Centro',
      niche: 'acai',
      mode: 'hybrid',
      is_active: true,
      created_at: '2024-01-01'
    }
  ])

  const [showForm, setShowForm] = useState(false)
  const [editingStore, setEditingStore] = useState<StoreData | null>(null)
  const [formData, setFormData] = useState({
    tenant_id: '1',
    name: '',
    slug: '',
    phone: '',
    address: '',
    niche: 'acai',
    mode: 'hybrid',
    is_active: true
  })

  const niches = [
    { value: 'acai', label: 'Açaíteria' },
    { value: 'burger', label: 'Hamburgueria' },
    { value: 'hotdog', label: 'Hotdog' },
    { value: 'marmita', label: 'Marmitaria' },
    { value: 'butcher', label: 'Açougue' },
    { value: 'ice_cream', label: 'Sorveteria' },
    { value: 'pizza', label: 'Pizzaria' },
    { value: 'sushi', label: 'Sushi' },
    { value: 'bakery', label: 'Padaria' },
    { value: 'other', label: 'Outro' }
  ]

  const modes = [
    { value: 'dine_in', label: 'Apenas Salão' },
    { value: 'delivery', label: 'Apenas Delivery' },
    { value: 'takeout', label: 'Apenas Retirada' },
    { value: 'hybrid', label: 'Híbrido (Todos)' }
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingStore) {
      setStores(stores.map(s => 
        s.id === editingStore.id 
          ? { ...s, ...formData, tenant_name: 'Tenant Demo' }
          : s
      ))
    } else {
      const newStore: StoreData = {
        id: Date.now().toString(),
        ...formData,
        tenant_name: 'Tenant Demo',
        created_at: new Date().toISOString()
      }
      setStores([...stores, newStore])
    }

    setFormData({
      tenant_id: '1',
      name: '',
      slug: '',
      phone: '',
      address: '',
      niche: 'acai',
      mode: 'hybrid',
      is_active: true
    })
    setShowForm(false)
    setEditingStore(null)
  }

  const handleEdit = (store: StoreData) => {
    setEditingStore(store)
    setFormData({
      tenant_id: store.tenant_id,
      name: store.name,
      slug: store.slug,
      phone: store.phone,
      address: store.address,
      niche: store.niche,
      mode: store.mode,
      is_active: store.is_active
    })
    setShowForm(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta loja?')) {
      setStores(stores.filter(s => s.id !== id))
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingStore(null)
    setFormData({
      tenant_id: '1',
      name: '',
      slug: '',
      phone: '',
      address: '',
      niche: 'acai',
      mode: 'hybrid',
      is_active: true
    })
  }

  const getNicheLabel = (niche: string) => {
    return niches.find(n => n.value === niche)?.label || niche
  }

  const getModeLabel = (mode: string) => {
    return modes.find(m => m.value === mode)?.label || mode
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Gestão de Lojas</h1>
          <p className="text-gray-600 mt-1">Gerenciar Lojas e Unidades</p>
        </div>
        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Store className="w-8 h-8 text-green-600" />
              <span className="text-3xl font-bold text-gray-900">{stores.length}</span>
            </div>
            <div className="text-gray-600">Total de Lojas</div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Settings className="w-8 h-8 text-blue-600" />
              <span className="text-3xl font-bold text-gray-900">
                {stores.filter(s => s.is_active).length}
              </span>
            </div>
            <div className="text-gray-600">Lojas Ativas</div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-purple-600" />
              <span className="text-3xl font-bold text-gray-900">
                {new Set(stores.map(s => s.niche)).size}
              </span>
            </div>
            <div className="text-gray-600">Nichos Diferentes</div>
          </div>
        </div>

        {/* Add Button */}
        <div className="mb-6">
          <Button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
          >
            <Plus className="w-5 h-5 mr-2" />
            Adicionar Nova Loja
          </Button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-6">
              {editingStore ? 'Editar Loja' : 'Nova Loja'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nome da Loja *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Açaí Sabor Real"
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Slug (URL) *
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    placeholder="Ex: acai-sabor-real"
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Telefone *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nicho *
                  </label>
                  <select
                    value={formData.niche}
                    onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
                    required
                  >
                    {niches.map(n => (
                      <option key={n.value} value={n.value}>{n.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Modo de Operação *
                  </label>
                  <select
                    value={formData.mode}
                    onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
                    required
                  >
                    {modes.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Endereço Completo *
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Rua, número, bairro, cidade"
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                />
                <label htmlFor="is_active" className="text-sm font-semibold text-gray-700">
                  Loja Ativa
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                >
                  {editingStore ? 'Salvar Alterações' : 'Criar Loja'}
                </Button>
                <Button
                  type="button"
                  onClick={handleCancel}
                  className="bg-gray-200 text-gray-700 hover:bg-gray-300"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Stores List */}
        <div className="space-y-4">
          {stores.map((store) => (
            <div key={store.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Store className="w-6 h-6 text-green-600" />
                    <h3 className="text-2xl font-bold text-gray-900">{store.name}</h3>
                    {store.is_active ? (
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">
                        Ativa
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded-full">
                        Inativa
                      </span>
                    )}
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-3 text-gray-600">
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      <span className="font-mono text-sm">/{store.slug}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span className="text-sm">{store.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{store.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4" />
                      <span className="text-sm">{getNicheLabel(store.niche)} - {getModeLabel(store.mode)}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 text-sm text-gray-500">
                    Tenant: {store.tenant_name} • Criado em: {new Date(store.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(store)}
                    className="p-3 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                    title="Editar"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(store.id)}
                    className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {stores.length === 0 && (
          <div className="text-center py-16">
            <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Nenhuma loja cadastrada</p>
            <p className="text-gray-400 mt-2">Clique em "Adicionar Nova Loja" para começar</p>
          </div>
        )}
      </div>
    </div>
  )
}
