import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ) as any
}

export type Tenant = Database['public']['Tables']['tenants']['Row']
export type TenantInsert = Database['public']['Tables']['tenants']['Insert']
export type TenantUpdate = Database['public']['Tables']['tenants']['Update']

export type Store = Database['public']['Tables']['stores']['Row']
export type StoreInsert = Database['public']['Tables']['stores']['Insert']
export type StoreUpdate = Database['public']['Tables']['stores']['Update']

export type StoreWithTenant = Store & {
  tenant: Tenant
}

async function attachTenantsToStores(stores: Store[]): Promise<StoreWithTenant[]> {
  const supabase = createClient()

  const tenantIds = Array.from(new Set(stores.map((s) => s.tenant_id).filter(Boolean)))
  if (tenantIds.length === 0) {
    return []
  }

  const { data: tenants, error: tenantsError } = await supabase
    .from('tenants')
    .select('*')
    .in('id', tenantIds)

  if (tenantsError) throw tenantsError

  const tenantsMap = new Map(((tenants || []) as Tenant[]).map((t) => [t.id, t]))

  return stores.map((store) => {
    const tenant = tenantsMap.get(store.tenant_id)
    if (!tenant) {
      return {
        ...store,
        tenant: {
          id: store.tenant_id,
          name: 'Tenant desconhecido',
          country: 'BR',
          language: 'pt-BR',
          currency: 'BRL',
          timezone: 'America/Sao_Paulo',
          created_at: new Date(0).toISOString(),
          updated_at: new Date(0).toISOString(),
        },
      }
    }
    return {
      ...store,
      tenant,
    }
  })
}

export async function getTenants() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getTenantById(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createTenant(tenant: TenantInsert) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tenants')
    .insert(tenant as any)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateTenant(id: string, updates: TenantUpdate) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tenants')
    .update(updates as any)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteTenant(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('tenants')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function getStores() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return attachTenantsToStores(data || [])
}

export async function getStoreById(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  const withTenant = await attachTenantsToStores([data])
  return withTenant[0]
}

export async function createStore(store: StoreInsert) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('stores')
    .insert(store as any)
    .select('*')
    .single()

  if (error) throw error
  const withTenant = await attachTenantsToStores([data])
  return withTenant[0]
}

export async function updateStore(id: string, updates: StoreUpdate) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('stores')
    .update(updates as any)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  const withTenant = await attachTenantsToStores([data])
  return withTenant[0]
}

export async function deleteStore(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('stores')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function getStoresCount() {
  const supabase = createClient()
  const { count, error } = await supabase
    .from('stores')
    .select('*', { count: 'exact', head: true })

  if (error) throw error
  return count || 0
}

export async function getTenantsCount() {
  const supabase = createClient()
  const { count, error } = await supabase
    .from('tenants')
    .select('*', { count: 'exact', head: true })

  if (error) throw error
  return count || 0
}

export async function getRecentStores(limit = 10) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return attachTenantsToStores(data || [])
}
