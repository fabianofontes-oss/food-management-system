/**
 * Componente para toggles de exibição do minisite
 */

'use client'

import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import type { ThemeDisplay } from '../types'
import { Image, User, Search, MapPin, Share2 } from 'lucide-react'

interface DisplayTogglesProps {
  display: ThemeDisplay
  onChange: (key: keyof ThemeDisplay, value: boolean) => void
}

const TOGGLE_OPTIONS: { key: keyof ThemeDisplay; label: string; icon: React.ElementType }[] = [
  { key: 'showBanner', label: 'Banner', icon: Image },
  { key: 'showLogo', label: 'Logo', icon: User },
  { key: 'showSearch', label: 'Busca', icon: Search },
  { key: 'showAddress', label: 'Endereço', icon: MapPin },
  { key: 'showSocial', label: 'Redes Sociais', icon: Share2 },
]

export function DisplayToggles({ display, onChange }: DisplayTogglesProps) {
  return (
    <div className="space-y-3">
      {TOGGLE_OPTIONS.map(({ key, label, icon: Icon }) => (
        <div 
          key={key}
          className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
        >
          <div className="flex items-center gap-3">
            <Icon className="w-4 h-4 text-slate-500" />
            <Label htmlFor={key} className="text-sm font-medium cursor-pointer">
              {label}
            </Label>
          </div>
          <Switch
            id={key}
            checked={display[key]}
            onCheckedChange={(checked) => onChange(key, checked)}
          />
        </div>
      ))}
    </div>
  )
}
