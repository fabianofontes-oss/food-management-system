'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Ops! Algo deu errado
        </h2>
        <p className="text-gray-600 mb-6">
          Ocorreu um erro ao carregar esta página. Tente novamente ou entre em contato com o suporte.
        </p>
        {error.message && (
          <p className="text-sm text-gray-500 bg-gray-100 p-3 rounded-lg mb-6 font-mono">
            {error.message}
          </p>
        )}
        <Button onClick={reset} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Tentar novamente
        </Button>
      </div>
    </div>
  )
}
