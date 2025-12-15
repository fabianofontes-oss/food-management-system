'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Loader2, Palette } from 'lucide-react'
import { useDashboardStoreId } from '../../DashboardClient'
import { SiteBuilder } from '@/modules/store/components/site-builder'
import { StoreRepository } from '@/modules/store'
import { safeParseTheme } from '@/modules/store/utils'
import type { MenuTheme, StoreWithSettings } from '@/modules/store'

export default function AppearanceSettingsPage() {
  const params = useParams()
  const slug = params.slug as string
  const storeId = useDashboardStoreId()

  const [store, setStore] = useState<StoreWithSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!storeId) return

    const loadStore = async () => {
      setIsLoading(true)
      try {
        const storeData = await StoreRepository.getById(storeId)
        if (storeData) {
          setStore(storeData)
        }
      } catch (error) {
        console.error('Erro ao carregar loja:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadStore()
  }, [storeId])

  if (!storeId) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-semibold text-slate-800">Loja não encontrada</div>
          <div className="text-sm text-slate-500">Não foi possível carregar as configurações.</div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          <p className="text-sm text-slate-500">Carregando configurações...</p>
        </div>
      </div>
    )
  }

  if (!store) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-semibold text-slate-800">Loja não encontrada</div>
          <div className="text-sm text-slate-500">Não foi possível carregar as configurações.</div>
        </div>
      </div>
    )
  }

  // BLINDAGEM: Garante que o editor sempre receba um objeto válido
  const safeTheme = safeParseTheme(store.parsedTheme)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium text-slate-800">Aparência da Loja</h3>
        <p className="text-sm text-muted-foreground">Personalize o visual do seu cardápio público.</p>
      </div>

      {/* Site Builder */}
      <SiteBuilder 
        storeId={store.id} 
        store={store} 
        initialTheme={safeTheme} 
      />
    </div>
  )
}
