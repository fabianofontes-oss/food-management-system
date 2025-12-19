'use server'

/**
 * Server Actions para gerenciamento de Tenants
 * 
 * SECURITY: Este arquivo usa 'use server' para garantir que as operações
 * privilegiadas nunca sejam executadas no cliente.
 */

import { revalidatePath } from 'next/cache'
import { getTenants, createTenant as createTenantQuery, updateTenant as updateTenantQuery, deleteTenant as deleteTenantQuery } from '@/lib/superadmin/queries'
import { getAllPlans, getAllTenantsWithPlans, setTenantPlan as setTenantPlanQuery } from '@/lib/superadmin/plans'
import type { TenantFormData } from './types/tenant.types'

/**
 * Carrega todos os tenants com contagem de lojas e informações de plano
 */
export async function loadTenantsAction() {
  try {
    const [tenants, tenantsWithPlans, plans] = await Promise.all([
      getTenants(),
      getAllTenantsWithPlans(),
      getAllPlans()
    ])

    const plansMap = new Map(
      tenantsWithPlans.map((t: any) => [t.tenant_id, { plan_name: t.plan_name, plan_slug: t.plan_slug }])
    )

    // Note: Store count will be fetched on the client using regular Supabase client (RLS protected)
    const tenantsWithPlanInfo = tenants.map((tenant: any) => {
      const planInfo = plansMap.get(tenant.id)
      return {
        ...tenant,
        plan_name: planInfo?.plan_name || null,
        plan_slug: planInfo?.plan_slug || null
      }
    })

    return {
      success: true,
      tenants: tenantsWithPlanInfo,
      plans: plans.filter((p: any) => p.is_active)
    }
  } catch (error: any) {
    console.error('Erro ao carregar tenants:', error)
    return {
      success: false,
      error: error.message || 'Erro ao carregar tenants'
    }
  }
}

/**
 * Cria um novo tenant
 */
export async function createTenantAction(data: TenantFormData) {
  try {
    const tenantData = {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      document: data.document || null,
      document_type: data.document_type,
      responsible_name: data.responsible_name || null,
      address: data.address || null,
      city: data.city || null,
      state: data.state || null,
      cep: data.cep || null,
      status: data.status,
      billing_day: data.billing_day,
      notes: data.notes || null
    }

    await createTenantQuery(tenantData as any)
    revalidatePath('/admin/tenants')

    return { success: true }
  } catch (error: any) {
    console.error('Erro ao criar tenant:', error)
    return {
      success: false,
      error: error.message || 'Erro ao criar tenant'
    }
  }
}

/**
 * Atualiza um tenant existente
 */
export async function updateTenantAction(id: string, data: TenantFormData) {
  try {
    const tenantData = {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      document: data.document || null,
      document_type: data.document_type,
      responsible_name: data.responsible_name || null,
      address: data.address || null,
      city: data.city || null,
      state: data.state || null,
      cep: data.cep || null,
      status: data.status,
      billing_day: data.billing_day,
      notes: data.notes || null
    }

    await updateTenantQuery(id, tenantData as any)
    revalidatePath('/admin/tenants')

    return { success: true }
  } catch (error: any) {
    console.error('Erro ao atualizar tenant:', error)
    return {
      success: false,
      error: error.message || 'Erro ao atualizar tenant'
    }
  }
}

/**
 * Deleta um tenant
 */
export async function deleteTenantAction(id: string) {
  try {
    await deleteTenantQuery(id)
    revalidatePath('/admin/tenants')

    return { success: true }
  } catch (error: any) {
    console.error('Erro ao deletar tenant:', error)
    return {
      success: false,
      error: error.message || 'Erro ao deletar tenant. Verifique se não há lojas vinculadas.'
    }
  }
}

/**
 * Altera o plano de um tenant
 */
export async function changeTenantPlanAction(tenantId: string, planId: string) {
  try {
    await setTenantPlanQuery(tenantId, planId)
    revalidatePath('/admin/tenants')

    return { success: true }
  } catch (error: any) {
    console.error('Erro ao alterar plano:', error)
    return {
      success: false,
      error: error.message || 'Erro ao alterar plano do tenant'
    }
  }
}
