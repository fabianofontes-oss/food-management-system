import { createClient } from '@/lib/supabase/server'

export type QAStoreData = {
  id: string
  slug: string
  name: string
  tenant_id: string
  settings: any
}

export type QATenantData = {
  id: string
  country: string
  language: string
  currency: string
  timezone: string
}

export type QACheckResult = {
  status: 'ok' | 'fail' | 'warning'
  message: string
}

export async function getStoreBySlug(slug: string): Promise<QAStoreData | null> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('stores')
      .select('id, slug, name, tenant_id, settings')
      .eq('slug', slug)
      .single()

    if (error || !data) return null
    
    return data as QAStoreData
  } catch {
    return null
  }
}

export async function getTenantById(tenantId: string): Promise<QATenantData | null> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('tenants')
      .select('id, country, language, currency, timezone')
      .eq('id', tenantId)
      .single()

    if (error || !data) return null
    
    return data as QATenantData
  } catch {
    return null
  }
}

export async function getLastOrderIdForStore(storeId: string): Promise<string | null> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('orders')
      .select('id')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) return null
    
    return data.id
  } catch {
    return null
  }
}

export async function getUserSession() {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session
  } catch {
    return null
  }
}

export async function userHasStoreAccess(storeId: string, userId: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('store_users')
      .select('id')
      .eq('store_id', storeId)
      .eq('user_id', userId)
      .single()

    return !error && !!data
  } catch {
    return false
  }
}

export async function checkStore(slug: string): Promise<QACheckResult> {
  const store = await getStoreBySlug(slug)
  
  if (!store) {
    return {
      status: 'fail',
      message: `Store "${slug}" não encontrada`
    }
  }
  
  return {
    status: 'ok',
    message: `Store "${store.name}" encontrada (ID: ${store.id})`
  }
}

export async function checkTenant(slug: string): Promise<QACheckResult> {
  const store = await getStoreBySlug(slug)
  
  if (!store) {
    return {
      status: 'fail',
      message: 'Store não encontrada'
    }
  }
  
  const tenant = await getTenantById(store.tenant_id)
  
  if (!tenant) {
    return {
      status: 'fail',
      message: 'Tenant não encontrado'
    }
  }
  
  return {
    status: 'ok',
    message: `i18n: ${tenant.country}/${tenant.language} | ${tenant.currency} | ${tenant.timezone}`
  }
}

export async function checkCheckoutMode(slug: string): Promise<QACheckResult> {
  const store = await getStoreBySlug(slug)
  
  if (!store || !store.settings) {
    return {
      status: 'warning',
      message: 'Settings não disponíveis'
    }
  }
  
  const mode = store.settings?.checkout?.mode || 'unknown'
  
  return {
    status: mode !== 'unknown' ? 'ok' : 'warning',
    message: `Checkout mode: ${mode}`
  }
}

export async function checkPayments(slug: string): Promise<QACheckResult> {
  const store = await getStoreBySlug(slug)
  
  if (!store || !store.settings) {
    return {
      status: 'warning',
      message: 'Settings não disponíveis'
    }
  }
  
  const payments = store.settings?.payments || {}
  const enabled = Object.entries(payments)
    .filter(([_, value]: [string, any]) => value?.enabled === true)
    .map(([key]) => key)
  
  if (enabled.length === 0) {
    return {
      status: 'warning',
      message: 'Nenhum método de pagamento habilitado'
    }
  }
  
  return {
    status: 'ok',
    message: `Pagamentos: ${enabled.join(', ')}`
  }
}

export async function checkUserSession(): Promise<QACheckResult> {
  const session = await getUserSession()
  
  if (!session) {
    return {
      status: 'warning',
      message: 'Usuário não autenticado'
    }
  }
  
  return {
    status: 'ok',
    message: `Autenticado: ${session.user.email}`
  }
}

export async function checkStoreAccess(slug: string): Promise<QACheckResult> {
  const session = await getUserSession()
  
  if (!session) {
    return {
      status: 'warning',
      message: 'Usuário não autenticado'
    }
  }
  
  const store = await getStoreBySlug(slug)
  
  if (!store) {
    return {
      status: 'fail',
      message: 'Store não encontrada'
    }
  }
  
  const hasAccess = await userHasStoreAccess(store.id, session.user.id)
  
  if (!hasAccess) {
    return {
      status: 'fail',
      message: 'Usuário não tem acesso a esta store'
    }
  }
  
  return {
    status: 'ok',
    message: 'Usuário tem acesso à store'
  }
}
