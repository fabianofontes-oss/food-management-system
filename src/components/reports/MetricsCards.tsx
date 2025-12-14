'use client'

import { DollarSign, ShoppingBag, TrendingUp, CreditCard } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { ReportMetrics } from '@/types/reports'

interface MetricsCardsProps {
  metrics: ReportMetrics
}

export function MetricsCards({ metrics }: MetricsCardsProps) {
  const cards = [
    { title: 'Total de Pedidos', value: metrics.total_orders.toString(), icon: ShoppingBag, color: 'blue', subtitle: `${metrics.paid_count} pagos · ${metrics.pending_count} pendentes` },
    { title: 'Receita Total', value: formatCurrency(metrics.total_revenue), icon: DollarSign, color: 'green', subtitle: 'Valor bruto' },
    { title: 'Ticket Médio', value: formatCurrency(metrics.average_ticket), icon: TrendingUp, color: 'purple', subtitle: 'Por pedido' },
    { title: 'Taxa Conversão', value: `${metrics.total_orders > 0 ? ((metrics.paid_count / metrics.total_orders) * 100).toFixed(1) : 0}%`, icon: CreditCard, color: 'amber', subtitle: 'Pedidos pagos' }
  ]

  const colorClasses: Record<string, { bg: string; text: string; icon: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'bg-blue-100' },
    green: { bg: 'bg-green-50', text: 'text-green-600', icon: 'bg-green-100' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', icon: 'bg-purple-100' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', icon: 'bg-amber-100' }
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => {
        const colors = colorClasses[card.color]
        return (
          <div key={card.title} className={`${colors.bg} rounded-2xl p-5 shadow-sm`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 ${colors.icon} rounded-lg`}>
                <card.icon className={`w-5 h-5 ${colors.text}`} />
              </div>
              <span className="text-sm font-medium text-gray-600">{card.title}</span>
            </div>
            <p className={`text-2xl md:text-3xl font-bold ${colors.text}`}>{card.value}</p>
            <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
          </div>
        )
      })}
    </div>
  )
}
