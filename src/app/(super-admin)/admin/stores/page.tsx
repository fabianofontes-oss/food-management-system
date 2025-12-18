'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Store, MapPin, Phone, ExternalLink, LayoutDashboard, Loader2, KeyRound, Plus, Edit, Trash2 } from 'lucide-react'
import { getStores, createStore, updateStore, deleteStore, getTenants, type StoreWithTenant, type Tenant } from '@/lib/superadmin/queries'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const nicheLabels: Record<string, string> = {
  acai: 'Açaíteria',
  burger: 'Hamburgueria',
  hotdog: 'Hotdog',
  marmita: 'Marmitaria',
  butcher: 'Açougue',
  ice_cream: 'Sorveteria',
  pizza: 'Pizzaria',
  sushi: 'Sushi',
  bakery: 'Padaria',
  other: 'Outro'
}

const modeLabels: Record<string, string> = {
  store: 'Loja Física',
  home: 'Home-based'
}

const nicheOptions = [
  { value: 'acai', label: 'Açaíteria' },
  { value: 'burger', label: 'Hamburgueria' },
  { value: 'hotdog', label: 'Hotdog' },
  { value: 'marmita', label: 'Marmitaria' },
  { value: 'butcher', label: 'Açougue' },
  { value: 'ice_cream', label: 'Sorveteria' },
  { value: 'pizza', label: 'Pizzaria' },
  { value: 'sushi', label: 'Sushi' },
  { value: 'bakery', label: 'Padaria' },
  { value: 'other', label: 'Outro' },
]

