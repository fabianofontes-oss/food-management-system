'use client'

import { TrendingUp, Calendar } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { DriverStats } from '../../types'

interface EarningsTabProps {
  stats: DriverStats
  commissionPercent: number
}

export function EarningsTab({ stats, commissionPercent }: EarningsTabProps) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-6 shadow-md">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-600" />
          Resumo de Ganhos
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl">
            <div>
              <div className="font-medium text-slate-700">Hoje</div>
              <div className="text-sm text-slate-500">{stats.todayDeliveries} entregas</div>
            </div>
            <div className="text-2xl font-bold text-indigo-600">
              {formatCurrency(stats.todayEarnings)}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
            <div>
              <div className="font-medium text-slate-700">Esta Semana</div>
              <div className="text-sm text-slate-500">{stats.weekDeliveries} entregas</div>
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(stats.weekEarnings)}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl">
            <div>
              <div className="font-medium text-slate-700">Total Acumulado</div>
              <div className="text-sm text-slate-500">{stats.totalDeliveries} entregas</div>
            </div>
            <div className="text-2xl font-bold text-emerald-600">
              {formatCurrency(stats.totalEarnings)}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-md">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-orange-600" />
          Sua Comissão
        </h3>
        <div className="text-center p-4 bg-orange-50 rounded-xl">
          <div className="text-4xl font-bold text-orange-600">{commissionPercent}%</div>
          <div className="text-sm text-orange-700 mt-1">por entrega</div>
        </div>
      </div>
    </div>
  )
}
