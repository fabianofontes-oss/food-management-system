'use client'

import { Switch } from '@/components/ui/switch'
import { Image, MapPin, Share2, Search, Store } from 'lucide-react'
import type { MenuThemeDisplay } from '../../types'

interface DisplayTogglesProps {
  display: MenuThemeDisplay
  onChange: (key: keyof MenuThemeDisplay, value: boolean) => void
}

const toggleOptions: { key: keyof MenuThemeDisplay; label: string; description: string; icon: React.ElementType }[] = [
  { key: 'showBanner', label: 'Banner', description: 'Exibir imagem de banner no topo', icon: Image },
  { key: 'showLogo', label: 'Logo', description: 'Exibir logo da loja', icon: Store },
  { key: 'showSearch', label: 'Busca', description: 'Exibir campo de busca', icon: Search },
  { key: 'showAddress', label: 'Endereço', description: 'Exibir endereço da loja', icon: MapPin },
  { key: 'showSocial', label: 'Redes Sociais', description: 'Exibir links sociais', icon: Share2 },
]

export function DisplayToggles({ display, onChange }: DisplayTogglesProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-slate-700">Elementos Visíveis</label>
      <div className="space-y-2">
        {toggleOptions.map((option) => {
          const Icon = option.icon
          const isEnabled = display[option.key]
          
          return (
            <div
              key={option.key}
              className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  isEnabled ? 'bg-violet-100 text-violet-600' : 'bg-slate-100 text-slate-400'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">{option.label}</p>
                  <p className="text-xs text-slate-500">{option.description}</p>
                </div>
              </div>
              <Switch
                checked={isEnabled}
                onCheckedChange={(checked) => onChange(option.key, checked)}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
