'use client'

import { LayoutGrid } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { CategoryRow } from '../types'

interface CategoryListProps {
  categories: CategoryRow[]
  selectedId: string | null
  onSelect: (categoryId: string | null) => void
}

export function CategoryList({ categories, selectedId, onSelect }: CategoryListProps) {
  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-2 pb-3">
        {/* Botão "Todos" */}
        <Button
          variant={selectedId === null ? 'default' : 'outline'}
          size="sm"
          className={cn(
            'rounded-full px-4 transition-all',
            selectedId === null && 'bg-gradient-to-r from-blue-500 to-indigo-600 shadow-md'
          )}
          onClick={() => onSelect(null)}
        >
          <LayoutGrid className="w-4 h-4 mr-2" />
          Todos
        </Button>

        {/* Categorias */}
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedId === category.id ? 'default' : 'outline'}
            size="sm"
            className={cn(
              'rounded-full px-4 transition-all',
              selectedId === category.id && 'bg-gradient-to-r from-blue-500 to-indigo-600 shadow-md'
            )}
            onClick={() => onSelect(category.id)}
          >
            {category.name}
          </Button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}
