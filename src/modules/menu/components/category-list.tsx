'use client'

import { LayoutGrid } from 'lucide-react'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { CategoryRow } from '../types'

// Mapeamento de cores para Tailwind (fallback para cores personalizadas)
const COLOR_MAP: Record<string, { bg: string; hover: string; text: string }> = {
  red: { bg: 'bg-red-500', hover: 'hover:bg-red-600', text: 'text-red-600' },
  orange: { bg: 'bg-orange-500', hover: 'hover:bg-orange-600', text: 'text-orange-600' },
  amber: { bg: 'bg-amber-500', hover: 'hover:bg-amber-600', text: 'text-amber-600' },
  green: { bg: 'bg-green-500', hover: 'hover:bg-green-600', text: 'text-green-600' },
  blue: { bg: 'bg-blue-500', hover: 'hover:bg-blue-600', text: 'text-blue-600' },
  purple: { bg: 'bg-purple-500', hover: 'hover:bg-purple-600', text: 'text-purple-600' },
  stone: { bg: 'bg-stone-600', hover: 'hover:bg-stone-700', text: 'text-stone-600' },
  slate: { bg: 'bg-slate-800', hover: 'hover:bg-slate-900', text: 'text-slate-800' },
}

interface CategoryListProps {
  categories: CategoryRow[]
  selectedId: string | null
  onSelect: (categoryId: string | null) => void
}

export function CategoryList({ categories, selectedId, onSelect }: CategoryListProps) {
  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-2 pb-3">
        {/* Botão "Todos" - Sempre azul */}
        <button
          onClick={() => onSelect(null)}
          className={cn(
            'flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all',
            'min-h-[48px] min-w-[80px]',
            selectedId === null
              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
              : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50'
          )}
        >
          <LayoutGrid className="w-5 h-5" />
          Todos
        </button>

        {/* Categorias com Cores */}
        {categories.map((category) => {
          const isSelected = selectedId === category.id
          const colorKey = category.color as string | undefined
          const colorConfig = colorKey ? COLOR_MAP[colorKey] : null
          
          return (
            <button
              key={category.id}
              onClick={() => onSelect(category.id)}
              className={cn(
                'flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all',
                'min-h-[48px] whitespace-nowrap',
                isSelected && colorConfig
                  ? `${colorConfig.bg} ${colorConfig.hover} text-white shadow-lg`
                  : isSelected
                    ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30'
                    : colorConfig
                      ? `bg-white ${colorConfig.text} border-2 border-current hover:bg-opacity-10`
                      : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              )}
              style={
                isSelected && colorConfig
                  ? undefined
                  : colorConfig
                    ? { borderColor: 'currentColor' }
                    : undefined
              }
            >
              {/* Bolinha de cor */}
              {colorConfig && !isSelected && (
                <span className={cn('w-3 h-3 rounded-full', colorConfig.bg)} />
              )}
              {category.name}
            </button>
          )
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}
