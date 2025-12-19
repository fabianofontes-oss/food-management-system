/**
 * Componente para selecionar layout do minisite
 */

'use client'

import { cn } from '@/lib/utils'
import { LayoutType, LAYOUT_OPTIONS } from '../types'
import { LayoutGrid, List, Minimize2, Grid3X3 } from 'lucide-react'

const LAYOUT_ICONS: Record<LayoutType, React.ElementType> = {
  modern: LayoutGrid,
  classic: List,
  minimal: Minimize2,
  grid: Grid3X3,
}

interface LayoutPickerProps {
  value: LayoutType
  onChange: (layout: LayoutType) => void
}

export function LayoutPicker({ value, onChange }: LayoutPickerProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {LAYOUT_OPTIONS.map((option) => {
        const Icon = LAYOUT_ICONS[option.value]
        const isSelected = value === option.value
        
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'p-4 rounded-xl border-2 text-left transition-all',
              isSelected
                ? 'border-violet-500 bg-violet-50'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            )}
          >
            <Icon className={cn(
              'w-6 h-6 mb-2',
              isSelected ? 'text-violet-600' : 'text-slate-400'
            )} />
            <p className={cn(
              'font-medium text-sm',
              isSelected ? 'text-violet-900' : 'text-slate-700'
            )}>
              {option.label}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {option.description}
            </p>
          </button>
        )
      })}
    </div>
  )
}
