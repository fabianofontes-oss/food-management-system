'use client'

import { useMemo, useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Settings, Loader2, Save, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MODULES, CATEGORIES } from '@/config/modules'
import { ModuleCardItem } from '@/components/settings/modules'

export default function ModulesPage() {
  const params = useParams()
  const slug = params.slug as string
  const supabase = useMemo(() => createClient(), [])
  
  const [storeId, setStoreId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [moduleSettings, setModuleSettings] = useState<Record<string, Record<string, any>>>({})
  const [expandedModules, setExpandedModules] = useState<string[]>([])

  useEffect(() => {
    async function loadStore() {
      const { data } = await supabase.from('stores').select('id, settings').eq('slug', slug).single()
      if (data) {
        setStoreId(data.id)
        const settings = data.settings as any || {}
        const moduleConfigs = settings.moduleSettings || {}
        const initialSettings: Record<string, Record<string, any>> = {}
        MODULES.forEach(module => {
          initialSettings[module.id] = {}
          module.settings.forEach(setting => {
            initialSettings[module.id][setting.key] = moduleConfigs[module.id]?.[setting.key] ?? setting.defaultValue
          })
        })
        setModuleSettings(initialSettings)
      }
      setLoading(false)
    }
    loadStore()
  }, [slug, supabase])

  const isModuleEnabled = (moduleId: string) => {
    const module = MODULES.find(m => m.id === moduleId)
    if (!module) return false
    const enabledKey = module.settings.find(s => s.key.endsWith('_enabled'))?.key
    if (!enabledKey) return true
    return moduleSettings[moduleId]?.[enabledKey] ?? false
  }

  const toggleExpanded = (moduleId: string) => {
    setExpandedModules(prev => prev.includes(moduleId) ? prev.filter(id => id !== moduleId) : [...prev, moduleId])
  }

  const updateSetting = (moduleId: string, key: string, value: any) => {
    setModuleSettings(prev => ({ ...prev, [moduleId]: { ...(prev[moduleId] || {}), [key]: value } }))
    if (key.endsWith('_enabled') && value && !expandedModules.includes(moduleId)) {
      setExpandedModules(prev => [...prev, moduleId])
    }
  }

  const handleSave = async () => {
    if (!storeId) return
    setSaving(true)
    setSaveStatus('idle')
    try {
      const { data: currentStore } = await supabase.from('stores').select('settings').eq('id', storeId).single()
      const currentSettings = (currentStore?.settings as any) || {}
      const newSettings = { ...currentSettings, moduleSettings }
      const { error } = await supabase.from('stores').update({ settings: newSettings }).eq('id', storeId)
      if (error) throw error
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err) {
      console.error('Erro ao salvar:', err)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/30 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/30 p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg shadow-violet-500/25">
                <Settings className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
              Módulos e Funcionalidades
            </h1>
            <p className="text-slate-500 mt-2 ml-14">Ative e configure cada recurso do sistema</p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Salvar
          </Button>
        </div>

        {/* Status */}
        {saveStatus === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-2 text-green-700 animate-in slide-in-from-top">
            <CheckCircle className="w-5 h-5" />
            Configurações salvas com sucesso!
          </div>
        )}

        {/* Categorias e Módulos */}
        {CATEGORIES.map(category => {
          const categoryModules = MODULES.filter(m => m.category === category.id)
          return (
            <div key={category.id} className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <h2 className="text-xl font-bold text-slate-800">{category.name}</h2>
                <span className="text-sm text-slate-400">{category.description}</span>
              </div>
              <div className="space-y-3">
                {categoryModules.map(module => (
                  <ModuleCardItem
                    key={module.id}
                    module={module}
                    slug={slug}
                    enabled={isModuleEnabled(module.id)}
                    expanded={expandedModules.includes(module.id)}
                    settings={moduleSettings[module.id] || {}}
                    onToggleExpand={() => toggleExpanded(module.id)}
                    onUpdateSetting={(key, value) => updateSetting(module.id, key, value)}
                  />
                ))}
              </div>
            </div>
          )
        })}

        {/* Botão Salvar Fixo */}
        <div className="sticky bottom-4 flex justify-center">
          <Button onClick={handleSave} disabled={saving} size="lg" className="bg-gradient-to-r from-violet-500 to-purple-600 shadow-xl shadow-violet-500/30 px-8">
            {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
            Salvar Configurações
          </Button>
        </div>
      </div>
    </div>
  )
}
