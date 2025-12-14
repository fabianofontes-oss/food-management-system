'use client'

import { useMemo, useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { 
  Plus, Coffee, Trash2, Pencil, X, GripVertical, Check,
  ToggleLeft, ToggleRight, Loader2, Save, ChevronDown, ChevronUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

interface Addon {
  id: string
  addon_group_id: string
  name: string
  price: number
  sort_order: number
  is_active: boolean
}

interface AddonGroup {
  id: string
  store_id: string
  tenant_id: string
  name: string
  description: string | null
  min_selections: number
  max_selections: number
  is_required: boolean
  sort_order: number
  is_active: boolean
  addons?: Addon[]
}

export default function AddonsPage() {
  const params = useParams()
  const slug = params.slug as string
  const supabase = useMemo(() => createClient(), [])
  
  const [storeId, setStoreId] = useState<string | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [addonGroups, setAddonGroups] = useState<AddonGroup[]>([])
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)
  
  const [showGroupForm, setShowGroupForm] = useState(false)
  const [editingGroup, setEditingGroup] = useState<AddonGroup | null>(null)
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    min_selections: 0,
    max_selections: 10,
    is_required: false
  })

  const [showAddonForm, setShowAddonForm] = useState<string | null>(null)
  const [addonForm, setAddonForm] = useState({ name: '', price: 0 })

  // Buscar store e tenant
  useEffect(() => {
    async function fetchStore() {
      try {
        const { data, error } = await supabase
          .from('stores')
          .select('id, tenant_id')
          .eq('slug', slug)
          .single()

        if (error || !data) return
        setStoreId(data.id)
        setTenantId(data.tenant_id)
      } catch (err) {
        console.error('Erro ao buscar loja:', err)
      }
    }
    if (slug) fetchStore()
  }, [slug, supabase])

  // Buscar grupos de adicionais
  useEffect(() => {
    if (storeId) fetchAddonGroups()
  }, [storeId])

  const fetchAddonGroups = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('addon_groups')
        .select(`
          *,
          addons(*)
        `)
        .eq('store_id', storeId)
        .order('sort_order')

      if (error) throw error
      setAddonGroups(data || [])
    } catch (err) {
      console.error('Erro ao buscar grupos:', err)
    } finally {
      setLoading(false)
    }
  }

  // CRUD Grupos
  const handleSaveGroup = async () => {
    if (!groupForm.name.trim() || !storeId || !tenantId) return
    
    setSaving(true)
    try {
      if (editingGroup) {
        await supabase
          .from('addon_groups')
          .update({
            name: groupForm.name,
            description: groupForm.description || null,
            min_selections: groupForm.min_selections,
            max_selections: groupForm.max_selections,
            is_required: groupForm.is_required
          })
          .eq('id', editingGroup.id)
      } else {
        await supabase
          .from('addon_groups')
          .insert([{
            store_id: storeId,
            tenant_id: tenantId,
            name: groupForm.name,
            description: groupForm.description || null,
            min_selections: groupForm.min_selections,
            max_selections: groupForm.max_selections,
            is_required: groupForm.is_required,
            sort_order: addonGroups.length
          }])
      }
      
      resetGroupForm()
      await fetchAddonGroups()
    } catch (err) {
      console.error('Erro ao salvar grupo:', err)
      alert('Erro ao salvar grupo')
    } finally {
      setSaving(false)
    }
  }

  const handleEditGroup = (group: AddonGroup) => {
    setEditingGroup(group)
    setGroupForm({
      name: group.name,
      description: group.description || '',
      min_selections: group.min_selections,
      max_selections: group.max_selections,
      is_required: group.is_required
    })
    setShowGroupForm(true)
  }

  const handleDeleteGroup = async (id: string) => {
    if (!confirm('Excluir este grupo e todos os adicionais?')) return
    
    setSaving(true)
    try {
      await supabase.from('addon_groups').delete().eq('id', id)
      await fetchAddonGroups()
    } catch (err) {
      console.error('Erro ao excluir:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleGroupActive = async (group: AddonGroup) => {
    try {
      await supabase
        .from('addon_groups')
        .update({ is_active: !group.is_active })
        .eq('id', group.id)
      await fetchAddonGroups()
    } catch (err) {
      console.error('Erro ao atualizar:', err)
    }
  }

  const resetGroupForm = () => {
    setShowGroupForm(false)
    setEditingGroup(null)
    setGroupForm({
      name: '',
      description: '',
      min_selections: 0,
      max_selections: 10,
      is_required: false
    })
  }

  // CRUD Adicionais
  const handleSaveAddon = async (groupId: string) => {
    if (!addonForm.name.trim()) return
    
    setSaving(true)
    try {
      const group = addonGroups.find(g => g.id === groupId)
      await supabase
        .from('addons')
        .insert([{
          addon_group_id: groupId,
          name: addonForm.name,
          price: addonForm.price || 0,
          sort_order: group?.addons?.length || 0
        }])
      
      setShowAddonForm(null)
      setAddonForm({ name: '', price: 0 })
      await fetchAddonGroups()
    } catch (err) {
      console.error('Erro ao salvar adicional:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAddon = async (addonId: string) => {
    setSaving(true)
    try {
      await supabase.from('addons').delete().eq('id', addonId)
      await fetchAddonGroups()
    } catch (err) {
      console.error('Erro ao excluir:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleAddonActive = async (addon: Addon) => {
    try {
      await supabase
        .from('addons')
        .update({ is_active: !addon.is_active })
        .eq('id', addon.id)
      await fetchAddonGroups()
    } catch (err) {
      console.error('Erro ao atualizar:', err)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-pink-50/30 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl">
          <Loader2 className="w-14 h-14 text-pink-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 text-lg font-medium">Carregando adicionais...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-pink-50/30 p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl shadow-lg shadow-pink-500/25">
                <Coffee className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
              Adicionais
            </h1>
            <p className="text-slate-500 mt-2 ml-14">
              Gerencie grupos de adicionais para seus produtos
            </p>
          </div>
          <Button
            onClick={() => setShowGroupForm(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 shadow-lg shadow-pink-500/25"
          >
            <Plus className="w-5 h-5" />
            Novo Grupo
          </Button>
        </div>

        {/* Formulário de Grupo */}
        {showGroupForm && (
          <div className="bg-white rounded-2xl shadow-lg border border-pink-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">
              {editingGroup ? 'Editar Grupo' : 'Novo Grupo de Adicionais'}
            </h3>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Grupo *</label>
                  <input
                    type="text"
                    value={groupForm.name}
                    onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                    placeholder="Ex: Frutas, Caldas, Extras..."
                    className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                  <input
                    type="text"
                    value={groupForm.description}
                    onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                    placeholder="Opcional"
                    className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 outline-none"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mín. Seleções</label>
                  <input
                    type="number"
                    min="0"
                    value={groupForm.min_selections}
                    onChange={(e) => setGroupForm({ ...groupForm, min_selections: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Máx. Seleções</label>
                  <input
                    type="number"
                    min="1"
                    value={groupForm.max_selections}
                    onChange={(e) => setGroupForm({ ...groupForm, max_selections: parseInt(e.target.value) || 10 })}
                    className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 outline-none"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl hover:bg-pink-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={groupForm.is_required}
                      onChange={(e) => setGroupForm({ ...groupForm, is_required: e.target.checked })}
                      className="w-5 h-5 text-pink-600 rounded focus:ring-pink-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Obrigatório</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={resetGroupForm} disabled={saving}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSaveGroup} 
                  disabled={!groupForm.name.trim() || saving}
                  className="bg-gradient-to-r from-pink-500 to-rose-600"
                >
                  {saving ? 'Salvando...' : editingGroup ? 'Atualizar' : 'Criar Grupo'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Grupos */}
        {addonGroups.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-16 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-pink-100 rounded-2xl flex items-center justify-center">
              <Coffee className="w-10 h-10 text-pink-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Nenhum grupo de adicionais</h3>
            <p className="text-slate-500 mb-6">
              Crie grupos como "Frutas", "Caldas", "Extras" para seus produtos
            </p>
            <Button 
              onClick={() => setShowGroupForm(true)}
              className="bg-gradient-to-r from-pink-500 to-rose-600"
            >
              <Plus className="w-5 h-5 mr-2" />
              Criar Primeiro Grupo
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {addonGroups.map((group) => (
              <div 
                key={group.id} 
                className={`bg-white rounded-2xl shadow-lg border transition-all ${
                  group.is_active ? 'border-slate-100' : 'border-slate-200 opacity-60'
                }`}
              >
                {/* Header do Grupo */}
                <div 
                  className="p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50 rounded-t-2xl transition-colors"
                  onClick={() => setExpandedGroup(expandedGroup === group.id ? null : group.id)}
                >
                  <div className="text-slate-400">
                    <GripVertical className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-800">{group.name}</h3>
                      {group.is_required && (
                        <span className="px-2 py-0.5 text-xs font-semibold bg-pink-100 text-pink-700 rounded-full">
                          Obrigatório
                        </span>
                      )}
                      {!group.is_active && (
                        <span className="px-2 py-0.5 text-xs font-semibold bg-slate-200 text-slate-600 rounded-full">
                          Inativo
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-500">
                      {group.addons?.length || 0} itens • 
                      {group.min_selections > 0 ? ` Mín: ${group.min_selections}` : ''} 
                      {` Máx: ${group.max_selections}`}
                    </div>
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleToggleGroupActive(group)}
                      className={`p-2 rounded-lg transition-colors ${group.is_active ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'}`}
                    >
                      {group.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => handleEditGroup(group)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(group.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-slate-400">
                    {expandedGroup === group.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>

                {/* Conteúdo Expandido - Adicionais */}
                {expandedGroup === group.id && (
                  <div className="border-t border-slate-100 p-4 space-y-3">
                    {/* Lista de Adicionais */}
                    {group.addons && group.addons.length > 0 ? (
                      <div className="space-y-2">
                        {group.addons.map((addon) => (
                          <div 
                            key={addon.id}
                            className={`flex items-center gap-3 p-3 rounded-xl border ${
                              addon.is_active ? 'border-slate-200 bg-slate-50' : 'border-slate-200 bg-slate-100 opacity-60'
                            }`}
                          >
                            <div className="flex-1">
                              <span className="font-medium text-slate-800">{addon.name}</span>
                            </div>
                            <span className="font-bold text-emerald-600">
                              {addon.price > 0 ? `+${formatCurrency(addon.price)}` : 'Grátis'}
                            </span>
                            <button
                              onClick={() => handleToggleAddonActive(addon)}
                              className={`p-1.5 rounded-lg transition-colors ${addon.is_active ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'}`}
                            >
                              {addon.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleDeleteAddon(addon.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 text-center py-4">
                        Nenhum adicional cadastrado neste grupo
                      </p>
                    )}

                    {/* Formulário de Novo Adicional */}
                    {showAddonForm === group.id ? (
                      <div className="flex gap-2 p-3 bg-pink-50 rounded-xl border border-pink-200">
                        <input
                          type="text"
                          value={addonForm.name}
                          onChange={(e) => setAddonForm({ ...addonForm, name: e.target.value })}
                          placeholder="Nome do adicional"
                          className="flex-1 px-3 py-2 border-2 border-slate-200 rounded-lg focus:border-pink-500 outline-none text-sm"
                          autoFocus
                        />
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-slate-500">R$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={addonForm.price}
                            onChange={(e) => setAddonForm({ ...addonForm, price: parseFloat(e.target.value) || 0 })}
                            placeholder="0.00"
                            className="w-20 px-3 py-2 border-2 border-slate-200 rounded-lg focus:border-pink-500 outline-none text-sm"
                          />
                        </div>
                        <button
                          onClick={() => handleSaveAddon(group.id)}
                          disabled={!addonForm.name.trim() || saving}
                          className="p-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setShowAddonForm(null)
                            setAddonForm({ name: '', price: 0 })
                          }}
                          className="p-2 text-slate-600 hover:bg-slate-200 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowAddonForm(group.id)}
                        className="w-full p-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-pink-400 hover:text-pink-600 hover:bg-pink-50/50 transition-all flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Adicionar Item
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Dicas */}
        <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl p-6 border border-pink-200">
          <h4 className="font-bold text-pink-900 mb-3">💡 Dicas de uso:</h4>
          <ul className="space-y-2 text-sm text-pink-800">
            <li>• <strong>Frutas:</strong> Morango, Banana, Kiwi, Manga (com preços)</li>
            <li>• <strong>Caldas:</strong> Leite Condensado, Chocolate, Morango</li>
            <li>• <strong>Extras:</strong> Granola, Paçoca, Amendoim, Crocante</li>
            <li>• <strong>Coberturas:</strong> Nutella, Ovomaltine, Ninho</li>
            <li>• Marque como <strong>Obrigatório</strong> se o cliente deve escolher pelo menos 1</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
