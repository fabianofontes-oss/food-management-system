/**
 * Tipos para o módulo de relatórios
 */

export interface DateRange {
  startDate: string // YYYY-MM-DD
  endDate: string   // YYYY-MM-DD
}

export interface SalesReport {
  period: DateRange
  totalOrders: number
  totalRevenue: number
  averageTicket: number
  ordersByChannel: {
    channel: 'COUNTER' | 'DELIVERY' | 'TAKEAWAY'
    count: number
    revenue: number
  }[]
  ordersByStatus: {
    status: string
    count: number
  }[]
  dailySales: {
    date: string
    orders: number
    revenue: number
  }[]
}

export interface TopProductsReport {
  period: DateRange
  products: {
    productId: string
    productName: string
    quantity: number
    revenue: number
    category: string
  }[]
}

export interface ReportFilters {
  storeId: string
  startDate: string
  endDate: string
}
