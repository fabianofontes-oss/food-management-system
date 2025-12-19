'use client'

import { LayoutGrid, Rows3, Grid3X3, List, Smartphone } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MenuLayout } from '../../types'

interface LayoutSelectorProps {
  value: MenuLayout
  onChange: (layout: MenuLayout) => void
}

const layouts: { id: MenuLayout; name: string; icon: React.ElementType; description: string }[] = [
  { id: 'app', name: 'App Mobile', icon: Smartphone, description: 'Estilo aplicativo nativo' },
  { id: 'modern', name: 'Moderno', icon: LayoutGrid, description: 'Cards grandes com destaque' },
  { id: 'classic', name: 'Clássico', icon: Rows3, description: 'Lista tradicional com imagens' },
  { id: 'grid', name: 'Grade', icon: Grid3X3, description: 'Grade compacta de produtos' },
  { id: 'minimal', name: 'Minimalista', icon: List, description: 'Foco no texto, sem imagens' },
]

export function LayoutSelector({ value, onChange }: LayoutSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-slate-700">Layout do Cardápio</label>
      <div className="grid grid-cols-2 gap-3">
        {layouts.map((layout) => {
          const Icon = layout.icon
          const isSelected = value === layout.id
          
          return (
            <button
              key={layout.id}
              type="button"
              onClick={() => onChange(layout.id)}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200',
                isSelected
                  ? 'border-violet-500 bg-violet-50 shadow-lg shadow-violet-500/10'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              )}
            >
              <div className={cn(
                'w-12 h-12 rounded-lg flex items-center justify-center transition-colors',
                isSelected ? 'bg-violet-500 text-white' : 'bg-slate-100 text-slate-500'
              )}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="text-center">
                <p className={cn(
                  'font-medium text-sm',
                  isSelected ? 'text-violet-700' : 'text-slate-700'
                )}>
                  {layout.name}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{layout.description}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
