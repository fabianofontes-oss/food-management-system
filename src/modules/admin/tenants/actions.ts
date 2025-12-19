'use server'

/**
 * Server Actions para gerenciamento de Tenants
 * 
 * SECURITY: Este arquivo usa 'use server' para garantir que as operações
 * privilegiadas nunca sejam executadas no cliente.
 * 
 * P0.1 HARDENING: Todas as actions agora verificam autenticação via requireSuperAdmin()
 * e registram audit logs para rastreabilidade.
 */

import { revalidatePath } from 'next/cache'
import { getTenants, createTenant as createTenantQuery, updateTenant as updateTenantQuery, deleteTenant as deleteTenantQuery } from '@/lib/superadmin/queries'
import { getAllPlans, getAllTenantsWithPlans, setTenantPlan as setTenantPlanQuery } from '@/lib/superadmin/plans'
import { requireSuperAdmin } from '@/lib/superadmin/guard'
import { logCreate, logUpdate, logDelete, logChangePlan } from '@/lib/superadmin/audit'
import type { TenantFormData } from './types/tenant.types'

/**
 * Carrega todos os tenants com contagem de lojas e informações de plano
 */
export async function loadTenantsAction() {
  // P0.1: Verificar autenticação
  const authResult = await requireSuperAdmin()
  if (!authResult.success) {
    return {
      success: false,
      error: authResult.error || 'Acesso não autorizado'
    }
  }

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
  // P0.1: Verificar autenticação
  const authResult = await requireSuperAdmin()
  if (!authResult.success) {
    return {
      success: false,
      error: authResult.error || 'Acesso não autorizado'
    }
  }

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

    const newTenant = await createTenantQuery(tenantData as any)
    
    // P0.2: Registrar audit log
    await logCreate('tenant', newTenant.id, data.name, {
      email: data.email,
      document: data.document,
      status: data.status
    })
    
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
  // P0.1: Verificar autenticação
  const authResult = await requireSuperAdmin()
  if (!authResult.success) {
    return {
      success: false,
      error: authResult.error || 'Acesso não autorizado'
    }
  }

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
    
    // P0.2: Registrar audit log
    await logUpdate('tenant', id, data.name, {
      status: data.status,
      email: data.email,
      billing_day: data.billing_day
    })
    
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
  // P0.1: Verificar autenticação
  const authResult = await requireSuperAdmin()
  if (!authResult.success) {
    return {
      success: false,
      error: authResult.error || 'Acesso não autorizado'
    }
  }

  try {
    // Buscar nome do tenant antes de deletar (para audit log)
    const { getTenants } = await import('@/lib/superadmin/queries')
    const tenants = await getTenants()
    const tenant = tenants.find((t: any) => t.id === id)
    const tenantName = tenant?.name || 'Tenant desconhecido'
    
    await deleteTenantQuery(id)
    
    // P0.2: Registrar audit log
    await logDelete('tenant', id, tenantName, {
      cascade: true,
      warning: 'Deletou todas as stores e dados relacionados'
    })
    
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
  // P0.1: Verificar autenticação
  const authResult = await requireSuperAdmin()
  if (!authResult.success) {
    return {
      success: false,
      error: authResult.error || 'Acesso não autorizado'
    }
  }

  try {
    // Buscar dados para audit log
    const { getTenants } = await import('@/lib/superadmin/queries')
    const { getTenantCurrentPlan } = await import('@/lib/superadmin/plans')
    
    const tenants = await getTenants()
    const tenant = tenants.find((t: any) => t.id === tenantId)
    const tenantName = tenant?.name || 'Tenant desconhecido'
    
    const currentPlan = await getTenantCurrentPlan(tenantId)
    const oldPlanId = currentPlan?.plan_id || null
    
    await setTenantPlanQuery(tenantId, planId)
    
    // P0.2: Registrar audit log
    await logChangePlan(tenantId, tenantName, oldPlanId, planId)
    
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
