'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, ExternalLink, Info, ToggleLeft, ToggleRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Module, ModuleSetting } from '@/config/modules'

interface ModuleCardItemProps {
  module: Module
  slug: string
  enabled: boolean
  expanded: boolean
  settings: Record<string, any>
  onToggleExpand: () => void
  onUpdateSetting: (key: string, value: any) => void
}

export function ModuleCardItem({ module, slug, enabled, expanded, settings, onToggleExpand, onUpdateSetting }: ModuleCardItemProps) {
  const enabledKey = module.settings.find(s => s.key.endsWith('_enabled'))?.key

  return (
    <div className={`bg-white rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
      enabled ? 'border-violet-200 shadow-lg shadow-violet-100' : 'border-slate-100 hover:border-slate-200'
    }`}>
      {/* Header */}
      <div className="p-5 flex items-center justify-between cursor-pointer" onClick={onToggleExpand}>
        <div className="flex items-center gap-4">
          <div className={`p-3 ${module.bgColor} rounded-xl ${module.color}`}>
            {module.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-slate-800 text-lg">{module.name}</p>
              {enabled && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">Ativo</span>}
            </div>
            <p className="text-sm text-slate-500">{module.description}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {module.configPage && enabled && (
            <Link href={`/${slug}${module.configPage}`} onClick={e => e.stopPropagation()}>
              <Button variant="outline" size="sm" className="gap-1 text-xs">
                <ExternalLink className="w-3 h-3" />
                Gerenciar
              </Button>
            </Link>
          )}
          <div className={`transition-transform duration-300 ${expanded ? 'rotate-90' : ''}`}>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </div>
        </div>
      </div>
      
      {/* Settings Accordion */}
      <div className={`transition-all duration-300 ease-in-out ${expanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
        <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-gradient-to-b from-slate-50/50 to-white">
          <p className="text-sm text-slate-600 mb-5 flex items-start gap-2 bg-blue-50 p-3 rounded-xl">
            <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            {module.longDescription}
          </p>
          
          <div className="space-y-4">
            {module.settings.map(setting => {
              const isMainToggle = setting.key.endsWith('_enabled')
              const currentValue = settings[setting.key] ?? setting.defaultValue
              
              return (
                <div key={setting.key} className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                  isMainToggle ? 'bg-gradient-to-r from-violet-50 to-purple-50 border-2 border-violet-100' : 'bg-slate-50 border border-slate-100'
                } ${!enabled && !isMainToggle ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isMainToggle ? 'bg-violet-100 text-violet-600' : 'bg-white text-slate-500'}`}>
                      {setting.icon}
                    </div>
                    <div>
                      <p className={`font-medium ${isMainToggle ? 'text-violet-800' : 'text-slate-700'}`}>{setting.label}</p>
                      <p className="text-xs text-slate-500">{setting.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {setting.type === 'toggle' ? (
                      <button
                        onClick={() => onUpdateSetting(setting.key, !currentValue)}
                        className={`transition-all ${isMainToggle ? 'scale-125' : ''}`}
                        disabled={!enabled && !isMainToggle}
                      >
                        {currentValue ? (
                          <ToggleRight className={`w-12 h-12 ${isMainToggle ? 'text-violet-500' : 'text-green-500'}`} />
                        ) : (
                          <ToggleLeft className="w-12 h-12 text-slate-300" />
                        )}
                      </button>
                    ) : setting.type === 'select' ? (
                      <select
                        value={currentValue}
                        onChange={e => onUpdateSetting(setting.key, e.target.value)}
                        disabled={!enabled}
                        className="px-3 py-2 border-2 border-slate-200 rounded-lg focus:border-violet-500 focus:outline-none text-sm min-w-[140px]"
                      >
                        {setting.options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    ) : (
                      <div className="flex items-center gap-1">
                        {setting.prefix && <span className="text-sm text-slate-500">{setting.prefix}</span>}
                        <input
                          type={setting.type === 'currency' ? 'number' : setting.type}
                          step={setting.type === 'currency' ? '0.01' : '1'}
                          value={currentValue}
                          onChange={e => onUpdateSetting(setting.key, setting.type === 'number' || setting.type === 'currency' ? Number(e.target.value) : e.target.value)}
                          placeholder={setting.placeholder}
                          disabled={!enabled}
                          className="w-24 px-3 py-2 border-2 border-slate-200 rounded-lg focus:border-violet-500 focus:outline-none text-sm text-right"
                        />
                        {setting.suffix && <span className="text-sm text-slate-500 min-w-[40px]">{setting.suffix}</span>}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
