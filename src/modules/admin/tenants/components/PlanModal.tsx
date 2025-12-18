'use client'

import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { type Plan } from '../types/tenant.types'

interface PlanModalProps {
  isOpen: boolean
  plans: Plan[]
  selectedPlanId: string
  changingPlan: boolean
  onSelectPlan: (planId: string) => void
  onConfirm: () => void
  onClose: () => void
}

export function PlanModal({
  isOpen,
  plans,
  selectedPlanId,
  changingPlan,
  onSelectPlan,
  onConfirm,
  onClose
}: PlanModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Alterar Plano do Tenant</h3>
        
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Selecione o Plano
          </label>
          <select
            value={selectedPlanId}
            onChange={(e) => onSelectPlan(e.target.value)}
            className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
            disabled={changingPlan}
          >
            <option value="">Selecione um plano...</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name} - R$ {(plan.price_monthly_cents / 100).toFixed(2)}/mês
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={onConfirm}
            disabled={!selectedPlanId || changingPlan}
            className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50"
          >
            {changingPlan ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Alterando...
              </>
            ) : (
              'Confirmar'
            )}
          </Button>
          <Button
            onClick={onClose}
            disabled={changingPlan}
            variant="outline"
            className="flex-1"
          >
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  )
}
