'use client'

import { useState, useEffect, useCallback } from 'react'
import { WifiOff, AlertTriangle, RefreshCw } from 'lucide-react'

interface NetworkState {
  isOnline: boolean
  isServerOk: boolean
  lastCheck: Date | null
  checking: boolean
}

export function NetworkStatus() {
  const [state, setState] = useState<NetworkState>({
    isOnline: true,
    isServerOk: true,
    lastCheck: null,
    checking: false
  })

  const checkServer = useCallback(async () => {
    if (!navigator.onLine) return false
    
    setState(prev => ({ ...prev, checking: true }))
    
    try {
      const start = Date.now()
      
      // Ping leve para verificar conexão com o servidor
      const response = await fetch('/api/ping', { cache: 'no-store' })
      
      const latency = Date.now() - start
      
      // Se demorar mais de 10s ou não for OK, consideramos problemático
      const isOk = response.ok && latency < 10000
      
      setState(prev => ({
        ...prev,
        isServerOk: isOk,
        lastCheck: new Date(),
        checking: false
      }))
      
      return isOk
    } catch (err) {
      setState(prev => ({
        ...prev,
        isServerOk: false,
        lastCheck: new Date(),
        checking: false
      }))
      return false
    }
  }, [])

  const handleRetry = useCallback(() => {
    checkServer()
  }, [checkServer])

  // Monitorar status de rede do navegador
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }))
      checkServer()
    }
    
    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false, isServerOk: false }))
    }

    // Estado inicial
    setState(prev => ({ ...prev, isOnline: navigator.onLine }))

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [checkServer])

  // Ping periódico no servidor (a cada 30s)
  useEffect(() => {
    // Check inicial
    checkServer()

    // Intervalo de 30 segundos
    const interval = setInterval(() => {
      if (navigator.onLine) {
        checkServer()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [checkServer])

  // Se tudo OK, não mostra nada
  if (state.isOnline && state.isServerOk) {
    return null
  }

  // Determinar mensagem e ícone
  let message = ''
  let Icon = AlertTriangle

  if (!state.isOnline) {
    message = '⚠️ Sem conexão com a internet. Verifique sua rede.'
    Icon = WifiOff
  } else if (!state.isServerOk) {
    message = '⚠️ Problema na conexão com o servidor. Tentando reconectar...'
    Icon = AlertTriangle
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-red-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{message}</span>
        </div>
        
        <button
          onClick={handleRetry}
          disabled={state.checking}
          className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${state.checking ? 'animate-spin' : ''}`} />
          {state.checking ? 'Verificando...' : 'Tentar novamente'}
        </button>
      </div>
    </div>
  )
}
