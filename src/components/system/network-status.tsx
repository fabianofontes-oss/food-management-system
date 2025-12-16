'use client'

import { useState, useEffect, useCallback } from 'react'
import { WifiOff, AlertTriangle, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface NetworkState {
  isOnline: boolean
  isSupabaseOk: boolean
  lastCheck: Date | null
  checking: boolean
}

export function NetworkStatus() {
  const [state, setState] = useState<NetworkState>({
    isOnline: true,
    isSupabaseOk: true,
    lastCheck: null,
    checking: false
  })

  const checkSupabase = useCallback(async () => {
    if (!navigator.onLine) return false
    
    setState(prev => ({ ...prev, checking: true }))
    
    try {
      const supabase = createClient()
      const start = Date.now()
      
      // Query leve para verificar conexão
      const { error } = await supabase
        .from('stores')
        .select('id', { count: 'exact', head: true })
        .limit(1)
      
      const latency = Date.now() - start
      
      // Se demorar mais de 10s, consideramos problemático
      const isOk = !error && latency < 10000
      
      setState(prev => ({
        ...prev,
        isSupabaseOk: isOk,
        lastCheck: new Date(),
        checking: false
      }))
      
      return isOk
    } catch (err) {
      setState(prev => ({
        ...prev,
        isSupabaseOk: false,
        lastCheck: new Date(),
        checking: false
      }))
      return false
    }
  }, [])

  const handleRetry = useCallback(() => {
    checkSupabase()
  }, [checkSupabase])

  // Monitorar status de rede do navegador
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }))
      checkSupabase()
    }
    
    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false, isSupabaseOk: false }))
    }

    // Estado inicial
    setState(prev => ({ ...prev, isOnline: navigator.onLine }))

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [checkSupabase])

  // Ping periódico no Supabase (a cada 30s)
  useEffect(() => {
    // Check inicial
    checkSupabase()

    // Intervalo de 30 segundos
    const interval = setInterval(() => {
      if (navigator.onLine) {
        checkSupabase()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [checkSupabase])

  // Se tudo OK, não mostra nada
  if (state.isOnline && state.isSupabaseOk) {
    return null
  }

  // Determinar mensagem e ícone
  let message = ''
  let Icon = AlertTriangle

  if (!state.isOnline) {
    message = '⚠️ Sem conexão com a internet. Verifique sua rede.'
    Icon = WifiOff
  } else if (!state.isSupabaseOk) {
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
