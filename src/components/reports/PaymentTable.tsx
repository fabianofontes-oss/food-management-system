'use client'

import { formatCurrency } from '@/lib/utils'
import type { PaymentBreakdown, ReportMetrics } from '@/types/reports'
import { getPaymentMethodLabel } from '@/types/reports'

interface PaymentTableProps {
  breakdown: PaymentBreakdown[]
  metrics: ReportMetrics
}

export function PaymentTable({ breakdown, metrics }: PaymentTableProps) {
  if (breakdown.length === 0) {
    return <div className="text-center py-8 text-gray-500">Nenhum pedido encontrado no período selecionado</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b-2 border-gray-200">
            <th className="text-left py-3 px-4 font-bold text-gray-700">Método</th>
            <th className="text-right py-3 px-4 font-bold text-gray-700">Quantidade</th>
            <th className="text-right py-3 px-4 font-bold text-gray-700">Total</th>
            <th className="text-right py-3 px-4 font-bold text-gray-700">% do Total</th>
          </tr>
        </thead>
        <tbody>
          {breakdown.map((item) => (
            <tr key={item.method} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-3 px-4 font-medium">{getPaymentMethodLabel(item.method)}</td>
              <td className="py-3 px-4 text-right">{item.count}</td>
              <td className="py-3 px-4 text-right font-bold text-green-600">{formatCurrency(item.total)}</td>
              <td className="py-3 px-4 text-right text-gray-600">{((item.total / metrics.total_revenue) * 100).toFixed(1)}%</td>
            </tr>
          ))}
          <tr className="bg-gray-50 font-bold">
            <td className="py-3 px-4">TOTAL</td>
            <td className="py-3 px-4 text-right">{metrics.total_orders}</td>
            <td className="py-3 px-4 text-right text-green-600">{formatCurrency(metrics.total_revenue)}</td>
            <td className="py-3 px-4 text-right">100%</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
