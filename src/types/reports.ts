export interface ReportMetrics {
  total_orders: number
  total_revenue: number
  average_ticket: number
  paid_count: number
  pending_count: number
}

export interface PaymentBreakdown {
  method: string
  count: number
  total: number
}

export interface TopProduct {
  product_name: string
  total_quantity: number
  total_revenue: number
  order_count: number
}

export interface PeakHour {
  hour: number
  total_orders: number
  total_revenue: number
  average_ticket: number
}

export interface DailyData {
  date: string
  orders: number
  revenue: number
  ticket: number
}

export interface CategoryData {
  category: string
  revenue: number
  quantity: number
  percentage: number
}

export interface ComparisonData {
  current: { orders: number; revenue: number; ticket: number }
  previous: { orders: number; revenue: number; ticket: number }
  change: { orders: number; revenue: number; ticket: number }
}

export interface CancellationData {
  total: number
  rate: number
  reasons: { reason: string; count: number }[]
}

export interface TopCustomer {
  phone: string
  name: string
  orders: number
  total_spent: number
  last_order: string
}

export type DatePreset = 'today' | '7days' | '30days' | '90days' | 'thisMonth' | 'lastMonth' | 'custom'
export type ReportTab = 'overview' | 'products' | 'payments' | 'customers' | 'dre' | 'comparison'

export const CHART_COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#6366F1', '#14B8A6']

export const DATE_PRESETS = [
  { key: 'today' as DatePreset, label: 'Hoje' },
  { key: '7days' as DatePreset, label: '7 dias' },
  { key: '30days' as DatePreset, label: '30 dias' },
  { key: '90days' as DatePreset, label: '90 dias' },
  { key: 'thisMonth' as DatePreset, label: 'Este mês' },
  { key: 'lastMonth' as DatePreset, label: 'Mês anterior' },
  { key: 'custom' as DatePreset, label: 'Personalizado' }
]

export const PAYMENT_LABELS: Record<string, string> = {
  pix: 'PIX',
  cash: 'Dinheiro',
  card: 'Cartão',
  card_on_delivery: 'Cartão na Entrega'
}

export function getPaymentMethodLabel(method: string): string {
  return PAYMENT_LABELS[method] || method
}
