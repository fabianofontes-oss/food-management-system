'use client'

import { useState, useEffect, ReactNode } from 'react'
import { ChevronDown, ChevronUp, ToggleLeft, ToggleRight } from 'lucide-react'

interface ModuleCardProps {
  icon: ReactNode
  title: string
  description: string
  enabled: boolean
  onToggle: () => void
  children?: ReactNode
  color?: 'violet' | 'emerald' | 'blue' | 'amber' | 'red' | 'green' | 'pink' | 'cyan'
  defaultExpanded?: boolean
}

const COLORS = {
  violet: { bg: 'bg-violet-100', text: 'text-violet-600', border: 'border-violet-200' },
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-200' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-200' },
  red: { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-200' },
  green: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-200' },
  pink: { bg: 'bg-pink-100', text: 'text-pink-600', border: 'border-pink-200' },
  cyan: { bg: 'bg-cyan-100', text: 'text-cyan-600', border: 'border-cyan-200' }
}

export function ModuleCard({ 
  icon, 
  title, 
  description, 
  enabled, 
  onToggle, 
  children,
  color = 'violet',
  defaultExpanded = false
}: ModuleCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded || enabled)
  
  useEffect(() => {
    if (enabled && !expanded) setExpanded(true)
  }, [enabled, expanded])

  const c = COLORS[color]

  return (
    <div className={`bg-white rounded-xl border-2 transition-all ${enabled ? c.border + ' shadow-md' : 'border-slate-100'}`}>
      <div 
        className="p-4 flex items-center justify-between cursor-pointer"
        onClick={() => children && setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${c.bg} ${c.text}`}>
            {icon}
          </div>
          <div>
            <p className="font-semibold text-slate-800">{title}</p>
            <p className="text-sm text-slate-500">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {enabled && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Ativo</span>}
          <button 
            onClick={(e) => { e.stopPropagation(); onToggle() }}
            className="focus:outline-none"
          >
            {enabled ? (
              <ToggleRight className="w-12 h-12 text-violet-500" />
            ) : (
              <ToggleLeft className="w-12 h-12 text-slate-300" />
            )}
          </button>
          {children && (
            <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}>
              {expanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </button>
          )}
        </div>
      </div>
      {children && expanded && enabled && (
        <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50/50 rounded-b-xl">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}
