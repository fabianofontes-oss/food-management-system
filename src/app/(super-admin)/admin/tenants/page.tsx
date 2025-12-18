'use client'

import { useEffect, useState } from 'react'
import { Building2, Plus, Edit, Trash2, Store, Loader2, CreditCard, Info, Mail, Phone, FileText, MapPin, Calendar, AlertCircle, CheckCircle, Clock, Ban } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getTenants, createTenant, updateTenant, deleteTenant, type Tenant } from '@/lib/superadmin/queries'
import { createClient } from '@/lib/superadmin/queries'
import { getAllPlans, getAllTenantsWithPlans, setTenantPlan, type Plan, type TenantWithPlan } from '@/lib/superadmin/plans'

type TenantWithStoreCount = Tenant & {
  stores_count: number
  plan_name: string | null
  plan_slug: string | null
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<TenantWithStoreCount[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    document: '',
    document_type: 'cpf' as 'cpf' | 'cnpj',
    responsible_name: '',
    address: '',
    city: '',
    state: '',
    cep: '',
    status: 'active',
    billing_day: 1,
    notes: ''
  })
  
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [selectedTenantForPlan, setSelectedTenantForPlan] = useState<string | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<string>('')
  const [changingPlan, setChangingPlan] = useState(false)

  useEffect(() => {
    loadTenants()
  }, [])

  async function loadTenants() {
    try {
      setLoading(true)
      const [data, tenantsWithPlansData, plansData] = await Promise.all([
        getTenants(),
        getAllTenantsWithPlans(),
        getAllPlans()
      ])
      
      setPlans(plansData.filter(p => p.is_active))
      
      const plansMap = new Map(
        tenantsWithPlansData.map((t: any) => [t.tenant_id, { plan_name: t.plan_name, plan_slug: t.plan_slug }])
      )
      
      const supabase = createClient()
      const tenantsWithCount = await Promise.all(
        data.map(async (tenant: any) => {
          const { count } = await supabase
            .from('stores')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenant.id)
          
          const planInfo = plansMap.get(tenant.id)
          
          return {
            ...tenant,
            stores_count: count || 0,
            plan_name: planInfo?.plan_name || null,
            plan_slug: planInfo?.plan_slug || null
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
      
      const tenantData = {
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        document: formData.document || null,
        document_type: formData.document_type,
        responsible_name: formData.responsible_name || null,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        cep: formData.cep || null,
        status: formData.status,
        billing_day: formData.billing_day,
        notes: formData.notes || null
      }
      
      if (editingTenant) {
        await updateTenant(editingTenant.id, tenantData as any)
      } else {
        await createTenant(tenantData as any)
      }
      
      await loadTenants()
      resetForm()
      setShowForm(false)
      setEditingTenant(null)
    } catch (err) {
      console.error('Erro ao salvar tenant:', err)
      alert('Erro ao salvar tenant')
    } finally {
      setSubmitting(false)
    }
  }

  function resetForm() {
    setFormData({
      name: '',
      email: '',
      phone: '',
      document: '',
      document_type: 'cpf',
      responsible_name: '',
      address: '',
      city: '',
      state: '',
      cep: '',
      status: 'active',
      billing_day: 1,
      notes: ''
    })
  }

  function handleEdit(tenant: Tenant) {
    setEditingTenant(tenant)
    setFormData({
      name: tenant.name || '',
      email: (tenant as any).email || '',
      phone: (tenant as any).phone || '',
      document: (tenant as any).document || '',
      document_type: (tenant as any).document_type || 'cpf',
      responsible_name: (tenant as any).responsible_name || '',
      address: (tenant as any).address || '',
      city: (tenant as any).city || '',
      state: (tenant as any).state || '',
      cep: (tenant as any).cep || '',
      status: (tenant as any).status || 'active',
      billing_day: (tenant as any).billing_day || 1,
      notes: (tenant as any).notes || ''
    })
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
    resetForm()
  }
  
  function handleOpenPlanModal(tenantId: string, currentPlanId: string | null) {
    setSelectedTenantForPlan(tenantId)
    setSelectedPlanId(currentPlanId || '')
    setShowPlanModal(true)
  }
  
  async function handleChangePlan() {
    if (!selectedTenantForPlan || !selectedPlanId) return
    
    try {
      setChangingPlan(true)
      await setTenantPlan(selectedTenantForPlan, selectedPlanId)
      await loadTenants()
      setShowPlanModal(false)
      setSelectedTenantForPlan(null)
      setSelectedPlanId('')
    } catch (err) {
      console.error('Erro ao alterar plano:', err)
      alert('Erro ao alterar plano do tenant')
    } finally {
      setChangingPlan(false)
    }
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
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dados Básicos */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nome do Tenant *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Rede Açaí Premium"
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                    required
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nome do Responsável
                  </label>
                  <input
                    type="text"
                    value={formData.responsible_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, responsible_name: e.target.value }))}
                    placeholder="Ex: João da Silva"
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* Contato */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="contato@empresa.com"
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                    disabled={submitting}
                  />
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
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* Documento */}
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tipo Documento
                  </label>
                  <select
                    value={formData.document_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, document_type: e.target.value as 'cpf' | 'cnpj' }))}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                    disabled={submitting}
                  >
                    <option value="cpf">CPF</option>
                    <option value="cnpj">CNPJ</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {formData.document_type === 'cpf' ? 'CPF' : 'CNPJ'}
                  </label>
                  <input
                    type="text"
                    value={formData.document}
                    onChange={(e) => setFormData(prev => ({ ...prev, document: e.target.value }))}
                    placeholder={formData.document_type === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* Endereço */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Endereço
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Rua, número, bairro"
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                  disabled={submitting}
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Belo Horizonte"
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Estado
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value.toUpperCase().slice(0, 2) }))}
                    placeholder="MG"
                    maxLength={2}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    CEP
                  </label>
                  <input
                    type="text"
                    value={formData.cep}
                    onChange={(e) => setFormData(prev => ({ ...prev, cep: e.target.value }))}
                    placeholder="32.010-370"
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* Status e Billing */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                    disabled={submitting}
                  >
                    <option value="active">✅ Ativo</option>
                    <option value="trial">⏳ Trial (Período de Teste)</option>
                    <option value="suspended">⚠️ Suspenso</option>
                    <option value="cancelled">❌ Cancelado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Dia de Vencimento
                  </label>
                  <select
                    value={formData.billing_day}
                    onChange={(e) => setFormData(prev => ({ ...prev, billing_day: parseInt(e.target.value) }))}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                    disabled={submitting}
                  >
                    {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                      <option key={day} value={day}>Dia {day}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Anotações */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Anotações Internas
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Observações sobre o cliente..."
                  rows={3}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
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
          {tenants.map((tenant) => {
            const tenantData = tenant as any
            const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
              active: { label: 'Ativo', color: 'bg-green-100 text-green-700', icon: CheckCircle },
              trial: { label: 'Trial', color: 'bg-blue-100 text-blue-700', icon: Clock },
              suspended: { label: 'Suspenso', color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle },
              cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700', icon: Ban }
            }
            const status = statusConfig[tenantData.status] || statusConfig.active
            const StatusIcon = status.icon

            return (
              <div key={tenant.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Building2 className="w-6 h-6 text-indigo-600" />
                      <h3 className="text-2xl font-bold text-gray-900">{tenant.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${status.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4 text-gray-600">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Store className="w-4 h-4" />
                          <span className="text-sm font-semibold">{tenant.stores_count} loja(s)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          <span className="text-sm">
                            {tenant.plan_name ? (
                              <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                                {tenant.plan_name}
                              </span>
                            ) : (
                              <span className="text-gray-400">Sem plano</span>
                            )}
                          </span>
                        </div>
                        {tenantData.responsible_name && (
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            <span className="text-sm">{tenantData.responsible_name}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        {tenantData.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            <span className="text-sm">{tenantData.email}</span>
                          </div>
                        )}
                        {tenantData.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            <span className="text-sm">{tenantData.phone}</span>
                          </div>
                        )}
                        {(tenantData.city || tenantData.state) && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span className="text-sm">
                              {tenantData.city}{tenantData.city && tenantData.state ? ' - ' : ''}{tenantData.state}
                            </span>
                          </div>
                        )}
                        {tenantData.billing_day && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm">Vencimento: Dia {tenantData.billing_day}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-500">
                      Criado em: {new Date(tenant.created_at).toLocaleDateString('pt-BR')}
                      {tenantData.document && (
                        <span className="ml-4">
                          {tenantData.document_type?.toUpperCase()}: {tenantData.document}
                        </span>
                      )}
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
                      onClick={() => handleOpenPlanModal(tenant.id, null)}
                      className="p-3 text-green-600 hover:bg-green-50 rounded-xl transition-colors"
                      title="Alterar Plano"
                    >
                      <CreditCard className="w-5 h-5" />
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
            )
          })}
        </div>

        {tenants.length === 0 && (
          <div className="text-center py-16">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Nenhum tenant cadastrado</p>
            <p className="text-gray-400 mt-2">Clique em "Adicionar Novo Tenant" para começar</p>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">Informação sobre Planos</p>
            <p>
              No futuro, o plano poderá controlar quais módulos estão disponíveis (PDV, Cozinha, Delivery, CRM, etc.). 
              Por enquanto, ele é apenas informativo e usado para organização e billing.
            </p>
          </div>
        </div>

        {/* Modal de Alterar Plano */}
        {showPlanModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Alterar Plano do Tenant</h3>
              
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Selecione o Plano
                </label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                  disabled={changingPlan}
                >
                  <option value="">Selecione um plano...</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} - R$ {(plan.price_monthly_cents / 100).toFixed(2)}/mês
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleChangePlan}
                  disabled={!selectedPlanId || changingPlan}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50"
                >
                  {changingPlan ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Alterando...
                    </>
                  ) : (
                    'Confirmar'
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setShowPlanModal(false)
                    setSelectedTenantForPlan(null)
                    setSelectedPlanId('')
                  }}
                  disabled={changingPlan}
                  variant="outline"
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
