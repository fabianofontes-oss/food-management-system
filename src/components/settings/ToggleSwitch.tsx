'use client'

import { ToggleLeft, ToggleRight } from 'lucide-react'

interface ToggleSwitchProps {
  enabled: boolean
  onToggle: () => void
  size?: 'normal' | 'large'
}

export function ToggleSwitch({ enabled, onToggle, size = 'normal' }: ToggleSwitchProps) {
  return (
    <button onClick={onToggle} className="focus:outline-none">
      {enabled ? (
        <ToggleRight className={`${size === 'large' ? 'w-14 h-14' : 'w-10 h-10'} text-violet-500`} />
      ) : (
        <ToggleLeft className={`${size === 'large' ? 'w-14 h-14' : 'w-10 h-10'} text-slate-300`} />
      )}
    </button>
  )
}
