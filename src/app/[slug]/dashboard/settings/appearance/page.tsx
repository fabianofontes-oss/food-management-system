'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Loader2, Palette } from 'lucide-react'
import { useDashboardStoreId } from '../../DashboardClient'
import { ThemeEditor } from '@/modules/store/components/theme-editor'
import { StorePreview } from '@/modules/store/components/store-preview'
import { StoreRepository, DEFAULT_MENU_THEME } from '@/modules/store'
import type { MenuTheme, StoreWithSettings } from '@/modules/store'

export default function AppearanceSettingsPage() {
  const params = useParams()
  const slug = params.slug as string
  const storeId = useDashboardStoreId()

  const [store, setStore] = useState<StoreWithSettings | null>(null)
  const [theme, setTheme] = useState<MenuTheme>(DEFAULT_MENU_THEME)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!storeId) return

    const loadStore = async () => {
      setIsLoading(true)
      try {
        const storeData = await StoreRepository.getById(storeId)
        if (storeData) {
          setStore(storeData)
          setTheme(storeData.parsedTheme || DEFAULT_MENU_THEME)
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
          <Palette className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Aparência do Cardápio</h1>
          <p className="text-sm text-slate-500">Personalize cores, layout e elementos visíveis</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-[400px_1fr] gap-6 min-h-[700px]">
        {/* Editor Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-y-auto max-h-[800px]">
          <ThemeEditor
            storeId={storeId}
            slug={slug}
            initialTheme={theme}
            onThemeChange={setTheme}
          />
        </div>

        {/* Preview Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <StorePreview theme={theme} store={store} />
        </div>
      </div>
    </div>
  )
}
