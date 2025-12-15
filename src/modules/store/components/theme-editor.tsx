'use client'

import { useState } from 'react'
import { Save, Loader2, Check, LayoutGrid, List, Grid3X3, Rows3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { updateMenuThemeAction } from '../actions'
import type { MenuTheme, MenuLayout } from '../types'

interface ThemeEditorProps {
  storeId: string
  slug: string
  initialTheme: MenuTheme
  onThemeChange?: (theme: MenuTheme) => void
}

const LAYOUT_OPTIONS: { id: MenuLayout; name: string; icon: React.ElementType; description: string }[] = [
  { id: 'classic', name: 'Clássico', icon: Rows3, description: 'Lista tradicional' },
  { id: 'modern', name: 'Moderno', icon: LayoutGrid, description: 'Cards grandes' },
  { id: 'grid', name: 'Grade', icon: Grid3X3, description: 'Grid compacto' },
  { id: 'minimal', name: 'Minimalista', icon: List, description: 'Foco no texto' },
]

export function ThemeEditor({ storeId, slug, initialTheme, onThemeChange }: ThemeEditorProps) {
  const [theme, setTheme] = useState<MenuTheme>(initialTheme)
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleThemeChange = (newTheme: MenuTheme) => {
    setTheme(newTheme)
    onThemeChange?.(newTheme)
  }

  const handleLayoutChange = (layout: MenuLayout) => {
    handleThemeChange({ ...theme, layout })
  }

  const handleColorChange = (key: keyof MenuTheme['colors'], value: string) => {
    handleThemeChange({
      ...theme,
      colors: { ...theme.colors, [key]: value }
    })
  }

  const handleDisplayChange = (key: keyof MenuTheme['display'], value: boolean) => {
    handleThemeChange({
      ...theme,
      display: { ...theme.display, [key]: value }
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const result = await updateMenuThemeAction(storeId, theme, slug)
      if (result.success) {
        setShowSuccess(true)
        toast.success('Tema salvo com sucesso!')
        setTimeout(() => setShowSuccess(false), 2000)
      } else {
        toast.error(result.error || 'Erro ao salvar tema')
      }
    } catch (error) {
      console.error('Erro ao salvar tema:', error)
      toast.error('Erro ao salvar tema')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Editor de Tema</h2>
          <p className="text-sm text-slate-500">Personalize a aparência do seu cardápio</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className={cn(
            'transition-all',
            showSuccess && 'bg-green-500 hover:bg-green-600'
          )}
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : showSuccess ? (
            <Check className="w-4 h-4 mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {showSuccess ? 'Salvo!' : 'Salvar Tema'}
        </Button>
      </div>

      {/* Layout Selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-slate-700">Layout do Cardápio</Label>
        <div className="grid grid-cols-2 gap-3">
          {LAYOUT_OPTIONS.map((option) => {
            const Icon = option.icon
            const isSelected = theme.layout === option.id
            
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleLayoutChange(option.id)}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200',
                  isSelected
                    ? 'border-red-500 bg-red-50 shadow-lg shadow-red-500/10'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                )}
              >
                <div className={cn(
                  'w-12 h-12 rounded-lg flex items-center justify-center transition-colors',
                  isSelected ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-500'
                )}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <p className={cn(
                    'font-medium text-sm',
                    isSelected ? 'text-red-700' : 'text-slate-700'
                  )}>
                    {option.name}
                  </p>
                  <p className="text-xs text-slate-500">{option.description}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Colors */}
      <div className="space-y-4">
        <Label className="text-sm font-medium text-slate-700">Cores</Label>
        
        <div className="space-y-3">
          {/* Primary Color */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-slate-700">Cor Principal</p>
              <p className="text-xs text-slate-500">Botões e destaques</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme.colors.primary}
                onChange={(e) => handleColorChange('primary', e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-200"
              />
              <span className="text-xs font-mono text-slate-500 uppercase w-16">
                {theme.colors.primary}
              </span>
            </div>
          </div>

          {/* Background Color */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-slate-700">Cor de Fundo</p>
              <p className="text-xs text-slate-500">Fundo da página</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme.colors.background}
                onChange={(e) => handleColorChange('background', e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-200"
              />
              <span className="text-xs font-mono text-slate-500 uppercase w-16">
                {theme.colors.background}
              </span>
            </div>
          </div>

          {/* Header Color */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-slate-700">Cor do Cabeçalho</p>
              <p className="text-xs text-slate-500">Topo do cardápio</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme.colors.header}
                onChange={(e) => handleColorChange('header', e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-200"
              />
              <span className="text-xs font-mono text-slate-500 uppercase w-16">
                {theme.colors.header}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Display Options */}
      <div className="space-y-4">
        <Label className="text-sm font-medium text-slate-700">Elementos Visíveis</Label>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-slate-700">Exibir Banner</p>
              <p className="text-xs text-slate-500">Imagem de capa no topo</p>
            </div>
            <Switch
              checked={theme.display.showBanner}
              onCheckedChange={(checked) => handleDisplayChange('showBanner', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-slate-700">Exibir Logo</p>
              <p className="text-xs text-slate-500">Logo da loja</p>
            </div>
            <Switch
              checked={theme.display.showLogo}
              onCheckedChange={(checked) => handleDisplayChange('showLogo', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-slate-700">Exibir Busca</p>
              <p className="text-xs text-slate-500">Campo de pesquisa</p>
            </div>
            <Switch
              checked={theme.display.showSearch}
              onCheckedChange={(checked) => handleDisplayChange('showSearch', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-slate-700">Exibir Endereço</p>
              <p className="text-xs text-slate-500">Localização da loja</p>
            </div>
            <Switch
              checked={theme.display.showAddress}
              onCheckedChange={(checked) => handleDisplayChange('showAddress', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-slate-700">Exibir Redes Sociais</p>
              <p className="text-xs text-slate-500">Links para Instagram, Facebook, etc</p>
            </div>
            <Switch
              checked={theme.display.showSocial}
              onCheckedChange={(checked) => handleDisplayChange('showSocial', checked)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
