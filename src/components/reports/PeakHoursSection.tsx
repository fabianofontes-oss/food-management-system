'use client'

import { Clock } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { PeakHour } from '@/types/reports'

interface PeakHoursSectionProps {
  peakHours: PeakHour[]
}

export function PeakHoursSection({ peakHours }: PeakHoursSectionProps) {
  if (peakHours.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-6 h-6 text-indigo-600" />
          <h2 className="text-xl font-bold text-gray-900">Horários de Pico</h2>
        </div>
        <div className="text-center py-8 text-gray-500">Nenhum pedido no período selecionado</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-6 h-6 text-indigo-600" />
        <h2 className="text-xl font-bold text-gray-900">Horários de Pico</h2>
      </div>
      
      {/* Top 5 Busiest Hours */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Top 5 Horários Mais Movimentados</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {peakHours.slice(0, 5).map((hour, index) => (
            <div key={hour.hour} className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-4 text-white shadow-lg">
              <div className="text-sm opacity-90 mb-1">#{index + 1}</div>
              <div className="text-2xl font-bold mb-1">{hour.hour}:00</div>
              <div className="text-sm opacity-90">{hour.total_orders} pedidos</div>
              <div className="text-xs opacity-75 mt-1">{formatCurrency(hour.total_revenue)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Full 24-hour Breakdown */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Distribuição Completa (24h)</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 font-bold text-gray-700">Horário</th>
                <th className="text-right py-3 px-4 font-bold text-gray-700">Pedidos</th>
                <th className="text-right py-3 px-4 font-bold text-gray-700">Receita</th>
                <th className="text-right py-3 px-4 font-bold text-gray-700">Ticket Médio</th>
              </tr>
            </thead>
            <tbody>
              {peakHours.map((hour) => (
                <tr key={hour.hour} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{hour.hour}:00 - {hour.hour}:59</td>
                  <td className="py-3 px-4 text-right">{hour.total_orders}</td>
                  <td className="py-3 px-4 text-right font-bold text-green-600">{formatCurrency(hour.total_revenue)}</td>
                  <td className="py-3 px-4 text-right text-gray-600">{formatCurrency(hour.average_ticket)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
