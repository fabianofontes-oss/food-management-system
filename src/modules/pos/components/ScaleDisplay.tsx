'use client'

import { Scale, Settings, ChevronDown, Wifi, WifiOff } from 'lucide-react'
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
  { type: 'compact', label: 'Moderno' },
  { type: 'minimal', label: 'Compacto' },
  { type: 'hidden', label: 'Ocultar' },
]

export function ScaleDisplay({
  weight,
  connected,
  layout,
  onLayoutChange,
  darkMode = false
}: ScaleDisplayProps) {
  const [showMenu, setShowMenu] = useState(false)

  const LayoutMenu = () => (
    <div className="absolute top-full right-0 mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-2 z-50 min-w-[140px] overflow-hidden">
      <p className="px-3 py-1 text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Layout</p>
      {SCALE_LAYOUTS.map(({ type, label }) => (
        <button
          key={type}
          onClick={(e) => { e.stopPropagation(); onLayoutChange(type); setShowMenu(false) }}
          className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 ${
            layout === type ? 'text-blue-600 font-semibold bg-blue-50 dark:bg-blue-900/20' : 'text-gray-600 dark:text-gray-300'
          }`}
        >
          {layout === type && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
          {label}
        </button>
      ))}
    </div>
  )

  // OCULTO
  if (layout === 'hidden') {
    return (
      <div className="relative p-4">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="w-full py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 text-xs flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <Scale className="w-4 h-4" />
          <span>Balança</span>
          <ChevronDown className="w-3 h-3" />
        </button>
        {showMenu && <LayoutMenu />}
      </div>
    )
  }

  // LAYOUT DIGITAL - Display profissional estilo caixa registradora
  if (layout === 'large') {
    return (
      <div className="relative p-4">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl overflow-hidden shadow-2xl">
          {/* Barra superior */}
          <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-slate-400" />
              <span className="text-slate-300 text-xs font-medium uppercase tracking-wider">Balança Digital</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${connected ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                {connected ? <Wifi className="w-3 h-3 text-emerald-400" /> : <WifiOff className="w-3 h-3 text-red-400" />}
                <span className={`text-[10px] font-semibold ${connected ? 'text-emerald-400' : 'text-red-400'}`}>
                  {connected ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <Settings className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
          
          {/* Display principal */}
          <div className="p-5">
            <div className="bg-black rounded-xl p-5 border border-slate-700 shadow-inner">
              <div className="flex items-end justify-center gap-1">
                <span 
                  className={`font-mono font-black text-6xl tracking-tight ${connected ? 'text-emerald-400' : 'text-slate-500'}`}
                  style={{ textShadow: connected ? '0 0 30px rgba(16, 185, 129, 0.6), 0 0 60px rgba(16, 185, 129, 0.3)' : 'none' }}
                >
                  {weight.toFixed(3)}
                </span>
                <span className={`text-2xl font-bold mb-2 ${connected ? 'text-emerald-500/70' : 'text-slate-600'}`}>kg</span>
              </div>
            </div>
          </div>
        </div>
        {showMenu && <LayoutMenu />}
      </div>
    )
  }

  // LAYOUT MODERNO - Gradiente colorido
  if (layout === 'compact') {
    return (
      <div className="relative p-4">
        <div className={`rounded-2xl overflow-hidden shadow-xl ${
          connected 
            ? 'bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600' 
            : 'bg-gradient-to-br from-slate-400 to-slate-500'
        }`}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Scale className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Balança</p>
                  <p className="text-white/70 text-xs">{connected ? 'Conectada' : 'Desconectada'}</p>
                </div>
              </div>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <Settings className="w-4 h-4 text-white/80" />
              </button>
            </div>
            
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
              <p className="font-mono font-black text-5xl text-white tracking-tight" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
                {weight.toFixed(3)}
              </p>
              <p className="text-white/80 text-sm font-semibold mt-1">quilogramas</p>
            </div>
          </div>
        </div>
        {showMenu && <LayoutMenu />}
      </div>
    )
  }

  // LAYOUT COMPACTO - Barra elegante
  return (
    <div className="relative p-4">
      <div className={`rounded-xl overflow-hidden shadow-lg ${
        connected 
          ? 'bg-gradient-to-r from-emerald-500 to-teal-600' 
          : 'bg-gradient-to-r from-slate-400 to-slate-500'
      }`}>
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Scale className="w-5 h-5 text-white" />
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-white animate-pulse' : 'bg-white/50'}`} />
          </div>
          
          <p className="font-mono font-black text-3xl text-white tracking-tight">
            {weight.toFixed(3)} <span className="text-lg font-semibold text-white/70">kg</span>
          </p>
          
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <Settings className="w-4 h-4 text-white/80" />
          </button>
        </div>
      </div>
      {showMenu && <LayoutMenu />}
    </div>
  )
}
