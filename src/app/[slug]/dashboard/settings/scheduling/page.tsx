'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Calendar, Clock, Settings, Save, Loader2, AlertCircle,
  ToggleLeft, ToggleRight, Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface StoreScheduling {
  scheduling_enabled: boolean
  scheduling_min_hours: number
  scheduling_max_days: number
  scheduling_interval: number
  scheduling_require_payment: boolean
  scheduling_max_per_slot: number
  scheduling_use_store_hours: boolean
  scheduling_custom_hours: Record<string, { start: string; end: string } | null> | null
}

const DAYS = [
  { key: 'mon', label: 'Segunda' },
  { key: 'tue', label: 'Terça' },
  { key: 'wed', label: 'Quarta' },
  { key: 'thu', label: 'Quinta' },
  { key: 'fri', label: 'Sexta' },
  { key: 'sat', label: 'Sábado' },
  { key: 'sun', label: 'Domingo' }
]

export default function SchedulingSettingsPage() {
  const params = useParams()
  const slug = params.slug as string
  const supabase = useMemo(() => createClient(), [])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [storeId, setStoreId] = useState<string | null>(null)
  
  const [config, setConfig] = useState<StoreScheduling>({
    scheduling_enabled: false,
    scheduling_min_hours: 4,
    scheduling_max_days: 7,
    scheduling_interval: 30,
    scheduling_require_payment: false,
    scheduling_max_per_slot: 0,
    scheduling_use_store_hours: true,
    scheduling_custom_hours: null
  })

  const [customHours, setCustomHours] = useState<Record<string, { start: string; end: string; enabled: boolean }>>({
    mon: { start: '08:00', end: '18:00', enabled: true },
    tue: { start: '08:00', end: '18:00', enabled: true },
    wed: { start: '08:00', end: '18:00', enabled: true },
    thu: { start: '08:00', end: '18:00', enabled: true },
    fri: { start: '08:00', end: '18:00', enabled: true },
    sat: { start: '09:00', end: '14:00', enabled: true },
    sun: { start: '09:00', end: '14:00', enabled: false }
  })

  useEffect(() => {
    async function loadStore() {
      const { data } = await supabase
        .from('stores')
        .select('id, scheduling_enabled, scheduling_min_hours, scheduling_max_days, scheduling_interval, scheduling_require_payment, scheduling_max_per_slot, scheduling_use_store_hours, scheduling_custom_hours')
        .eq('slug', slug)
        .single()
      
      if (data) {
        setStoreId(data.id)
        setConfig({
          scheduling_enabled: data.scheduling_enabled || false,
          scheduling_min_hours: data.scheduling_min_hours || 4,
          scheduling_max_days: data.scheduling_max_days || 7,
          scheduling_interval: data.scheduling_interval || 30,
          scheduling_require_payment: data.scheduling_require_payment || false,
          scheduling_max_per_slot: data.scheduling_max_per_slot || 0,
          scheduling_use_store_hours: data.scheduling_use_store_hours !== false,
          scheduling_custom_hours: data.scheduling_custom_hours
        })
        
        if (data.scheduling_custom_hours) {
          const hours: Record<string, { start: string; end: string; enabled: boolean }> = {}
          DAYS.forEach(day => {
            const dayData = data.scheduling_custom_hours?.[day.key]
            hours[day.key] = dayData 
              ? { start: dayData.start, end: dayData.end, enabled: true }
              : { start: '08:00', end: '18:00', enabled: false }
          })
          setCustomHours(hours)
        }
      }
      setLoading(false)
    }
    loadStore()
  }, [slug, supabase])

  async function handleSave() {
    if (!storeId) return
    
    setSaving(true)
    
    // Preparar horários customizados
    const customHoursData: Record<string, { start: string; end: string } | null> = {}
    DAYS.forEach(day => {
      const dayConfig = customHours[day.key]
      customHoursData[day.key] = dayConfig.enabled 
        ? { start: dayConfig.start, end: dayConfig.end }
        : null
    })
    
    await supabase
      .from('stores')
      .update({
        scheduling_enabled: config.scheduling_enabled,
        scheduling_min_hours: config.scheduling_min_hours,
        scheduling_max_days: config.scheduling_max_days,
        scheduling_interval: config.scheduling_interval,
        scheduling_require_payment: config.scheduling_require_payment,
        scheduling_max_per_slot: config.scheduling_max_per_slot,
        scheduling_use_store_hours: config.scheduling_use_store_hours,
        scheduling_custom_hours: config.scheduling_use_store_hours ? null : customHoursData
      })
      .eq('id', storeId)
    
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-4 md:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/25">
                <Calendar className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
              Agendamento
            </h1>
            <p className="text-slate-500 mt-2 ml-14">Configure como os clientes podem agendar pedidos</p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Salvar
          </Button>
        </div>

        {/* Toggle Principal */}
        <div className="bg-white rounded-2xl shadow-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800">Permitir Agendamento</h3>
              <p className="text-sm text-slate-500">Clientes podem agendar pedidos para data/hora futura</p>
            </div>
            <button
              onClick={() => setConfig(prev => ({ ...prev, scheduling_enabled: !prev.scheduling_enabled }))}
              className={`p-2 rounded-xl transition-colors ${config.scheduling_enabled ? 'text-green-600' : 'text-slate-400'}`}
            >
              {config.scheduling_enabled ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10" />}
            </button>
          </div>
        </div>

        {config.scheduling_enabled && (
          <>
            {/* Regras */}
            <div className="bg-white rounded-2xl shadow-lg border p-6 space-y-6">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" />
                Regras de Agendamento
              </h3>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Antecedência Mínima
                  </label>
                  <select
                    value={config.scheduling_min_hours}
                    onChange={e => setConfig(prev => ({ ...prev, scheduling_min_hours: parseInt(e.target.value) }))}
                    className="w-full px-4 py-3 border-2 rounded-xl"
                  >
                    <option value={2}>2 horas</option>
                    <option value={4}>4 horas</option>
                    <option value={6}>6 horas</option>
                    <option value={12}>12 horas</option>
                    <option value={24}>24 horas (1 dia)</option>
                    <option value={48}>48 horas (2 dias)</option>
                    <option value={72}>72 horas (3 dias)</option>
                  </select>
                  <p className="text-xs text-slate-500 mt-1">
                    Evita que clientes usem agendamento para burlar fila do delivery
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Agendar até
                  </label>
                  <select
                    value={config.scheduling_max_days}
                    onChange={e => setConfig(prev => ({ ...prev, scheduling_max_days: parseInt(e.target.value) }))}
                    className="w-full px-4 py-3 border-2 rounded-xl"
                  >
                    <option value={3}>3 dias</option>
                    <option value={7}>7 dias (1 semana)</option>
                    <option value={14}>14 dias (2 semanas)</option>
                    <option value={30}>30 dias (1 mês)</option>
                    <option value={60}>60 dias (2 meses)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Intervalo de Horários
                  </label>
                  <select
                    value={config.scheduling_interval}
                    onChange={e => setConfig(prev => ({ ...prev, scheduling_interval: parseInt(e.target.value) }))}
                    className="w-full px-4 py-3 border-2 rounded-xl"
                  >
                    <option value={15}>A cada 15 minutos</option>
                    <option value={30}>A cada 30 minutos</option>
                    <option value={60}>A cada 1 hora</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Máximo de Pedidos por Horário
                  </label>
                  <select
                    value={config.scheduling_max_per_slot}
                    onChange={e => setConfig(prev => ({ ...prev, scheduling_max_per_slot: parseInt(e.target.value) }))}
                    className="w-full px-4 py-3 border-2 rounded-xl"
                  >
                    <option value={0}>Ilimitado</option>
                    <option value={3}>3 pedidos</option>
                    <option value={5}>5 pedidos</option>
                    <option value={10}>10 pedidos</option>
                    <option value={15}>15 pedidos</option>
                    <option value={20}>20 pedidos</option>
                  </select>
                  <p className="text-xs text-slate-500 mt-1">
                    Quando lotado, horário fica indisponível
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.scheduling_require_payment}
                    onChange={e => setConfig(prev => ({ ...prev, scheduling_require_payment: e.target.checked }))}
                    className="w-5 h-5 rounded"
                  />
                  <div>
                    <span className="font-medium text-slate-700">Exigir pagamento antecipado</span>
                    <p className="text-xs text-slate-500">Cliente paga na hora de agendar (evita desistências)</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Horários */}
            <div className="bg-white rounded-2xl shadow-lg border p-6 space-y-6">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Horários para Agendamento
              </h3>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={config.scheduling_use_store_hours}
                    onChange={() => setConfig(prev => ({ ...prev, scheduling_use_store_hours: true }))}
                    className="w-4 h-4"
                  />
                  <span className="text-slate-700">Usar horário de funcionamento da loja</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={!config.scheduling_use_store_hours}
                    onChange={() => setConfig(prev => ({ ...prev, scheduling_use_store_hours: false }))}
                    className="w-4 h-4"
                  />
                  <span className="text-slate-700">Horários customizados</span>
                </label>
              </div>

              {!config.scheduling_use_store_hours && (
                <div className="space-y-3 border-t pt-4">
                  <p className="text-sm text-slate-500 flex items-center gap-1">
                    <Info className="w-4 h-4" />
                    Ideal para confeiteiros e produtores que entregam fora do expediente normal
                  </p>
                  
                  {DAYS.map(day => (
                    <div key={day.key} className="flex items-center gap-4">
                      <label className="flex items-center gap-2 w-32">
                        <input
                          type="checkbox"
                          checked={customHours[day.key]?.enabled || false}
                          onChange={e => setCustomHours(prev => ({
                            ...prev,
                            [day.key]: { ...prev[day.key], enabled: e.target.checked }
                          }))}
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-slate-700">{day.label}</span>
                      </label>
                      
                      {customHours[day.key]?.enabled && (
                        <>
                          <input
                            type="time"
                            value={customHours[day.key]?.start || '08:00'}
                            onChange={e => setCustomHours(prev => ({
                              ...prev,
                              [day.key]: { ...prev[day.key], start: e.target.value }
                            }))}
                            className="px-3 py-2 border rounded-lg"
                          />
                          <span className="text-slate-400">até</span>
                          <input
                            type="time"
                            value={customHours[day.key]?.end || '18:00'}
                            onChange={e => setCustomHours(prev => ({
                              ...prev,
                              [day.key]: { ...prev[day.key], end: e.target.value }
                            }))}
                            className="px-3 py-2 border rounded-lg"
                          />
                        </>
                      )}
                      
                      {!customHours[day.key]?.enabled && (
                        <span className="text-slate-400 text-sm">Fechado</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Como funciona:</p>
                <ul className="mt-1 space-y-1 list-disc list-inside text-blue-700">
                  <li>No checkout, cliente verá opção "Agendar para outro dia"</li>
                  <li>Só horários dentro das regras configuradas aparecem</li>
                  <li>Pedidos agendados aparecem no painel com data/hora marcada</li>
                </ul>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
