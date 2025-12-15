import { createClient } from '@/lib/supabase/server'

export type PeriodFilter = 'today' | 'last7' | 'last30' | 'custom'
export type OrderTypeFilter = 'all' | 'delivery' | 'pickup' | 'dine_in'
export type PaymentStatusFilter = 'all' | 'paid' | 'pending'

export type DateRange = {
  start: Date
  end: Date
}

export type SalesKPIs = {
  totalRevenue: number
  totalOrders: number
  averageTicket: number
  ordersByStatus: Record<string, number>
  ordersByType: Record<string, number>
}

export type TopProduct = {
  product_id: string
  product_name: string
  quantity_sold: number
  revenue: number
}

export type DailyTrend = {
  date: string
  revenue: number
  orders_count: number
}

export function getDateRange(period: PeriodFilter, customStart?: Date, customEnd?: Date): DateRange {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  switch (period) {
    case 'today':
      return {
        start: today,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    case 'last7': {
      const last7 = new Date(today)
      last7.setDate(last7.getDate() - 7)
      return { start: last7, end: now }
    }
    case 'last30': {
      const last30 = new Date(today)
      last30.setDate(last30.getDate() - 30)
      return { start: last30, end: now }
    }
    case 'custom': {
      const fallbackStart = new Date(today)
      fallbackStart.setDate(fallbackStart.getDate() - 7)
      return {
        start: customStart || fallbackStart,
        end: customEnd || now
      }
    }
    default: {
      const defaultStart = new Date(today)
      defaultStart.setDate(defaultStart.getDate() - 7)
      return { start: defaultStart, end: now }
    }
  }
}

export async function getSalesKPIs(
  storeId: string,
  dateRange: DateRange,
  orderTypeFilter: OrderTypeFilter = 'all',
  paymentStatusFilter: PaymentStatusFilter = 'all'
): Promise<SalesKPIs> {
  const supabase = await createClient()
  
  let query = supabase
    .from('orders')
    .select('id, total_amount, status, order_type, payment_status')
    .eq('store_id', storeId)
    .gte('created_at', dateRange.start.toISOString())
    .lte('created_at', dateRange.end.toISOString())

  if (orderTypeFilter !== 'all') {
    query = query.eq('order_type', orderTypeFilter)
  }

  if (paymentStatusFilter !== 'all') {
    query = query.eq('payment_status', paymentStatusFilter)
  }

  const { data: orders, error } = await query

  if (error || !orders) {
    return {
      totalRevenue: 0,
      totalOrders: 0,
      averageTicket: 0,
      ordersByStatus: {},
      ordersByType: {}
    }
  }

  // Calculate KPIs
  const totalRevenue = orders.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0)
  const totalOrders = orders.length
  const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0

  // Group by status
  const ordersByStatus: Record<string, number> = {}
  orders.forEach((o: any) => {
    const status = o.status || 'unknown'
    ordersByStatus[status] = (ordersByStatus[status] || 0) + 1
  })

  // Group by type
  const ordersByType: Record<string, number> = {}
  orders.forEach((o: any) => {
    const type = o.order_type || 'unknown'
    ordersByType[type] = (ordersByType[type] || 0) + 1
  })

  return {
    totalRevenue,
    totalOrders,
    averageTicket,
    ordersByStatus,
    ordersByType
  }
}

export async function getTopProducts(
  storeId: string,
  dateRange: DateRange,
  limit: number = 10
): Promise<TopProduct[]> {
  const supabase = await createClient()
  
  // Get order items with product info for orders in date range
  const { data: orderItems, error } = await supabase
    .from('order_items')
    .select(`
      quantity,
      unit_price,
      product_id,
      products!inner (
        id,
        name
      ),
      orders!inner (
        id,
        store_id,
        created_at
      )
    `)
    .eq('orders.store_id', storeId)
    .gte('orders.created_at', dateRange.start.toISOString())
    .lte('orders.created_at', dateRange.end.toISOString())

  if (error || !orderItems) {
    return []
  }

  // Aggregate by product
  const productMap = new Map<string, TopProduct>()

  orderItems.forEach((item: any) => {
    const product = item.products
    const productId = product.id

    if (!productMap.has(productId)) {
      productMap.set(productId, {
        product_id: productId,
        product_name: product.name,
        quantity_sold: 0,
        revenue: 0
      })
    }

    const productData = productMap.get(productId)!
    productData.quantity_sold += item.quantity || 0
    productData.revenue += (item.quantity || 0) * (item.unit_price || 0)
  })

  // Convert to array and sort by quantity
  return Array.from(productMap.values())
    .sort((a, b) => b.quantity_sold - a.quantity_sold)
    .slice(0, limit)
}

