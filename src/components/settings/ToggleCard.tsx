'use client'

import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'

interface ToggleCardProps {
  icon: LucideIcon
  iconColor: string
  title: string
  description: string
  enabled: boolean
  onToggle: (enabled: boolean) => void
  children?: ReactNode
  showAccordion?: boolean
}

export function ToggleCard({
  icon: Icon,
  iconColor,
  title,
  description,
  enabled,
  onToggle,
  children,
  showAccordion = false
}: ToggleCardProps) {
  return (
    <div className="bg-white rounded-xl border-2 border-gray-100 overflow-hidden transition-all">
      <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-3 flex-1">
          <div className={`p-2 rounded-lg ${iconColor} bg-opacity-10`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onToggle(!enabled)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            enabled ? 'bg-green-500' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
      
      {showAccordion && enabled && children && (
        <div className="border-t-2 border-gray-100 bg-gray-50 p-4 animate-in slide-in-from-top duration-200">
          {children}
        </div>
      )}
    </div>
  )
}
