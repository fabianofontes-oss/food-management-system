import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export type Plan = Database['public']['Tables']['plans']['Row']
export type PlanInsert = Database['public']['Tables']['plans']['Insert']
export type PlanUpdate = Database['public']['Tables']['plans']['Update']

export type TenantSubscription = Database['public']['Tables']['tenant_subscriptions']['Row']
export type TenantSubscriptionInsert = Database['public']['Tables']['tenant_subscriptions']['Insert']
export type TenantSubscriptionUpdate = Database['public']['Tables']['tenant_subscriptions']['Update']

export type PlanWithTenantCount = Plan & {
  tenant_count: number
}

export type TenantWithPlan = {
  tenant_id: string
  tenant_name: string
  plan_id: string | null
  plan_name: string | null
  plan_slug: string | null
  subscription_status: string | null
}

export async function getAllPlans(): Promise<Plan[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Erro ao buscar planos:', error)
    throw new Error('Não foi possível carregar os planos')
  }
}

export async function getPlanById(id: string): Promise<Plan | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Erro ao buscar plano:', error)
    throw new Error('Não foi possível carregar o plano')
  }
}

export async function createPlan(input: PlanInsert): Promise<Plan> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('plans')
      .insert(input as any)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Erro ao criar plano:', error)
    throw new Error('Não foi possível criar o plano')
  }
}

export async function updatePlan(id: string, input: PlanUpdate): Promise<Plan> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('plans')
      .update(input as any)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Erro ao atualizar plano:', error)
    throw new Error('Não foi possível atualizar o plano')
  }
}

export async function deletePlan(id: string): Promise<void> {
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from('plans')
      .delete()
      .eq('id', id)

    if (error) throw error
  } catch (error) {
    console.error('Erro ao deletar plano:', error)
    throw new Error('Não foi possível deletar o plano. Verifique se não há tenants vinculados.')
  }
}

export async function getTenantCurrentPlan(tenantId: string): Promise<TenantWithPlan | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('tenant_subscriptions')
      .select(`
        *,
        plan:plans(*),
        tenant:tenants(*)
      `)
      .eq('tenant_id', tenantId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    if (!data) return null

    const plan = data.plan as any
    const tenant = data.tenant as any

    return {
      tenant_id: tenantId,
      tenant_name: tenant?.name || '',
      plan_id: plan?.id || null,
      plan_name: plan?.name || null,
      plan_slug: plan?.slug || null,
      subscription_status: data.status
    }
  } catch (error) {
    console.error('Erro ao buscar plano do tenant:', error)
    return null
  }
}

export async function getAllTenantsWithPlans(): Promise<TenantWithPlan[]> {
  try {
    const supabase = createClient()
    
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id, name')
      .order('created_at', { ascending: false })

    if (tenantsError) throw tenantsError

    const { data: subscriptions, error: subsError } = await supabase
      .from('tenant_subscriptions')
      .select(`
        tenant_id,
        status,
        plan:plans(id, name, slug)
      `)

    if (subsError) throw subsError

    const subscriptionsMap = new Map(
      (subscriptions || []).map(sub => {
        const plan = sub.plan as any
        return [
          sub.tenant_id,
          {
            plan_id: plan?.id || null,
            plan_name: plan?.name || null,
            plan_slug: plan?.slug || null,
            status: sub.status
          }
        ]
      })
    )

    return (tenants || []).map(tenant => {
      const subscription = subscriptionsMap.get(tenant.id)
      return {
        tenant_id: tenant.id,
        tenant_name: tenant.name,
        plan_id: subscription?.plan_id || null,
        plan_name: subscription?.plan_name || null,
        plan_slug: subscription?.plan_slug || null,
        subscription_status: subscription?.status || null
      }
    })
  } catch (error) {
    console.error('Erro ao buscar tenants com planos:', error)
    throw new Error('Não foi possível carregar os tenants')
  }
}

export async function setTenantPlan(tenantId: string, planId: string): Promise<void> {
  try {
    const supabase = createClient()
    
    const { data: existing } = await supabase
      .from('tenant_subscriptions')
      .select('id')
      .eq('tenant_id', tenantId)
      .single()

    if (existing) {
      const { error } = await supabase
        .from('tenant_subscriptions')
        .update({
          plan_id: planId,
          updated_at: new Date().toISOString()
        } as any)
        .eq('tenant_id', tenantId)

      if (error) throw error
    } else {
      const { error } = await supabase
        .from('tenant_subscriptions')
        .insert({
          tenant_id: tenantId,
          plan_id: planId,
          status: 'active',
          renew_period: 'month',
          current_period_start: new Date().toISOString()
        } as any)

      if (error) throw error
    }
  } catch (error) {
    console.error('Erro ao definir plano do tenant:', error)
    throw new Error('Não foi possível alterar o plano do tenant')
  }
}

export async function getTenantsByPlan(planId: string): Promise<Array<{id: string, name: string, created_at: string}>> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('tenant_subscriptions')
      .select(`
        tenant:tenants(id, name, created_at)
      `)
      .eq('plan_id', planId)

    if (error) throw error

    return (data || []).map(item => {
      const tenant = item.tenant as any
      return {
        id: tenant.id,
        name: tenant.name,
        created_at: tenant.created_at
      }
    })
  } catch (error) {
    console.error('Erro ao buscar tenants por plano:', error)
    throw new Error('Não foi possível carregar os tenants deste plano')
  }
}

export function formatPrice(cents: number, currency: string = 'BRL'): string {
  const value = cents / 100
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency
  }).format(value)
}
