'use client'

import { useState } from 'react'
import { Building2, Plus, Edit, Trash2, Store, Users, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Tenant {
  id: string
  name: string
  slug: string
  is_active: boolean
  stores_count: number
  created_at: string
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([
    {
      id: '1',
      name: 'Tenant Demo',
      slug: 'demo',
      is_active: true,
      stores_count: 1,
      created_at: '2024-01-01'
    }
  ])

  const [showForm, setShowForm] = useState(false)
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    is_active: true
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingTenant) {
      // Editar tenant existente
      setTenants(tenants.map(t => 
        t.id === editingTenant.id 
          ? { ...t, ...formData }
          : t
      ))
    } else {
      // Criar novo tenant
      const newTenant: Tenant = {
        id: Date.now().toString(),
        ...formData,
        stores_count: 0,
        created_at: new Date().toISOString()
      }
      setTenants([...tenants, newTenant])
    }

    // Reset form
    setFormData({ name: '', slug: '', is_active: true })
    setShowForm(false)
    setEditingTenant(null)
  }

  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant)
    setFormData({
      name: tenant.name,
      slug: tenant.slug,
      is_active: tenant.is_active
    })
    setShowForm(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este tenant?')) {
      setTenants(tenants.filter(t => t.id !== id))
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingTenant(null)
    setFormData({ name: '', slug: '', is_active: true })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <header className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-4 shadow-lg">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold">Gestão de Tenants</h1>
          <p className="text-indigo-100 mt-1">Multi-Tenant - Gerenciar Redes e Empresas</p>
        </div>
      </header>

      <div className="container mx-auto p-4 max-w-6xl">
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
              <Users className="w-8 h-8 text-blue-600" />
              <span className="text-3xl font-bold text-gray-900">
                {tenants.filter(t => t.is_active).length}
              </span>
            </div>
            <div className="text-gray-600">Tenants Ativos</div>
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
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Rede Açaí Premium"
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Slug (URL amigável) *
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  placeholder="Ex: acai-premium"
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Usado na URL. Apenas letras minúsculas, números e hífens.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <label htmlFor="is_active" className="text-sm font-semibold text-gray-700">
                  Tenant Ativo
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800"
                >
                  {editingTenant ? 'Salvar Alterações' : 'Criar Tenant'}
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

        {/* Tenants List */}
        <div className="space-y-4">
          {tenants.map((tenant) => (
            <div key={tenant.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Building2 className="w-6 h-6 text-indigo-600" />
                    <h3 className="text-2xl font-bold text-gray-900">{tenant.name}</h3>
                    {tenant.is_active ? (
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">
                        Ativo
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded-full">
                        Inativo
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-2 text-gray-600">
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      <span className="font-mono text-sm">Slug: {tenant.slug}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4" />
                      <span className="text-sm">{tenant.stores_count} loja(s)</span>
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
