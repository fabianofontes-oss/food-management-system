'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { storeService, type Store } from '@/services/store.service'

interface UseStoreReturn {
  store: Store | null
  storeId: string | null
  loading: boolean
  error: string | null
  reload: () => Promise<void>
}

export function useStore(): UseStoreReturn {
  const params = useParams()
  const slug = params.slug as string
  
  const [store, setStore] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStore = useCallback(async () => {
    if (!slug) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const data = await storeService.getBySlug(slug)
      
      if (!data) {
        setError('Loja não encontrada')
        setStore(null)
      } else {
        setStore(data)
      }
    } catch (err) {
      console.error('Erro ao carregar loja:', err)
      setError('Erro ao carregar loja')
      setStore(null)
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    loadStore()
  }, [loadStore])

  return {
    store,
    storeId: store?.id || null,
    loading,
    error,
    reload: loadStore
  }
}

// Hook simplificado que só retorna o storeId
export function useStoreId(): string | null {
  const { storeId } = useStore()
  return storeId
}