export default function StoresPage() {
  const router = useRouter()
  const [stores, setStores] = useState<StoreWithTenant[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingStore, setEditingStore] = useState<StoreWithTenant | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    tenant_id: '',
    niche: 'burger',
    mode: 'store',
    phone: '',
    address: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const [storesData, tenantsData] = await Promise.all([
        getStores(),
        getTenants()
      ])
      setStores(storesData)
      setTenants(tenantsData)
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
      setError('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  async function loadStores() {
    try {
      setLoading(true)
      const data = await getStores()
      setStores(data)
    } catch (err) {
      console.error('Erro ao carregar lojas:', err)
      setError('Erro ao carregar lojas')
    } finally {
      setLoading(false)
    }
  }

  function handleAssumeStore(storeSlug: string, storeName: string) {
    toast.success(`Entrando em ${storeName}...`)
    router.push(`/${storeSlug}/dashboard`)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.name || !formData.slug || !formData.tenant_id) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    try {
      setSubmitting(true)
      if (editingStore) {
        await updateStore(editingStore.id, {
          name: formData.name,
          slug: formData.slug,
          niche: formData.niche as any,
          mode: formData.mode as any,
          phone: formData.phone || null,
          address: formData.address || null,
        })
        toast.success('Loja atualizada com sucesso!')
      } else {
        await createStore({
          name: formData.name,
          slug: formData.slug,
          tenant_id: formData.tenant_id,
          niche: formData.niche as any,
          mode: formData.mode as any,
          phone: formData.phone || null,
          address: formData.address || null,
          is_active: true,
        })
        toast.success('Loja criada com sucesso!')
      }
      await loadData()
      handleCancel()
    } catch (err) {
      console.error('Erro ao salvar loja:', err)
      toast.error('Erro ao salvar loja')
    } finally {
      setSubmitting(false)
    }
  }

  function handleEdit(store: StoreWithTenant) {
    setEditingStore(store)
    setFormData({
      name: store.name,
      slug: store.slug,
      tenant_id: store.tenant_id,
      niche: store.niche || 'burger',
      mode: store.mode || 'store',
      phone: store.phone || '',
      address: store.address || '',
    })
    setShowForm(true)
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Tem certeza que deseja excluir a loja "${name}"?`)) return

    try {
      await deleteStore(id)
      toast.success('Loja excluída com sucesso!')
      await loadData()
    } catch (err) {
      console.error('Erro ao excluir loja:', err)
      toast.error('Erro ao excluir loja. Verifique se não há pedidos vinculados.')
    }
  }

  function handleCancel() {
    setShowForm(false)
    setEditingStore(null)
    setFormData({
      name: '',
      slug: '',
      tenant_id: '',
      niche: 'burger',
      mode: 'store',
      phone: '',
      address: '',
    })
  }

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando lojas...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={loadStores} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Gestão de Lojas</h1>
          <p className="text-gray-600 mt-1">Gerenciar Lojas e Unidades</p>
        </div>

        {/* Add Store Button */}
        <div className="mb-6">
          <Button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nova Loja
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
                    onChange={(e) => {
                      const name = e.target.value
                      setFormData(prev => ({ 
                        ...prev, 
                        name,
                        slug: prev.slug || generateSlug(name)
                      }))
                    }}
                    placeholder="Ex: Açaí do João"
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
                    required
                    disabled={submitting}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Slug (URL) *
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="acai-do-joao"
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
                    required
                    disabled={submitting}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tenant (Rede) *
                  </label>
                  <select
                    value={formData.tenant_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, tenant_id: e.target.value }))}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
                    required
                    disabled={submitting || !!editingStore}
                  >
                    <option value="">Selecione um tenant...</option>
                    {tenants.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nicho
                  </label>
                  <select
                    value={formData.niche}
                    onChange={(e) => setFormData(prev => ({ ...prev, niche: e.target.value }))}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
                    disabled={submitting}
                  >
                    {nicheOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(31) 99914-0095"
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
                    disabled={submitting}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Endereço
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Rua, número, bairro"
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    editingStore ? 'Salvar Alterações' : 'Criar Loja'
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={handleCancel}
                  disabled={submitting}
                  className="bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        )}

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
              <Store className="w-8 h-8 text-blue-600" />
              <span className="text-3xl font-bold text-gray-900">
                {stores.filter(s => s.is_active).length}
              </span>
            </div>
            <div className="text-gray-600">Lojas Ativas</div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Store className="w-8 h-8 text-purple-600" />
              <span className="text-3xl font-bold text-gray-900">
                {new Set(stores.map(s => s.niche)).size}
              </span>
            </div>
            <div className="text-gray-600">Nichos Diferentes</div>
          </div>
        </div>

        {/* Stores List */}
        {stores.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Nenhuma loja cadastrada</p>
          </div>
        ) : (
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
                    
                    <div className="grid md:grid-cols-2 gap-3 text-gray-600 mb-4">
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4" />
                        <span className="text-sm">
                          <span className="font-semibold">Tenant:</span> {store.tenant.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4" />
                        <span className="text-sm">
                          <span className="font-semibold">Slug:</span> <code className="bg-gray-100 px-2 py-1 rounded text-xs">{store.slug}</code>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4" />
                        <span className="text-sm">
                          <span className="font-semibold">Nicho:</span> {nicheLabels[store.niche] || store.niche}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4" />
                        <span className="text-sm">
                          <span className="font-semibold">Modo:</span> {modeLabels[store.mode] || store.mode}
                        </span>
                      </div>
                      {store.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <span className="text-sm">{store.phone}</span>
                        </div>
                      )}
                      {store.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm">{store.address}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-500 mb-3">
                      Criado em: {new Date(store.created_at).toLocaleDateString('pt-BR')}
                    </div>
                    
                    {/* Links de Acesso Rápido */}
                    <div className="flex gap-2 flex-wrap">
                      <Link
                        href={`/${store.slug}`}
                        target="_blank"
                        className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Cardápio
                      </Link>
                      <Link
                        href={`/${store.slug}/dashboard`}
                        target="_blank"
                        className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-emerald-600 border border-emerald-300 rounded-lg hover:bg-emerald-50 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </Link>
                      <button
                        onClick={() => handleAssumeStore(store.slug, store.name)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-amber-600 border border-amber-300 rounded-lg hover:bg-amber-50 transition-colors"
                        title="Entrar no dashboard desta loja"
                      >
                        <KeyRound className="w-4 h-4" />
                        Entrar na Loja
                      </button>
                      <button
                        onClick={() => handleEdit(store)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                        title="Editar loja"
                      >
                        <Edit className="w-4 h-4" />
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(store.id, store.name)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                        title="Excluir loja"
                      >
                        <Trash2 className="w-4 h-4" />
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
