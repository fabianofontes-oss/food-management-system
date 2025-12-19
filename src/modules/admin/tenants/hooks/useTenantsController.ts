'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  loadTenantsAction,
  createTenantAction,
  updateTenantAction,
  deleteTenantAction,
  changeTenantPlanAction
} from '../actions'
import type { Tenant } from '@/lib/superadmin/queries'
import type { Plan } from '@/lib/superadmin/plans'
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
      
      // Chamar Server Action para carregar dados privilegiados
      const result = await loadTenantsAction()
      
      if (!result.success) {
        alert(result.error || 'Erro ao carregar tenants')
        return
      }
      
      setPlans(result.plans || [])
      
      // Buscar contagem de stores usando client Supabase (protegido por RLS)
      const supabase = createClient()
      const tenantsWithCount = await Promise.all(
        result.tenants.map(async (tenant: any) => {
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
      
      let result
      if (editingTenant) {
        result = await updateTenantAction(editingTenant.id, formData)
      } else {
        result = await createTenantAction(formData)
      }
      
      if (!result.success) {
        alert(result.error || 'Erro ao salvar tenant')
        return
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
      const result = await deleteTenantAction(id)
      
      if (!result.success) {
        alert(result.error || 'Erro ao excluir tenant')
        return
      }
      
      await loadTenants()
    } catch (err) {
      console.error('Erro ao excluir tenant:', err)
      alert('Erro ao excluir tenant')
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
      
      const result = await changeTenantPlanAction(selectedTenantForPlan, selectedPlanId)
      
      if (!result.success) {
        alert(result.error || 'Erro ao alterar plano')
        return
      }
      
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
