/**
 * Componente para selecionar cores do minisite
 */

'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Palette, RotateCcw } from 'lucide-react'
import type { ThemeColors } from '../types'

const PRESET_COLORS = [
  '#ea1d2c', '#7C3AED', '#2563EB', '#059669', 
  '#D97706', '#DC2626', '#EC4899', '#8B5CF6',
]

interface ColorPickerProps {
  colors: ThemeColors
  onChange: (key: keyof ThemeColors, value: string) => void
}

const COLOR_LABELS: Record<keyof ThemeColors, string> = {
  primary: 'Cor Principal',
  background: 'Fundo',
  header: 'Cabeçalho',
}

export function ColorPicker({ colors, onChange }: ColorPickerProps) {
  return (
    <div className="space-y-4">
      {(Object.keys(COLOR_LABELS) as Array<keyof ThemeColors>).map((key) => (
        <div key={key} className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            {COLOR_LABELS[key]}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={colors[key]}
              onChange={(e) => onChange(key, e.target.value)}
              className="w-10 h-10 rounded-lg cursor-pointer border-0"
            />
            <input
              type="text"
              value={colors[key]}
              onChange={(e) => onChange(key, e.target.value)}
              className="flex-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              placeholder="#000000"
            />
          </div>
          {key === 'primary' && (
            <div className="flex flex-wrap gap-2 mt-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => onChange('primary', color)}
                  className={cn(
                    'w-8 h-8 rounded-full border-2 transition-transform hover:scale-110',
                    colors.primary === color ? 'border-slate-900 scale-110' : 'border-transparent'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
