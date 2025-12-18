'use server'

import { createClient } from '@/lib/supabase/server'
import { getDefaultPlanModules } from '@/lib/superadmin/plan-modules'

/**
 * Verifica se um módulo está disponível para uma loja específica
 * baseado no plano do tenant
 */
export async function checkModuleAccess(storeId: string, moduleId: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    
    // Buscar o tenant_id da loja
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('tenant_id')
      .eq('id', storeId)
      .single()
    
    if (storeError || !store) {
      console.error('Erro ao buscar loja:', storeError)
      return true // Em caso de erro, liberar acesso
    }
    
    // Buscar o plano do tenant
    const { data: subscription, error: subError } = await supabase
      .from('tenant_subscriptions')
      .select(`
        plan:plans(features)
      `)
      .eq('tenant_id', store.tenant_id)
      .single()
    
    if (subError || !subscription) {
      // Sem plano = acesso total (fallback)
      return true
    }
    
    const plan = subscription.plan as any
    const features = plan?.features as any
    
    if (!features?.modules || !Array.isArray(features.modules)) {
      // Sem módulos definidos = usar padrão (core)
      const defaultModules = getDefaultPlanModules()
      return defaultModules.includes(moduleId)
    }
    
    return features.modules.includes(moduleId)
  } catch (error) {
    console.error('Erro ao verificar acesso ao módulo:', error)
    return true // Em caso de erro, liberar acesso
  }
}

/**
 * Busca todos os módulos disponíveis para uma loja
 */
export async function getStoreModules(storeId: string): Promise<string[]> {
  try {
    const supabase = await createClient()
    
    // Buscar o tenant_id da loja
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('tenant_id')
      .eq('id', storeId)
      .single()
    
    if (storeError || !store) {
      console.error('Erro ao buscar loja:', storeError)
      return getDefaultPlanModules()
    }
    
    // Buscar o plano do tenant
    const { data: subscription, error: subError } = await supabase
      .from('tenant_subscriptions')
      .select(`
        plan:plans(features)
      `)
      .eq('tenant_id', store.tenant_id)
      .single()
    
    if (subError || !subscription) {
      // Sem plano = módulos padrão (core)
      return getDefaultPlanModules()
    }
    
    const plan = subscription.plan as any
    const features = plan?.features as any
    
    if (!features?.modules || !Array.isArray(features.modules)) {
      return getDefaultPlanModules()
    }
    
    return features.modules
  } catch (error) {
    console.error('Erro ao buscar módulos da loja:', error)
    return getDefaultPlanModules()
  }
}

/**
 * Busca módulos por slug da loja
 */
export async function getStoreModulesBySlug(slug: string): Promise<string[]> {
  try {
    const supabase = await createClient()
    
    // Buscar a loja pelo slug
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, tenant_id')
      .eq('slug', slug)
      .single()
    
    if (storeError || !store) {
      console.error('Erro ao buscar loja:', storeError)
      return getDefaultPlanModules()
    }
    
    return getStoreModules(store.id)
  } catch (error) {
    console.error('Erro ao buscar módulos da loja:', error)
    return getDefaultPlanModules()
  }
}
