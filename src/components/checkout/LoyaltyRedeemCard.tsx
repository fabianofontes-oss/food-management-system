'use client'

import { useState, useEffect } from 'react'
import { Gift, Star, Sparkles, Check, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { getCustomerLoyalty } from '@/app/actions/loyalty'

interface LoyaltyRedeemCardProps {
  storeId: string
  customerId: string | null
  onRedeemToggle: (redeem: boolean, discountAmount: number) => void
}

export function LoyaltyRedeemCard({ storeId, customerId, onRedeemToggle }: LoyaltyRedeemCardProps) {
  const [loading, setLoading] = useState(true)
  const [loyaltyData, setLoyaltyData] = useState<{
    stamps_current: number
    stamps_to_reward: number
    reward_value: number
    can_redeem: boolean
  } | null>(null)
  const [isRedeeming, setIsRedeeming] = useState(false)

  useEffect(() => {
    async function loadLoyalty() {
      if (!customerId) {
        setLoading(false)
        return
      }

      const data = await getCustomerLoyalty(storeId, customerId)
      if (data) {
        setLoyaltyData({
          stamps_current: data.stamps_current,
          stamps_to_reward: data.stamps_to_reward,
          reward_value: data.reward_value,
          can_redeem: data.can_redeem
        })
      }
      setLoading(false)
    }
    loadLoyalty()
  }, [storeId, customerId])

  const handleToggleRedeem = () => {
    if (!loyaltyData?.can_redeem) return
    
    const newState = !isRedeeming
    setIsRedeeming(newState)
    onRedeemToggle(newState, newState ? loyaltyData.reward_value : 0)
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-200">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
          <span className="text-amber-700">Verificando fidelidade...</span>
        </div>
      </div>
    )
  }

  if (!customerId || !loyaltyData) {
    return null
  }

  const progress = (loyaltyData.stamps_current / loyaltyData.stamps_to_reward) * 100

  return (
    <div className={`rounded-2xl p-4 border-2 transition-all ${
      isRedeeming 
        ? 'bg-gradient-to-r from-amber-100 to-orange-100 border-amber-400 shadow-lg shadow-amber-200/50' 
        : loyaltyData.can_redeem
        ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 hover:border-amber-300'
        : 'bg-slate-50 border-slate-200'
    }`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${
            loyaltyData.can_redeem ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-slate-300'
          }`}>
            <Gift className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Cartão Fidelidade</h3>
            <p className="text-sm text-slate-500">
              {loyaltyData.stamps_current}/{loyaltyData.stamps_to_reward} selos
            </p>
          </div>
        </div>

        {loyaltyData.can_redeem && (
          <button
            onClick={handleToggleRedeem}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
              isRedeeming
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-white text-amber-700 border border-amber-300 hover:bg-amber-50'
            }`}
          >
            {isRedeeming ? (
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                Aplicado
              </span>
            ) : (
              'Usar Selos'
            )}
          </button>
        )}
      </div>

      {/* Barra de Progresso */}
      <div className="mt-4">
        <div className="flex items-center gap-2 mb-2">
          {Array.from({ length: loyaltyData.stamps_to_reward }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                i < loyaltyData.stamps_current
                  ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                  : 'bg-slate-200'
              }`}
            >
              {i < loyaltyData.stamps_current && (
                <Star className="w-2.5 h-2.5 text-white" fill="white" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Mensagem */}
      {loyaltyData.can_redeem ? (
        <div className={`mt-3 p-3 rounded-xl ${
          isRedeeming ? 'bg-amber-200/50' : 'bg-white/50'
        }`}>
          {isRedeeming ? (
            <p className="text-amber-800 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>
                <strong>{formatCurrency(loyaltyData.reward_value)}</strong> de desconto aplicado!
              </span>
            </p>
          ) : (
            <p className="text-amber-700 text-sm">
              🎉 Você completou o cartão! Clique em &quot;Usar Selos&quot; para ganhar{' '}
              <strong>{formatCurrency(loyaltyData.reward_value)}</strong> de desconto.
            </p>
          )}
        </div>
      ) : (
        <p className="text-slate-500 text-sm mt-3">
          Faltam {loyaltyData.stamps_to_reward - loyaltyData.stamps_current} selos para ganhar{' '}
          {formatCurrency(loyaltyData.reward_value)} de desconto.
        </p>
      )}
    </div>
  )
}
