'use client'

import { useState } from 'react'
import { Ticket, Loader2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CouponSectionProps {
  onApply: (code: string) => Promise<{ valid: boolean; reason?: string; discount?: number }>
  appliedCoupon: { code: string; discount: number } | null
  onRemove: () => void
}

export function CouponSection({ onApply, appliedCoupon, onRemove }: CouponSectionProps) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleApply() {
    if (!code.trim()) {
      setError('Digite um código de cupom')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await onApply(code.toUpperCase())
      
      if (result.valid) {
        setCode('')
      } else {
        setError(result.reason || 'Cupom inválido')
      }
    } catch (err) {
      setError('Erro ao aplicar cupom')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center gap-2 mb-3">
        <Ticket className="w-5 h-5 text-purple-600" />
        <h3 className="font-semibold text-gray-900">Cupom de Desconto</h3>
      </div>

      {appliedCoupon ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Check className="w-5 h-5 text-green-600" />
                <span className="font-mono font-bold text-green-700">{appliedCoupon.code}</span>
              </div>
              <p className="text-sm text-green-600">
                Desconto de R$ {appliedCoupon.discount.toFixed(2)} aplicado
              </p>
            </div>
            <button
              onClick={onRemove}
              className="p-2 hover:bg-green-100 rounded-lg transition-colors"
              title="Remover cupom"
            >
              <X className="w-5 h-5 text-green-700" />
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && handleApply()}
              placeholder="Digite o código"
              className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none font-mono uppercase"
              disabled={loading}
            />
            <Button
              type="button"
              onClick={handleApply}
              disabled={loading || !code.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Aplicar'
              )}
            </Button>
          </div>

          {error && (
            <div className="mt-2 text-sm text-red-600 flex items-center gap-2">
              <X className="w-4 h-4" />
              {error}
            </div>
          )}
        </>
      )}
    </div>
  )
}
