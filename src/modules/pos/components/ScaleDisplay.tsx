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
  { type: 'large', label: 'Digital' },
  { type: 'compact', label: 'Clássico' },
  { type: 'minimal', label: 'Barra' },
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
  
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white'
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-200'
  const textColor = darkMode ? 'text-white' : 'text-gray-900'

  const LayoutMenu = () => (
    <div className={`absolute top-full right-0 mt-1 ${cardBg} rounded-lg shadow-xl border ${borderColor} py-1 z-50 min-w-[120px]`}>
      {SCALE_LAYOUTS.map(({ type, label }) => (
        <button
          key={type}
          onClick={(e) => { e.stopPropagation(); onLayoutChange(type); setShowMenu(false) }}
          className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
            layout === type ? 'text-emerald-600 font-semibold' : darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )

  // OCULTO - Botão discreto
  if (layout === 'hidden') {
    return (
      <div className="relative px-4 pt-4 pb-2">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className={`w-full p-2 rounded-lg ${cardBg} border ${borderColor} text-gray-400 text-xs flex items-center justify-center gap-2 hover:border-emerald-400 transition-colors`}
        >
          <Scale className="w-4 h-4" />
          <span>Mostrar Balança</span>
          <ChevronDown className="w-3 h-3" />
        </button>
        {showMenu && <LayoutMenu />}
      </div>
    )
  }

  // LAYOUT DIGITAL - Display estilo LED
  if (layout === 'large') {
    return (
      <div className="relative px-4 pt-4 pb-3">
        <div className={`${cardBg} border-2 ${connected ? 'border-emerald-500' : borderColor} rounded-xl overflow-hidden`}>
          {/* Header */}
          <div className={`flex items-center justify-between px-3 py-2 ${connected ? 'bg-emerald-500' : 'bg-gray-400'}`}>
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-white" />
              <span className="text-white font-semibold text-xs uppercase tracking-wide">
                {connected ? 'Balança Online' : 'Balança Offline'}
              </span>
            </div>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded hover:bg-white/20 transition-colors"
            >
              <Settings className="w-4 h-4 text-white/80" />
            </button>
          </div>
          
          {/* Display LED */}
          <div className="bg-gray-900 p-4">
            <div className="bg-black rounded-lg p-4 border border-gray-700">
              <p className="text-center font-mono font-black text-5xl text-emerald-400 tracking-wider" style={{ textShadow: '0 0 20px rgba(16, 185, 129, 0.5)' }}>
                {weight.toFixed(3)}
              </p>
              <p className="text-center text-emerald-500/70 text-sm mt-1 font-medium tracking-widest">QUILOGRAMAS</p>
            </div>
          </div>
        </div>
        {showMenu && <LayoutMenu />}
      </div>
    )
  }

  // LAYOUT CLÁSSICO - Card clean
  if (layout === 'compact') {
    return (
      <div className="relative px-4 pt-4 pb-3">
        <div className={`${cardBg} border ${borderColor} rounded-xl p-4`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${connected ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                <Scale className={`w-5 h-5 ${connected ? 'text-emerald-600' : 'text-gray-400'}`} />
              </div>
              <div>
                <p className={`font-semibold text-sm ${textColor}`}>Balança</p>
                <p className={`text-xs ${connected ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {connected ? '● Online' : '○ Offline'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={`p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
            >
              <Settings className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          
          <div className={`text-center py-3 rounded-lg ${connected ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-gray-50 dark:bg-gray-700/50'}`}>
            <p className={`font-mono font-black text-4xl ${connected ? 'text-emerald-600' : 'text-gray-400'}`}>
              {weight.toFixed(3)}
            </p>
            <p className={`text-xs font-medium ${connected ? 'text-emerald-500' : 'text-gray-400'}`}>kg</p>
          </div>
        </div>
        {showMenu && <LayoutMenu />}
      </div>
    )
  }

  // LAYOUT BARRA - Inline minimalista
  return (
    <div className="relative px-4 pt-4 pb-2">
      <div className={`${cardBg} border ${borderColor} rounded-lg px-3 py-2 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <Scale className={`w-4 h-4 ${connected ? 'text-emerald-500' : 'text-gray-400'}`} />
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
        </div>
        
        <p className={`font-mono font-bold text-xl ${connected ? 'text-emerald-600' : 'text-gray-400'}`}>
          {weight.toFixed(3)} <span className="text-sm font-normal text-gray-400">kg</span>
        </p>
        
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <Settings className="w-4 h-4 text-gray-400" />
        </button>
      </div>
      {showMenu && <LayoutMenu />}
    </div>
  )
}
