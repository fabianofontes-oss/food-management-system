'use client'

import { useEffect, useState, useCallback } from 'react'
import { getTenants, createTenant, updateTenant, deleteTenant, type Tenant, createClient } from '@/lib/superadmin/queries'
import { getAllPlans, getAllTenantsWithPlans, setTenantPlan, type Plan } from '@/lib/superadmin/plans'
import { 
  type TenantWithStoreCount, 
  type TenantFormData, 
  INITIAL_FORM_DATA 
} from '../types/tenant.types'

export function useTenantsController() {
  // === ESTADO PRINCIPAL ===
  const [tenants, setTenants] = useState<TenantWithStoreCount[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  
  // === ESTADO DO FORMULÁRIO ===
  const [showForm, setShowForm] = useState(false)
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState<TenantFormData>(INITIAL_FORM_DATA)
  
  // === ESTADO DO MODAL DE PLANOS ===
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [selectedTenantForPlan, setSelectedTenantForPlan] = useState<string | null>(null)
  const [selectedPlanId, setSelectedPlanId] = useState<string>('')
  const [changingPlan, setChangingPlan] = useState(false)

  // === COMPUTED VALUES ===
  const totalStores = tenants.reduce((sum, t) => sum + t.stores_count, 0)

  // === CARREGAR DADOS ===
  const loadTenants = useCallback(async () => {
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
  }, [])

  useEffect(() => {
    loadTenants()
  }, [loadTenants])

  // === HANDLERS DO FORMULÁRIO ===
  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_DATA)
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
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
  }, [formData, editingTenant, loadTenants, resetForm])

  const handleEdit = useCallback((tenant: Tenant) => {
    setEditingTenant(tenant)
    const t = tenant as any
    setFormData({
      name: t.name || '',
      email: t.email || '',
      phone: t.phone || '',
      document: t.document || '',
      document_type: t.document_type || 'cpf',
      responsible_name: t.responsible_name || '',
      address: t.address || '',
      city: t.city || '',
      state: t.state || '',
      cep: t.cep || '',
      status: t.status || 'active',
      billing_day: t.billing_day || 1,
      notes: t.notes || ''
    })
    setShowForm(true)
  }, [])

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este tenant?')) return
    
    try {
      await deleteTenant(id)
      await loadTenants()
    } catch (err) {
      console.error('Erro ao excluir tenant:', err)
      alert('Erro ao excluir tenant. Verifique se não há lojas vinculadas.')
    }
  }, [loadTenants])

  const handleCancel = useCallback(() => {
    setShowForm(false)
    setEditingTenant(null)
    resetForm()
  }, [resetForm])

  const updateFormField = useCallback(<K extends keyof TenantFormData>(
    field: K, 
    value: TenantFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  // === HANDLERS DO MODAL DE PLANOS ===
  const handleOpenPlanModal = useCallback((tenantId: string) => {
    setSelectedTenantForPlan(tenantId)
    setSelectedPlanId('')
    setShowPlanModal(true)
  }, [])

  const handleClosePlanModal = useCallback(() => {
    setShowPlanModal(false)
    setSelectedTenantForPlan(null)
    setSelectedPlanId('')
  }, [])

  const handleChangePlan = useCallback(async () => {
    if (!selectedTenantForPlan || !selectedPlanId) return
    
    try {
      setChangingPlan(true)
      await setTenantPlan(selectedTenantForPlan, selectedPlanId)
      await loadTenants()
      handleClosePlanModal()
    } catch (err) {
      console.error('Erro ao alterar plano:', err)
      alert('Erro ao alterar plano do tenant')
    } finally {
      setChangingPlan(false)
    }
  }, [selectedTenantForPlan, selectedPlanId, loadTenants, handleClosePlanModal])

  return {
    // Estado
    tenants,
    plans,
    loading,
    totalStores,
    
    // Formulário
    showForm,
    setShowForm,
    editingTenant,
    submitting,
    formData,
    updateFormField,
    handleSubmit,
    handleEdit,
    handleDelete,
    handleCancel,
    
    // Modal de Planos
    showPlanModal,
    selectedPlanId,
    setSelectedPlanId,
    changingPlan,
    handleOpenPlanModal,
    handleClosePlanModal,
    handleChangePlan
  }
}
