'use client'

import { useState } from 'react'
import { Save, RotateCcw, Loader2, Check, Palette, Layout, Eye, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useMenuTheme } from '../../hooks/use-menu-theme'
import { LayoutSelector } from './layout-selector'
import { ColorPicker } from './color-picker'
import { DisplayToggles } from './display-toggles'
import { LivePreview } from './live-preview'
import { ImageUploader } from './image-uploader'
import type { MenuTheme, StoreWithSettings } from '../../types'

interface SiteBuilderProps {
  storeId: string
  store: StoreWithSettings | null
  initialTheme: MenuTheme
}

type TabId = 'layout' | 'colors' | 'images' | 'display'

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'layout', label: 'Layout', icon: Layout },
  { id: 'colors', label: 'Cores', icon: Palette },
  { id: 'images', label: 'Imagens', icon: ImageIcon },
  { id: 'display', label: 'Elementos', icon: Eye },
]

export function SiteBuilder({ storeId, store, initialTheme }: SiteBuilderProps) {
  const [activeTab, setActiveTab] = useState<TabId>('layout')
  const [showSuccess, setShowSuccess] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(store?.logo_url || null)

  // DEBUG: Log para verificar storeId
  console.log('[SiteBuilder] storeId:', storeId, 'store:', store?.name)
  
  const {
    theme,
    updateLayout,
    updateColor,
    updateDisplay,
    updateBanner,
    save,
    reset,
    isSaving,
    hasChanges
  } = useMenuTheme(storeId, initialTheme)

  const handleSave = async () => {
    const success = await save()
    if (success) {
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 2000)
    }
  }

  return (
    <div className="h-[calc(100vh-120px)] flex gap-6">
      <div className="w-[400px] flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-800">Personalizar Cardápio</h2>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Button
                variant="ghost"
                size="sm"
                onClick={reset}
                className="text-slate-500 hover:text-slate-700"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Resetar
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className={cn(
                'transition-all',
                showSuccess && 'bg-green-500 hover:bg-green-600'
              )}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : showSuccess ? (
                <Check className="w-4 h-4 mr-1" />
              ) : (
                <Save className="w-4 h-4 mr-1" />
              )}
              {showSuccess ? 'Salvo!' : 'Salvar'}
            </Button>
          </div>
        </div>

        <div className="flex border-b border-slate-200">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors border-b-2',
                  activeTab === tab.id
                    ? 'border-violet-500 text-violet-600 bg-violet-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {activeTab === 'layout' && (
            <LayoutSelector value={theme.layout} onChange={updateLayout} />
          )}

          {activeTab === 'colors' && (
            <div className="space-y-4">
              <ColorPicker
                label="Cor Principal"
                value={theme.colors.primary}
                onChange={(color) => updateColor('primary', color)}
              />
              <ColorPicker
                label="Cor de Fundo"
                value={theme.colors.background}
                onChange={(color) => updateColor('background', color)}
                presets={['#FFFFFF', '#F8FAFC', '#F1F5F9', '#FEF3C7', '#ECFDF5', '#EFF6FF', '#FDF2F8', '#1F2937', '#111827', '#000000']}
              />
              <ColorPicker
                label="Cor do Cabeçalho"
                value={theme.colors.header}
                onChange={(color) => updateColor('header', color)}
              />
            </div>
          )}

          {activeTab === 'images' && (
            <div className="space-y-6">
              <ImageUploader
                label="Banner da Loja"
                description="Imagem de capa que aparece no topo do cardápio (recomendado: 1200x400px)"
                value={theme.bannerUrl || store?.banner_url || null}
                onChange={(url) => updateBanner(url)}
                storeId={storeId}
                type="banner"
                aspectRatio="banner"
              />
              <ImageUploader
                label="Logo da Loja"
                description="Logo que aparece no cabeçalho (recomendado: 200x200px)"
                value={logoUrl}
                onChange={(url) => setLogoUrl(url)}
                storeId={storeId}
                type="logo"
                aspectRatio="square"
              />
              <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
                <strong>Dica:</strong> O banner é salvo no tema do cardápio. O logo é compartilhado em toda a loja e pode ser alterado em Configurações → Dados da Loja.
              </p>
            </div>
          )}

          {activeTab === 'display' && (
            <DisplayToggles 
              display={theme.display} 
              onChange={updateDisplay} 
            />
          )}
        </div>

        {hasChanges && (
          <div className="p-4 bg-amber-50 border-t border-amber-200">
            <p className="text-xs text-amber-700 text-center">
              Você tem alterações não salvas
            </p>
          </div>
        )}
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <LivePreview theme={theme} store={store} />
      </div>
    </div>
  )
}
