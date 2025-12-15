'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { StoreRepository } from '../repository'
import type { StoreWithSettings, StoreSettings } from '../types'

interface UseStoreReturn {
  store: StoreWithSettings | null
  storeId: string | null
  settings: StoreSettings | null
  slug: string | null
  loading: boolean
  error: string | null
  reload: () => Promise<void>
}

/**
 * Hook para acessar dados da loja atual (baseado no slug da URL)
 */
export function useStore(): UseStoreReturn {
  const params = useParams()
  const slug = params.slug as string | undefined

  const [store, setStore] = useState<StoreWithSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStore = useCallback(async () => {
    if (!slug) {
      setLoading(false)
      setStore(null)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const data = await StoreRepository.getBySlug(slug)

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
    settings: store?.parsedSettings || null,
    slug: slug || null,
    loading,
    error,
    reload: loadStore
  }
}

/**
 * Hook simplificado que só retorna o storeId
 */
export function useStoreId(): string | null {
  const { storeId } = useStore()
  return storeId
}

/**
 * Hook simplificado que só retorna as settings
 */
export function useStoreSettings(): StoreSettings | null {
  const { settings } = useStore()
  return settings
}

/**
 * Hook para buscar loja por ID (não depende da URL)
 */
export function useStoreById(storeId: string | null) {
  const [store, setStore] = useState<StoreWithSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStore = useCallback(async () => {
    if (!storeId) {
      setLoading(false)
      setStore(null)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const data = await StoreRepository.getById(storeId)

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
  }, [storeId])

  useEffect(() => {
    loadStore()
  }, [loadStore])

  return {
    store,
    settings: store?.parsedSettings || null,
    loading,
    error,
    reload: loadStore
  }
}
