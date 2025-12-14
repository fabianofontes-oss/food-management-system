'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface ConfigFieldProps {
  label: string
  value: any
  onChange: (value: any) => void
  type?: 'text' | 'number' | 'select' | 'password' | 'currency'
  prefix?: string
  suffix?: string
  placeholder?: string
  options?: { value: string; label: string }[]
  disabled?: boolean
}

export function ConfigField({ 
  label, 
  value, 
  onChange, 
  type = 'text',
  prefix,
  suffix,
  placeholder,
  options,
  disabled = false
}: ConfigFieldProps) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <div className="flex items-center gap-1">
        {prefix && <span className="text-sm text-slate-500">{prefix}</span>}
        {type === 'select' ? (
          <select
            value={value}
            onChange={e => onChange(e.target.value)}
            disabled={disabled}
            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-violet-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
          >
            {options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ) : type === 'password' ? (
          <div className="flex-1 relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={value}
              onChange={e => onChange(e.target.value)}
              placeholder={placeholder}
              disabled={disabled}
              className="w-full px-3 py-2 pr-10 border border-slate-200 rounded-lg text-sm focus:border-violet-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        ) : (
          <input
            type={type === 'currency' ? 'number' : type}
            step={type === 'currency' ? '0.01' : type === 'number' ? '1' : undefined}
            value={value}
            onChange={e => onChange(type === 'number' || type === 'currency' ? Number(e.target.value) : e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-violet-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
          />
        )}
        {suffix && <span className="text-sm text-slate-500">{suffix}</span>}
      </div>
    </div>
  )
}
