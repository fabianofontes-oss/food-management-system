'use server'

/**
 * Server Actions para relatórios
 */

import { getSalesReport, getTopProductsReport } from './repository'
import type { SalesReport, TopProductsReport, ReportFilters } from './types'

export async function fetchSalesReport(filters: ReportFilters): Promise<{
  data: SalesReport | null
  error: string | null
}> {
  try {
    const data = await getSalesReport(filters)
    return { data, error: null }
  } catch (err) {
    console.error('Erro ao buscar relatório de vendas:', err)
    return { data: null, error: 'Erro ao carregar relatório' }
  }
}

export async function fetchTopProductsReport(
  filters: ReportFilters,
  limit = 10
): Promise<{
  data: TopProductsReport | null
  error: string | null
}> {
  try {
    const data = await getTopProductsReport(filters, limit)
    return { data, error: null }
  } catch (err) {
    console.error('Erro ao buscar top produtos:', err)
    return { data: null, error: 'Erro ao carregar relatório' }
  }
}

export async function exportReportCSV(
  filters: ReportFilters
): Promise<{ csv: string | null; error: string | null }> {
  try {
    const salesReport = await getSalesReport(filters)
    
    // Gerar CSV das vendas diárias
    const headers = ['Data', 'Pedidos', 'Receita']
    const rows = salesReport.dailySales.map(d => [
      d.date,
      d.orders.toString(),
      d.revenue.toFixed(2),
    ])
    
    const csv = [
      headers.join(','),
      ...rows.map(r => r.join(',')),
      '',
      `Total Pedidos,${salesReport.totalOrders}`,
      `Receita Total,${salesReport.totalRevenue.toFixed(2)}`,
      `Ticket Médio,${salesReport.averageTicket.toFixed(2)}`,
    ].join('\n')
    
    return { csv, error: null }
  } catch (err) {
    console.error('Erro ao exportar CSV:', err)
    return { csv: null, error: 'Erro ao exportar relatório' }
  }
}
