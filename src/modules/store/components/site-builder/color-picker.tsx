'use client'

import { useState } from 'react'
import { Palette } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ColorPickerProps {
  label: string
  value: string
  onChange: (color: string) => void
  presets?: string[]
}

const defaultPresets = [
  '#8B5CF6', // Violet
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#1F2937', // Gray dark
  '#000000', // Black
]

export function ColorPicker({ 
  label, 
  value, 
  onChange, 
  presets = defaultPresets 
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 w-full p-3 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors bg-white"
        >
          <div 
            className="w-8 h-8 rounded-lg border border-slate-200 shadow-inner"
            style={{ backgroundColor: value }}
          />
          <span className="text-sm text-slate-600 font-mono uppercase">{value}</span>
          <Palette className="w-4 h-4 text-slate-400 ml-auto" />
        </button>

        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)} 
            />
            <div className="absolute top-full left-0 mt-2 p-4 bg-white rounded-xl border border-slate-200 shadow-xl z-20 w-full">
              <div className="space-y-4">
                <div className="grid grid-cols-5 gap-2">
                  {presets.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => {
                        onChange(color)
                        setIsOpen(false)
                      }}
                      className={cn(
                        'w-10 h-10 rounded-lg border-2 transition-all hover:scale-110',
                        value === color 
                          ? 'border-slate-900 ring-2 ring-offset-2 ring-slate-400' 
                          : 'border-transparent'
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <label className="text-xs text-slate-500">Personalizado:</label>
                  <input
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="flex-1 px-2 py-1 text-sm font-mono border border-slate-200 rounded"
                    placeholder="#000000"
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
