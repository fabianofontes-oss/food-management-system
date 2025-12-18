'use client'

import { Scale, Settings, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { ScaleLayout } from '../types'

interface ScaleDisplayProps {
  weight: number
  connected: boolean
  layout: ScaleLayout
  onLayoutChange: (layout: ScaleLayout) => void
  darkMode?: boolean
}

const SCALE_LAYOUTS: { type: ScaleLayout; label: string }[] = [
  { type: 'large', label: 'Grande' },
  { type: 'compact', label: 'Compacto' },
  { type: 'minimal', label: 'Mínimo' },
  { type: 'hidden', label: 'Oculto' },
]

export function ScaleDisplay({
  weight,
  connected,
  layout,
  onLayoutChange,
  darkMode = false
}: ScaleDisplayProps) {
  const [showMenu, setShowMenu] = useState(false)

  if (layout === 'hidden') {
    return (
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex-shrink-0 mx-4 mt-4 mb-2 p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 text-xs flex items-center gap-1 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors relative"
      >
        <Scale className="w-4 h-4" />
        <span>Balança</span>
        <ChevronDown className="w-3 h-3" />
        
        {showMenu && (
          <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50 min-w-[120px]">
            {SCALE_LAYOUTS.map(({ type, label }) => (
              <button
                key={type}
                onClick={(e) => { e.stopPropagation(); onLayoutChange(type); setShowMenu(false) }}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  layout === type ? 'text-blue-600 font-medium' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </button>
    )
  }

  const bgColor = connected 
    ? 'bg-gradient-to-r from-emerald-500 to-green-600' 
    : 'bg-gradient-to-r from-gray-400 to-gray-500'

  // LAYOUT GRANDE
  if (layout === 'large') {
    return (
      <div className={`flex-shrink-0 mx-4 mt-4 mb-3 rounded-xl overflow-hidden ${bgColor} relative`}>
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <Scale className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">
                {connected ? 'BALANÇA ONLINE' : 'BALANÇA OFFLINE'}
              </p>
              <p className="text-white/70 text-xs">
                {connected ? 'Pronta para uso' : 'Aguardando conexão'}
              </p>
            </div>
          </div>
          <div className="text-right bg-black/20 px-6 py-3 rounded-xl">
            <p className="text-white/60 text-[10px] uppercase tracking-widest">PESO</p>
            <p className="font-mono font-black text-4xl text-white leading-none">
              {weight.toFixed(3)}
            </p>
            <p className="text-white/80 text-sm font-medium">kg</p>
          </div>
        </div>
        
        {/* Botão config */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
        >
          <Settings className="w-4 h-4 text-white/70" />
        </button>
        
        {showMenu && (
          <div className="absolute top-10 right-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50 min-w-[120px]">
            {SCALE_LAYOUTS.map(({ type, label }) => (
              <button
                key={type}
                onClick={() => { onLayoutChange(type); setShowMenu(false) }}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  layout === type ? 'text-blue-600 font-medium' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // LAYOUT COMPACTO
  if (layout === 'compact') {
    return (
      <div className={`flex-shrink-0 mx-4 mt-4 mb-3 rounded-lg overflow-hidden ${bgColor} relative`}>
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/20 rounded-lg">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <p className="text-white font-semibold text-xs">
              {connected ? 'ONLINE' : 'OFFLINE'}
            </p>
          </div>
          <div className="text-right bg-black/20 px-4 py-1.5 rounded-lg">
            <p className="font-mono font-black text-2xl text-white leading-none">
              {weight.toFixed(3)}
            </p>
            <p className="text-white/70 text-[10px]">kg</p>
          </div>
        </div>
        
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="absolute top-1.5 right-1.5 p-1 rounded bg-white/10 hover:bg-white/20 transition-colors"
        >
          <Settings className="w-3 h-3 text-white/70" />
        </button>
        
        {showMenu && (
          <div className="absolute top-8 right-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50 min-w-[120px]">
            {SCALE_LAYOUTS.map(({ type, label }) => (
              <button
                key={type}
                onClick={() => { onLayoutChange(type); setShowMenu(false) }}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  layout === type ? 'text-blue-600 font-medium' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // LAYOUT MÍNIMO
  return (
    <div className={`flex-shrink-0 mx-4 mt-4 mb-2 rounded-lg overflow-hidden ${bgColor} relative`}>
      <div className="flex items-center justify-between px-3 py-1.5">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-white" />
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-300' : 'bg-red-300'}`} />
        </div>
        <p className="font-mono font-bold text-lg text-white">
          {weight.toFixed(3)} <span className="text-xs text-white/70">kg</span>
        </p>
        
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-1 rounded bg-white/10 hover:bg-white/20 transition-colors"
        >
          <Settings className="w-3 h-3 text-white/70" />
        </button>
      </div>
      
      {showMenu && (
        <div className="absolute top-full right-1 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50 min-w-[120px]">
          {SCALE_LAYOUTS.map(({ type, label }) => (
            <button
              key={type}
              onClick={() => { onLayoutChange(type); setShowMenu(false) }}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                layout === type ? 'text-blue-600 font-medium' : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
