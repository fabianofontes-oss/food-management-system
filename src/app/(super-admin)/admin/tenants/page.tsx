'use client'

import { useEffect, useState } from 'react'
import { Building2, Plus, Edit, Trash2, Store, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getTenants, createTenant, updateTenant, deleteTenant, type Tenant } from '@/lib/superadmin/queries'
import { createClient } from '@/lib/superadmin/queries'

type TenantWithStoreCount = Tenant & {
  stores_count: number
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<TenantWithStoreCount[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: ''
  })

  useEffect(() => {
    loadTenants()
  }, [])

  async function loadTenants() {
    try {
      setLoading(true)
      const data = await getTenants()
      
      const supabase = createClient()
      const tenantsWithCount = await Promise.all(
        data.map(async (tenant) => {
          const { count } = await supabase
            .from('stores')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenant.id)
          
          return {
            ...tenant,
            stores_count: count || 0
          }
        })
      )
      
      setTenants(tenantsWithCount)
    } catch (err) {
      console.error('Erro ao carregar tenants:', err)
      alert('Erro ao carregar tenants')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    try {
      setSubmitting(true)
      
      if (editingTenant) {
        await updateTenant(editingTenant.id, { name: formData.name })
      } else {
        await createTenant({ name: formData.name })
      }
      
      await loadTenants()
      setFormData({ name: '' })
      setShowForm(false)
      setEditingTenant(null)
    } catch (err) {
      console.error('Erro ao salvar tenant:', err)
      alert('Erro ao salvar tenant')
    } finally {
      setSubmitting(false)
    }
  }

  function handleEdit(tenant: Tenant) {
    setEditingTenant(tenant)
    setFormData({ name: tenant.name })
    setShowForm(true)
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este tenant?')) return
    
    try {
      await deleteTenant(id)
      await loadTenants()
    } catch (err) {
      console.error('Erro ao excluir tenant:', err)
      alert('Erro ao excluir tenant. Verifique se não há lojas vinculadas.')
    }
  }

  function handleCancel() {
    setShowForm(false)
    setEditingTenant(null)
    setFormData({ name: '' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando tenants...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Gestão de Tenants</h1>
          <p className="text-gray-600 mt-1">Multi-Tenant - Gerenciar Redes e Empresas</p>
        </div>
        {/* Stats Cards */}
        <div className="grid sm:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Building2 className="w-8 h-8 text-indigo-600" />
              <span className="text-3xl font-bold text-gray-900">{tenants.length}</span>
            </div>
            <div className="text-gray-600">Total de Tenants</div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Store className="w-8 h-8 text-green-600" />
              <span className="text-3xl font-bold text-gray-900">
                {tenants.reduce((sum, t) => sum + t.stores_count, 0)}
              </span>
            </div>
            <div className="text-gray-600">Total de Lojas</div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Building2 className="w-8 h-8 text-blue-600" />
              <span className="text-3xl font-bold text-gray-900">
                {tenants.length}
              </span>
            </div>
            <div className="text-gray-600">Redes Cadastradas</div>
          </div>
        </div>

        {/* Add Tenant Button */}
        <div className="mb-6">
          <Button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800"
          >
            <Plus className="w-5 h-5 mr-2" />
            Adicionar Novo Tenant
          </Button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-6">
              {editingTenant ? 'Editar Tenant' : 'Novo Tenant'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nome do Tenant *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ name: e.target.value })}
                  placeholder="Ex: Rede Açaí Premium"
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                  required
                  disabled={submitting}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    editingTenant ? 'Salvar Alterações' : 'Criar Tenant'
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

        {/* Tenants List */}
        <div className="space-y-4">
          {tenants.map((tenant) => (
            <div key={tenant.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Building2 className="w-6 h-6 text-indigo-600" />
                    <h3 className="text-2xl font-bold text-gray-900">{tenant.name}</h3>
                  </div>
                  
                  <div className="space-y-2 text-gray-600">
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4" />
                      <span className="text-sm font-semibold">{tenant.stores_count} loja(s) vinculada(s)</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Criado em: {new Date(tenant.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(tenant)}
                    className="p-3 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                    title="Editar"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(tenant.id)}
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

        {tenants.length === 0 && (
          <div className="text-center py-16">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Nenhum tenant cadastrado</p>
            <p className="text-gray-400 mt-2">Clique em "Adicionar Novo Tenant" para começar</p>
          </div>
        )}
      </div>
    </div>
  )
}
