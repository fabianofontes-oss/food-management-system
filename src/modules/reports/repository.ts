/**
 * Repository para relatórios - queries agregadas server-side
 */

import { createClient } from '@/lib/supabase/server'
import type { SalesReport, TopProductsReport, ReportFilters } from './types'

export async function getSalesReport(filters: ReportFilters): Promise<SalesReport> {
  const supabase = await createClient()
  
  // Query principal: pedidos no período
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, total, channel, status, created_at')
    .eq('store_id', filters.storeId)
    .gte('created_at', `${filters.startDate}T00:00:00`)
    .lte('created_at', `${filters.endDate}T23:59:59`)
    .not('status', 'eq', 'CANCELLED')

  if (error || !orders) {
    return {
      period: { startDate: filters.startDate, endDate: filters.endDate },
      totalOrders: 0,
      totalRevenue: 0,
      averageTicket: 0,
      ordersByChannel: [],
      ordersByStatus: [],
      dailySales: [],
    }
  }

  // Calcular métricas
  const totalOrders = orders.length
  const totalRevenue = orders.reduce((sum: number, o: { total: number | null }) => sum + (o.total || 0), 0)
  const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0

  // Agrupar por canal
  const channelMap = new Map<string, { count: number; revenue: number }>()
  for (const order of orders) {
    const channel = order.channel || 'COUNTER'
    const existing = channelMap.get(channel) || { count: 0, revenue: 0 }
    channelMap.set(channel, {
      count: existing.count + 1,
      revenue: existing.revenue + (order.total || 0),
    })
  }
  const ordersByChannel = Array.from(channelMap.entries()).map(([channel, data]) => ({
    channel: channel as 'COUNTER' | 'DELIVERY' | 'TAKEAWAY',
    count: data.count,
    revenue: data.revenue,
  }))

  // Agrupar por status
  const statusMap = new Map<string, number>()
  for (const order of orders) {
    const status = order.status || 'PENDING'
    statusMap.set(status, (statusMap.get(status) || 0) + 1)
  }
  const ordersByStatus = Array.from(statusMap.entries()).map(([status, count]) => ({
    status,
    count,
  }))

  // Agrupar por dia
  const dailyMap = new Map<string, { orders: number; revenue: number }>()
  for (const order of orders) {
    const date = order.created_at?.split('T')[0] || filters.startDate
    const existing = dailyMap.get(date) || { orders: 0, revenue: 0 }
    dailyMap.set(date, {
      orders: existing.orders + 1,
      revenue: existing.revenue + (order.total || 0),
    })
  }
  const dailySales = Array.from(dailyMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return {
    period: { startDate: filters.startDate, endDate: filters.endDate },
    totalOrders,
    totalRevenue,
    averageTicket,
    ordersByChannel,
    ordersByStatus,
    dailySales,
  }
}

export async function getTopProductsReport(
  filters: ReportFilters,
  limit = 10
): Promise<TopProductsReport> {
  const supabase = await createClient()

  // Buscar order_items com produtos no período
  const { data: items, error } = await supabase
    .from('order_items')
    .select(`
      quantity,
      unit_price,
      product_id,
      products!inner(id, name, category_id, categories(name)),
      orders!inner(id, store_id, created_at, status)
    `)
    .eq('orders.store_id', filters.storeId)
    .gte('orders.created_at', `${filters.startDate}T00:00:00`)
    .lte('orders.created_at', `${filters.endDate}T23:59:59`)
    .not('orders.status', 'eq', 'CANCELLED')

  if (error || !items) {
    return {
      period: { startDate: filters.startDate, endDate: filters.endDate },
      products: [],
    }
  }

  // Agrupar por produto
  const productMap = new Map<string, {
    productName: string
    quantity: number
    revenue: number
    category: string
  }>()

  for (const item of items) {
    const productId = item.product_id
    const product = item.products as any
    const productName = product?.name || 'Produto'
    const category = product?.categories?.name || 'Sem categoria'
    const quantity = item.quantity || 1
    const revenue = (item.unit_price || 0) * quantity

    const existing = productMap.get(productId) || {
      productName,
      quantity: 0,
      revenue: 0,
      category,
    }

    productMap.set(productId, {
      productName,
      quantity: existing.quantity + quantity,
      revenue: existing.revenue + revenue,
      category,
    })
  }

  // Ordenar por quantidade e limitar
  const products = Array.from(productMap.entries())
    .map(([productId, data]) => ({ productId, ...data }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, limit)

  return {
    period: { startDate: filters.startDate, endDate: filters.endDate },
    products,
  }
}