export async function getDailyTrend(
  storeId: string,
  dateRange: DateRange
): Promise<DailyTrend[]> {
  const supabase = await createClient()
  
  const { data: orders, error } = await supabase
    .from('orders')
    .select('created_at, total_amount')
    .eq('store_id', storeId)
    .gte('created_at', dateRange.start.toISOString())
    .lte('created_at', dateRange.end.toISOString())
    .order('created_at', { ascending: true })

  if (error || !orders) {
    return []
  }

  // Aggregate by day
  const dayMap = new Map<string, DailyTrend>()

  orders.forEach((order: any) => {
    const date = new Date(order.created_at)
    const dateKey = date.toISOString().split('T')[0] // YYYY-MM-DD

    if (!dayMap.has(dateKey)) {
      dayMap.set(dateKey, {
        date: dateKey,
        revenue: 0,
        orders_count: 0
      })
    }

    const dayData = dayMap.get(dateKey)!
    dayData.orders_count++
    dayData.revenue += order.total_amount || 0
  })

  // Fill missing days with zeros
  const result: DailyTrend[] = []
  const currentDate = new Date(dateRange.start)
  const endDate = new Date(dateRange.end)

  while (currentDate <= endDate) {
    const dateKey = currentDate.toISOString().split('T')[0]
    
    result.push(dayMap.get(dateKey) || {
      date: dateKey,
      revenue: 0,
      orders_count: 0
    })

    currentDate.setDate(currentDate.getDate() + 1)
  }

  return result
}

export async function getDeliveryMetrics(
  storeId: string,
  dateRange: DateRange
) {
  const supabase = await createClient()
  
  const { data: deliveries, error } = await supabase
    .from('deliveries')
    .select(`
      id,
      status,
      created_at,
      delivered_at,
      orders!inner (
        store_id
      )
    `)
    .eq('orders.store_id', storeId)
    .gte('created_at', dateRange.start.toISOString())
    .lte('created_at', dateRange.end.toISOString())

  if (error || !deliveries) {
    return {
      totalDeliveries: 0,
      deliveredCount: 0,
      avgDeliveryTime: 0
    }
  }

  const deliveredCount = deliveries.filter((d: any) => d.status === 'delivered').length
  
  // Calculate avg delivery time for delivered orders
  const deliveryTimes = deliveries
    .filter((d: any) => d.status === 'delivered' && d.delivered_at)
    .map((d: any) => {
      const created = new Date(d.created_at).getTime()
      const delivered = new Date(d.delivered_at).getTime()
      return (delivered - created) / (1000 * 60) // minutes
    })

  const avgDeliveryTime = deliveryTimes.length > 0
    ? deliveryTimes.reduce((sum: number, t: number) => sum + t, 0) / deliveryTimes.length
    : 0

  return {
    totalDeliveries: deliveries.length,
    deliveredCount,
    avgDeliveryTime: Math.round(avgDeliveryTime)
  }
}

// CSV Export helpers
export function generateOrdersCSV(kpis: SalesKPIs, dateRange: DateRange): string {
  const headers = ['Métrica', 'Valor']
  const rows = [
    ['Período', `${dateRange.start.toLocaleDateString('pt-BR')} - ${dateRange.end.toLocaleDateString('pt-BR')}`],
    ['Receita Total', `R$ ${kpis.totalRevenue.toFixed(2)}`],
    ['Total de Pedidos', kpis.totalOrders.toString()],
    ['Ticket Médio', `R$ ${kpis.averageTicket.toFixed(2)}`],
    ['', ''],
    ['Status', 'Quantidade'],
    ...Object.entries(kpis.ordersByStatus).map(([status, count]) => [status, count.toString()]),
    ['', ''],
    ['Tipo', 'Quantidade'],
    ...Object.entries(kpis.ordersByType).map(([type, count]) => [type, count.toString()])
  ]

  return [headers, ...rows]
    .map(row => row.join(','))
    .join('\n')
}

export function generateTopProductsCSV(products: TopProduct[]): string {
  const headers = ['Produto', 'Quantidade Vendida', 'Receita']
  const rows = products.map(p => [
    p.product_name,
    p.quantity_sold.toString(),
    `R$ ${p.revenue.toFixed(2)}`
  ])

  return [headers, ...rows]
    .map(row => row.join(','))
    .join('\n')
}
