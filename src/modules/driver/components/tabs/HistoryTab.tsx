'use client'

import { History } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { Delivery } from '../../types'

interface HistoryTabProps {
  deliveries: Delivery[]
  commissionPercent: number
}

export function HistoryTab({ deliveries, commissionPercent }: HistoryTabProps) {
  const completedDeliveries = deliveries.filter(d => d.status === 'delivered')

  if (completedDeliveries.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center shadow-md">
        <History className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">Nenhuma entrega concluída</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {completedDeliveries.slice(0, 20).map(delivery => (
        <div key={delivery.id} className="bg-white rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-800">#{delivery.order?.order_code}</div>
              <div className="text-xs text-slate-500">
                {new Date(delivery.created_at).toLocaleDateString('pt-BR')}
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-emerald-600">
                +{formatCurrency((delivery.delivery_fee || 0) * commissionPercent / 100)}
              </div>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                Entregue
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
