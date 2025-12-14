'use client'

import { Clock, ToggleLeft, ToggleRight } from 'lucide-react'

interface HoursCardProps {
  settings: Record<string, any>
  enabled: boolean
  onUpdateSetting: (key: string, value: any) => void
}

const DAYS = [
  { key: 'monday', label: 'Segunda-feira', short: 'Seg' },
  { key: 'tuesday', label: 'Terça-feira', short: 'Ter' },
  { key: 'wednesday', label: 'Quarta-feira', short: 'Qua' },
  { key: 'thursday', label: 'Quinta-feira', short: 'Qui' },
  { key: 'friday', label: 'Sexta-feira', short: 'Sex' },
  { key: 'saturday', label: 'Sábado', short: 'Sáb' },
  { key: 'sunday', label: 'Domingo', short: 'Dom' }
]

export function HoursCard({ settings, enabled, onUpdateSetting }: HoursCardProps) {
  const handleToggleDay = (dayKey: string) => {
    const currentValue = settings[`hours_${dayKey}_closed`] || false
    onUpdateSetting(`hours_${dayKey}_closed`, !currentValue)
  }

  const handleTimeChange = (dayKey: string, type: 'open' | 'close', value: string) => {
    onUpdateSetting(`hours_${dayKey}_${type}`, value)
  }

  return (
    <div className={`space-y-4 ${!enabled ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Toggle principal */}
      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-blue-600" />
          <div>
            <p className="font-medium text-slate-800">Controle Automático</p>
            <p className="text-xs text-slate-500">Fecha pedidos fora do horário</p>
          </div>
        </div>
        <button
          onClick={() => onUpdateSetting('hours_enabled', !settings.hours_enabled)}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            settings.hours_enabled ? 'bg-blue-500' : 'bg-slate-300'
          }`}
        >
          <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
            settings.hours_enabled ? 'left-7' : 'left-1'
          }`} />
        </button>
      </div>

      {/* Tabela de horários */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-12 bg-slate-100 text-xs font-semibold text-slate-600 uppercase tracking-wider">
          <div className="col-span-4 px-4 py-3">Dia</div>
          <div className="col-span-3 px-2 py-3 text-center">Abre</div>
          <div className="col-span-3 px-2 py-3 text-center">Fecha</div>
          <div className="col-span-2 px-2 py-3 text-center">Status</div>
        </div>

        {/* Rows */}
        {DAYS.map((day, index) => {
          const isClosed = settings[`hours_${day.key}_closed`] || false
          const openTime = settings[`hours_${day.key}_open`] || '08:00'
          const closeTime = settings[`hours_${day.key}_close`] || '22:00'
          const isWeekend = day.key === 'saturday' || day.key === 'sunday'

          return (
            <div 
              key={day.key}
              className={`grid grid-cols-12 items-center border-t border-slate-100 ${
                isClosed ? 'bg-red-50/50' : isWeekend ? 'bg-amber-50/30' : ''
              }`}
            >
              {/* Dia */}
              <div className="col-span-4 px-4 py-3">
                <span className={`font-medium ${isClosed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                  {day.label}
                </span>
              </div>

              {/* Horário Abre */}
              <div className="col-span-3 px-2 py-2">
                <input
                  type="time"
                  value={openTime}
                  onChange={(e) => handleTimeChange(day.key, 'open', e.target.value)}
                  disabled={isClosed}
                  className={`w-full px-2 py-1.5 text-sm border rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isClosed 
                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' 
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                />
              </div>

              {/* Horário Fecha */}
              <div className="col-span-3 px-2 py-2">
                <input
                  type="time"
                  value={closeTime}
                  onChange={(e) => handleTimeChange(day.key, 'close', e.target.value)}
                  disabled={isClosed}
                  className={`w-full px-2 py-1.5 text-sm border rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isClosed 
                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' 
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                />
              </div>

              {/* Toggle Aberto/Fechado */}
              <div className="col-span-2 px-2 py-2 flex justify-center">
                <button
                  onClick={() => handleToggleDay(day.key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                    isClosed 
                      ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                      : 'bg-green-100 text-green-600 hover:bg-green-200'
                  }`}
                >
                  {isClosed ? 'Fechado' : 'Aberto'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Dica */}
      <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
        <span className="w-2 h-2 bg-green-400 rounded-full"></span>
        <span>Aberto</span>
        <span className="w-2 h-2 bg-red-400 rounded-full ml-3"></span>
        <span>Fechado</span>
        <span className="w-2 h-2 bg-amber-300 rounded-full ml-3"></span>
        <span>Final de semana</span>
      </div>
    </div>
  )
}
