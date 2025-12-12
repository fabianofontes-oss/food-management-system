import { createClient } from '@/lib/supabase/server'

export type DateRange = 7 | 14 | 30

export type AnalyticsMetrics = {
  activeStores: number
  ordersToday: number
  ordersInRange: number
  gmvToday: number
  gmvInRange: number
}

export type TopStore = {
  store_id: string
  store_name: string
  store_slug: string
  tenant_name: string
  orders_count: number
  gmv: number
}

export type DailyTrend = {
  date: string
  orders_count: number
  gmv: number
}

export async function getAnalyticsMetrics(days: DateRange = 7): Promise<AnalyticsMetrics> {
  const supabase = await createClient()
  
  // Calculate date ranges (UTC - limitation noted)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const rangeStart = new Date(today)
  rangeStart.setDate(rangeStart.getDate() - days)

  // Get orders in range
  const { data: ordersInRange } = await supabase
    .from('orders')
    .select('id, total_amount, created_at, store_id')
    .gte('created_at', rangeStart.toISOString())

  // Get orders today
  const { data: ordersToday } = await supabase
    .from('orders')
    .select('id, total_amount')
    .gte('created_at', today.toISOString())

  // Calculate active stores (stores with at least 1 order in range)
  const activeStoreIds = new Set(ordersInRange?.map(o => o.store_id) || [])

  // Calculate GMV
  const gmvInRange = ordersInRange?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0
  const gmvToday = ordersToday?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0

  return {
    activeStores: activeStoreIds.size,
    ordersToday: ordersToday?.length || 0,
    ordersInRange: ordersInRange?.length || 0,
    gmvToday,
    gmvInRange
  }
}

export async function getTopStores(days: DateRange = 7, limit: number = 10): Promise<TopStore[]> {
  const supabase = await createClient()
  
  const rangeStart = new Date()
  rangeStart.setDate(rangeStart.getDate() - days)

  // Get orders with store and tenant info
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      store_id,
      total_amount,
      stores!inner (
        id,
        name,
        slug,
        tenant_id,
        tenants!inner (
          name
        )
      )
    `)
    .gte('created_at', rangeStart.toISOString())

  if (!orders) return []

  // Aggregate by store
  const storeMap = new Map<string, TopStore>()

  orders.forEach((order: any) => {
    const store = order.stores
    const storeId = store.id

    if (!storeMap.has(storeId)) {
      storeMap.set(storeId, {
        store_id: storeId,
        store_name: store.name,
        store_slug: store.slug,
        tenant_name: store.tenants?.name || 'N/A',
        orders_count: 0,
        gmv: 0
      })
    }

    const storeData = storeMap.get(storeId)!
    storeData.orders_count++
    storeData.gmv += order.total_amount || 0
  })

  // Convert to array and sort by GMV
  return Array.from(storeMap.values())
    .sort((a, b) => b.gmv - a.gmv)
    .slice(0, limit)
}

export async function getDailyTrend(days: DateRange = 14): Promise<DailyTrend[]> {
  const supabase = await createClient()
  
  const rangeStart = new Date()
  rangeStart.setDate(rangeStart.getDate() - days)

  // Get all orders in range
  const { data: orders } = await supabase
    .from('orders')
    .select('created_at, total_amount')
    .gte('created_at', rangeStart.toISOString())
    .order('created_at', { ascending: true })

  if (!orders) return []

  // Aggregate by day
  const dayMap = new Map<string, DailyTrend>()

  orders.forEach((order) => {
    const date = new Date(order.created_at)
    const dateKey = date.toISOString().split('T')[0] // YYYY-MM-DD

    if (!dayMap.has(dateKey)) {
      dayMap.set(dateKey, {
        date: dateKey,
        orders_count: 0,
        gmv: 0
      })
    }

    const dayData = dayMap.get(dateKey)!
    dayData.orders_count++
    dayData.gmv += order.total_amount || 0
  })

  // Fill missing days with zeros
  const result: DailyTrend[] = []
  for (let i = 0; i < days; i++) {
    const date = new Date(rangeStart)
    date.setDate(date.getDate() + i)
    const dateKey = date.toISOString().split('T')[0]

    result.push(dayMap.get(dateKey) || {
      date: dateKey,
      orders_count: 0,
      gmv: 0
    })
  }

  return result
}

export async function getAllTenants() {
  const supabase = await createClient()
  
  const { data: tenants } = await supabase
    .from('tenants')
    .select('id, name')
    .order('name')

  return tenants || []
}

export async function getAnalyticsByTenant(tenantId: string, days: DateRange = 7) {
  const supabase = await createClient()
  
  const rangeStart = new Date()
  rangeStart.setDate(rangeStart.getDate() - days)

  // Get stores for this tenant
  const { data: stores } = await supabase
    .from('stores')
    .select('id')
    .eq('tenant_id', tenantId)

  if (!stores || stores.length === 0) {
    return {
      activeStores: 0,
      ordersToday: 0,
      ordersInRange: 0,
      gmvToday: 0,
      gmvInRange: 0
    }
  }

  const storeIds = stores.map(s => s.id)

  // Get orders for these stores
  const { data: ordersInRange } = await supabase
    .from('orders')
    .select('id, total_amount, created_at, store_id')
    .in('store_id', storeIds)
    .gte('created_at', rangeStart.toISOString())

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data: ordersToday } = await supabase
    .from('orders')
    .select('id, total_amount')
    .in('store_id', storeIds)
    .gte('created_at', today.toISOString())

  const activeStoreIds = new Set(ordersInRange?.map(o => o.store_id) || [])
  const gmvInRange = ordersInRange?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0
  const gmvToday = ordersToday?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0

  return {
    activeStores: activeStoreIds.size,
    ordersToday: ordersToday?.length || 0,
    ordersInRange: ordersInRange?.length || 0,
    gmvToday,
    gmvInRange
  }
}
