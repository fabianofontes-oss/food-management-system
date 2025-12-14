'use client'

import Link from 'next/link'
import { ChevronDown, ChevronRight, ExternalLink, Info, Power } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Module } from '@/config/modules'
import { StoreInfoCard } from './StoreInfoCard'

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
  const otherSettings = module.settings.filter(s => !s.key.endsWith('_enabled'))

  const handleToggleEnabled = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (enabledKey) {
      onUpdateSetting(enabledKey, !enabled)
    }
  }

  return (
    <div className={`bg-white rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
      enabled ? 'border-violet-300 shadow-lg shadow-violet-100' : 'border-slate-200'
    }`}>
      {/* Header com Toggle na Frente */}
      <div className="p-4 flex items-center gap-4">
        {/* Toggle Principal */}
        {enabledKey && (
          <button
            onClick={handleToggleEnabled}
            className={`flex-shrink-0 w-14 h-8 rounded-full transition-all duration-300 relative ${
              enabled ? 'bg-gradient-to-r from-violet-500 to-purple-600' : 'bg-slate-300'
            }`}
          >
            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 flex items-center justify-center ${
              enabled ? 'left-7' : 'left-1'
            }`}>
              <Power className={`w-3.5 h-3.5 ${enabled ? 'text-violet-500' : 'text-slate-400'}`} />
            </div>
          </button>
        )}

        {/* Info do Módulo */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onToggleExpand}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 ${module.bgColor} rounded-xl ${module.color} flex-shrink-0`}>
              {module.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-slate-800">{module.name}</p>
              <p className="text-sm text-slate-500 truncate">{module.description}</p>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {module.configPage && enabled && (
            <Link href={`/${slug}${module.configPage}`}>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs hidden sm:flex">
                <ExternalLink className="w-3.5 h-3.5" />
                Gerenciar
              </Button>
            </Link>
          )}
          {otherSettings.length > 0 && (
            <button 
              onClick={onToggleExpand}
              className={`p-2 rounded-lg hover:bg-slate-100 transition-colors ${expanded ? 'bg-slate-100' : ''}`}
            >
              {expanded ? (
                <ChevronDown className="w-5 h-5 text-slate-500" />
              ) : (
                <ChevronRight className="w-5 h-5 text-slate-400" />
              )}
            </button>
          )}
        </div>
      </div>
      
      {/* Configurações Expandidas */}
      {(otherSettings.length > 0 || module.id === 'store_info') && (
        <div className={`transition-all duration-300 ease-in-out ${expanded ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
          <div className="px-4 pb-4 pt-4 border-t border-slate-100 bg-slate-50/50">
            {/* Componente customizado para Dados da Loja */}
            {module.id === 'store_info' ? (
              <StoreInfoCard 
                settings={settings} 
                enabled={enabled} 
                onUpdateSetting={onUpdateSetting} 
              />
            ) : (
              <>
                {/* Descrição */}
                <div className="flex items-start gap-2 bg-blue-50 p-3 rounded-xl mb-4">
                  <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-600">{module.longDescription}</p>
                </div>
                
                {/* Grid de Configurações */}
                <div className="space-y-3">
                  {otherSettings.map(setting => {
                const currentValue = settings[setting.key] ?? setting.defaultValue
                const isToggle = setting.type === 'toggle'
                
                return (
                  <div 
                    key={setting.key} 
                    className={`p-4 rounded-xl bg-white border border-slate-200 ${!enabled ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    {isToggle ? (
                      /* Layout em linha para toggles */
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 rounded-lg bg-slate-100 text-slate-600 flex-shrink-0">
                            {setting.icon}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-700">{setting.label}</p>
                            <p className="text-xs text-slate-500">{setting.description}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => onUpdateSetting(setting.key, !currentValue)}
                          disabled={!enabled}
                          className={`flex-shrink-0 w-12 h-7 rounded-full transition-all duration-300 relative ${
                            currentValue ? 'bg-green-500' : 'bg-slate-300'
                          }`}
                        >
                          <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-all duration-300 ${
                            currentValue ? 'left-5' : 'left-0.5'
                          }`} />
                        </button>
                      </div>
                    ) : (
                      /* Layout em coluna para inputs */
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-slate-100 text-slate-600 flex-shrink-0">
                            {setting.icon}
                          </div>
                          <div>
                            <p className="font-medium text-slate-700">{setting.label}</p>
                            <p className="text-xs text-slate-500">{setting.description}</p>
                          </div>
                        </div>
                        
                        {setting.type === 'select' ? (
                          <select
                            value={currentValue}
                            onChange={e => onUpdateSetting(setting.key, e.target.value)}
                            disabled={!enabled}
                            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-violet-500 focus:outline-none text-sm bg-white"
                          >
                            {setting.options?.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="flex">
                            {setting.prefix && (
                              <span className="text-sm font-medium text-slate-600 bg-slate-100 px-4 py-3 rounded-l-xl border-2 border-r-0 border-slate-200 flex items-center">
                                {setting.prefix}
                              </span>
                            )}
                            <input
                              type={setting.type === 'currency' ? 'number' : setting.type}
                              step={setting.type === 'currency' ? '0.01' : '1'}
                              value={currentValue}
                              onChange={e => onUpdateSetting(setting.key, setting.type === 'number' || setting.type === 'currency' ? Number(e.target.value) : e.target.value)}
                              placeholder={setting.placeholder}
                              disabled={!enabled}
                              className={`flex-1 px-4 py-3 border-2 border-slate-200 focus:border-violet-500 focus:outline-none text-sm ${
                                setting.prefix ? 'rounded-l-none' : 'rounded-l-xl'
                              } ${setting.suffix ? 'rounded-r-none border-r-0' : 'rounded-r-xl'}`}
                            />
                            {setting.suffix && (
                              <span className="text-sm font-medium text-slate-600 bg-slate-100 px-4 py-3 rounded-r-xl border-2 border-l-0 border-slate-200 flex items-center">
                                {setting.suffix}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
