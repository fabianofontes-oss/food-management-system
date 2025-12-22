'use client'

import { LucideIcon } from 'lucide-react'

interface Stat {
  icon: LucideIcon
  value: string
  label: string
  color?: string
}

interface StatsGridProps {
  stats: Stat[]
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <div
            key={index}
            className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 text-center hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
          >
            <Icon className={`w-12 h-12 mx-auto mb-3 ${stat.color || 'text-cyan-600'}`} />
            <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
            <p className="text-slate-600">{stat.label}</p>
          </div>
        )
      })}
    </div>
  )
}
