/**
 * Editor de tema do minisite - Componente principal
 * Compacto e organizado em abas
 */

'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Save, RotateCcw, Loader2, Check } from 'lucide-react'
import { toast } from 'sonner'

import { LayoutPicker } from './layout-picker'
import { ColorPicker } from './color-picker'
import { DisplayToggles } from './display-toggles'
import { ImageUploader } from './image-uploader'
import { useMinisiteTheme } from '../hooks/use-minisite-theme'
import type { MinisiteTheme } from '../types'

interface ThemeEditorProps {
  storeId: string
  initialTheme?: MinisiteTheme
  logoUrl?: string | null
  bannerUrl?: string | null
}

export function ThemeEditor({ storeId, initialTheme, logoUrl, bannerUrl }: ThemeEditorProps) {
  const [showSuccess, setShowSuccess] = useState(false)
  const [logoUrlState, setLogoUrlState] = useState<string | null>(logoUrl ?? null)
  const [bannerUrlState, setBannerUrlState] = useState<string | null>(bannerUrl ?? null)

  const {
    theme,
    updateLayout,
    updateColor,
    updateDisplay,
    save,
    reset,
    isSaving,
    hasChanges,
  } = useMinisiteTheme(storeId, initialTheme)

  const handleSave = async () => {
    const success = await save()
    if (success) {
      setShowSuccess(true)
      toast.success('Tema salvo com sucesso!')
      setTimeout(() => setShowSuccess(false), 2000)
    } else {
      toast.error('Erro ao salvar tema')
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="font-semibold text-slate-800">Personalizar Cardápio</h2>
        <div className="flex gap-2">
          {hasChanges && (
            <Button variant="ghost" size="sm" onClick={reset}>
              <RotateCcw className="w-4 h-4 mr-1" />
              Resetar
            </Button>
          )}
          <Button 
            size="sm" 
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="bg-violet-600 hover:bg-violet-700"
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

      {/* Tabs */}
      <Tabs defaultValue="layout" className="p-4">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="layout">Layout</TabsTrigger>
          <TabsTrigger value="colors">Cores</TabsTrigger>
          <TabsTrigger value="display">Elementos</TabsTrigger>
          <TabsTrigger value="images">Imagens</TabsTrigger>
        </TabsList>

        <TabsContent value="layout">
          <LayoutPicker value={theme.layout} onChange={updateLayout} />
        </TabsContent>

        <TabsContent value="colors">
          <ColorPicker colors={theme.colors} onChange={updateColor} />
        </TabsContent>

        <TabsContent value="display">
          <DisplayToggles display={theme.display} onChange={updateDisplay} />
        </TabsContent>

        <TabsContent value="images">
          <div className="space-y-6">
            <ImageUploader
              storeId={storeId}
              type="banner"
              label="Banner do Cardápio"
              description="Imagem de capa (recomendado: 1200x400)"
              value={bannerUrlState}
              aspectRatio="banner"
              onChange={(url) => setBannerUrlState(url)}
            />
            <ImageUploader
              storeId={storeId}
              type="logo"
              label="Logo da Loja"
              description="Logo (recomendado: 200x200)"
              value={logoUrlState}
              aspectRatio="square"
              onChange={(url) => setLogoUrlState(url)}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Aviso de alterações */}
      {hasChanges && (
        <div className="p-3 bg-amber-50 border-t border-amber-200 text-center">
          <p className="text-xs text-amber-700">
            Você tem alterações não salvas
          </p>
        </div>
      )}
    </div>
  )
}
