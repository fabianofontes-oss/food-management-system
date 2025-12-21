/**
 * Rate Limit Error Component
 * 
 * Mostra quando usuário excede o limite de requisições.
 */

'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, Clock } from 'lucide-react'
import { Button } from './button'

interface RateLimitErrorProps {
  /**
   * Segundos até poder tentar novamente
   */
  retryAfter: number
  
  /**
   * Callback quando countdown terminar
   */
  onRetry?: () => void
  
  /**
   * Mensagem customizada (opcional)
   */
  message?: string
}

export function RateLimitError({ retryAfter, onRetry, message }: RateLimitErrorProps) {
  const [secondsLeft, setSecondsLeft] = useState(retryAfter)

  useEffect(() => {
    setSecondsLeft(retryAfter)

    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [retryAfter])

  const canRetry = secondsLeft === 0

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-orange-50 border-2 border-orange-200 rounded-2xl">
      <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-orange-600" />
      </div>
      
      <h3 className="text-xl font-bold text-slate-800 mb-2">
        Muitas requisições
      </h3>
      
      <p className="text-slate-600 text-center mb-6 max-w-md">
        {message || 'Você excedeu o limite de requisições. Por favor, aguarde alguns segundos antes de tentar novamente.'}
      </p>

      {!canRetry && (
        <div className="flex items-center gap-2 mb-4 text-orange-600">
          <Clock className="w-5 h-5" />
          <span className="text-lg font-mono font-bold">
            {secondsLeft}s
          </span>
        </div>
      )}

      <Button
        onClick={onRetry}
        disabled={!canRetry}
        className="min-w-[200px]"
      >
        {canRetry ? 'Tentar novamente' : `Aguarde ${secondsLeft}s`}
      </Button>

      <p className="text-xs text-slate-500 mt-4">
        Este limite existe para proteger o sistema contra abuso.
      </p>
    </div>
  )
}

/**
 * Hook para detectar erro 429 e extrair retry-after
 */
export function useRateLimitError(error: any) {
  if (!error) return null

  // Se é um erro de fetch com status 429
  if (error.status === 429 || error.response?.status === 429) {
    const retryAfter = error.retryAfter || error.response?.data?.retryAfter || 60
    const message = error.message || error.response?.data?.message

    return {
      isRateLimited: true,
      retryAfter,
      message,
    }
  }

  // Se é um erro de Server Action
  if (error.error?.includes('Rate limit')) {
    const match = error.error.match(/(\d+) seconds/)
    const retryAfter = match ? parseInt(match[1]) : 60

    return {
      isRateLimited: true,
      retryAfter,
      message: error.error,
    }
  }

  return null
}
