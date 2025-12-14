'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Calendar, Clock, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'

interface SchedulingPickerProps {
  storeId: string
  onScheduleSelect: (date: string | null, time: string | null) => void
  selectedDate: string | null
  selectedTime: string | null
}

interface StoreScheduling {
  scheduling_enabled: boolean
  scheduling_min_hours: number
  scheduling_max_days: number
  scheduling_interval: number
  scheduling_max_per_slot: number
  scheduling_use_store_hours: boolean
  scheduling_custom_hours: Record<string, { start: string; end: string } | null> | null
  opening_hours: Record<string, { open: string; close: string }> | null
}

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

export function SchedulingPicker({ storeId, onScheduleSelect, selectedDate, selectedTime }: SchedulingPickerProps) {
  const supabase = useMemo(() => createClient(), [])
  
  const [config, setConfig] = useState<StoreScheduling | null>(null)
  const [isScheduled, setIsScheduled] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [bookedSlots, setBookedSlots] = useState<Record<string, number>>({})

  useEffect(() => {
    async function loadConfig() {
      const { data } = await supabase
        .from('stores')
        .select('scheduling_enabled, scheduling_min_hours, scheduling_max_days, scheduling_interval, scheduling_max_per_slot, scheduling_use_store_hours, scheduling_custom_hours, opening_hours')
        .eq('id', storeId)
        .single()
      
      if (data) {
        setConfig(data as StoreScheduling)
      }
    }
    loadConfig()
  }, [storeId, supabase])

  useEffect(() => {
    if (selectedDate && config) {
      generateTimeSlots(selectedDate)
      loadBookedSlots(selectedDate)
    }
  }, [selectedDate, config])

  async function loadBookedSlots(date: string) {
    const { data } = await supabase
      .from('scheduling_slots')
      .select('slot_time, current_orders')
      .eq('store_id', storeId)
      .eq('slot_date', date)
    
    if (data) {
      const slots: Record<string, number> = {}
      data.forEach((s: { slot_time: string; current_orders: number }) => {
        slots[s.slot_time] = s.current_orders
      })
      setBookedSlots(slots)
    }
  }

  function generateTimeSlots(dateStr: string) {
    if (!config) return
    
    const date = new Date(dateStr + 'T00:00:00')
    const dayOfWeek = date.getDay()
    const dayKey = DAY_KEYS[dayOfWeek]
    
    // Pegar horários do dia
    let startTime = '08:00'
    let endTime = '22:00'
    
    if (config.scheduling_use_store_hours && config.opening_hours) {
      const dayHours = config.opening_hours[dayKey]
      if (dayHours) {
        startTime = dayHours.open
        endTime = dayHours.close
      } else {
        setAvailableSlots([])
        return
      }
    } else if (!config.scheduling_use_store_hours && config.scheduling_custom_hours) {
      const customDay = config.scheduling_custom_hours[dayKey]
      if (customDay) {
        startTime = customDay.start
        endTime = customDay.end
      } else {
        setAvailableSlots([])
        return
      }
    }

    // Gerar slots
    const slots: string[] = []
    const interval = config.scheduling_interval || 30
    const [startHour, startMin] = startTime.split(':').map(Number)
    const [endHour, endMin] = endTime.split(':').map(Number)
    
    let currentMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin
    
    // Se for hoje, aplicar antecedência mínima
    const now = new Date()
    const isToday = dateStr === now.toISOString().split('T')[0]
    
    if (isToday) {
      const minTime = now.getTime() + (config.scheduling_min_hours * 60 * 60 * 1000)
      const minDate = new Date(minTime)
      const minMinutes = minDate.getHours() * 60 + minDate.getMinutes()
      currentMinutes = Math.max(currentMinutes, Math.ceil(minMinutes / interval) * interval)
    }
    
    while (currentMinutes < endMinutes) {
      const hours = Math.floor(currentMinutes / 60)
      const mins = currentMinutes % 60
      slots.push(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`)
      currentMinutes += interval
    }
    
    setAvailableSlots(slots)
  }

  function isDateAvailable(day: number) {
    if (!config) return false
    
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    
    // Verificar antecedência mínima
    const minDate = new Date(now.getTime() + (config.scheduling_min_hours * 60 * 60 * 1000))
    minDate.setHours(0, 0, 0, 0)
    
    // Verificar máximo de dias
    const maxDate = new Date(now)
    maxDate.setDate(maxDate.getDate() + config.scheduling_max_days)
    
    if (date < minDate || date > maxDate) return false
    
    // Verificar se dia tem horário
    const dayKey = DAY_KEYS[date.getDay()]
    
    if (config.scheduling_use_store_hours && config.opening_hours) {
      return !!config.opening_hours[dayKey]
    } else if (!config.scheduling_use_store_hours && config.scheduling_custom_hours) {
      return !!config.scheduling_custom_hours[dayKey]
    }
    
    return true
  }

  function isSlotAvailable(time: string) {
    if (!config || config.scheduling_max_per_slot === 0) return true
    const booked = bookedSlots[time + ':00'] || 0
    return booked < config.scheduling_max_per_slot
  }

  function getDaysInMonth(date: Date) {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    return { firstDay, daysInMonth }
  }

  function handleDateSelect(day: number) {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    onScheduleSelect(dateStr, null)
  }

  function handleTimeSelect(time: string) {
    onScheduleSelect(selectedDate, time)
  }

  function handleToggleSchedule(enabled: boolean) {
    setIsScheduled(enabled)
    if (!enabled) {
      onScheduleSelect(null, null)
    }
  }

  if (!config || !config.scheduling_enabled) {
    return null
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-200 p-4 space-y-4">
      <h3 className="font-bold text-slate-800 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-blue-600" />
        Quando quer receber?
      </h3>

      {/* Toggle */}
      <div className="flex gap-3">
        <button
          onClick={() => handleToggleSchedule(false)}
          className={`flex-1 p-3 rounded-xl border-2 transition-all text-center ${
            !isScheduled ? 'border-green-500 bg-green-50' : 'border-slate-200'
          }`}
        >
          <span className="text-xl">🚀</span>
          <p className="font-medium text-sm mt-1">Agora</p>
          <p className="text-xs text-slate-500">O mais rápido possível</p>
        </button>
        <button
          onClick={() => handleToggleSchedule(true)}
          className={`flex-1 p-3 rounded-xl border-2 transition-all text-center ${
            isScheduled ? 'border-blue-500 bg-blue-50' : 'border-slate-200'
          }`}
        >
          <span className="text-xl">📅</span>
          <p className="font-medium text-sm mt-1">Agendar</p>
          <p className="text-xs text-slate-500">Escolher dia e hora</p>
        </button>
      </div>

      {isScheduled && (
        <>
          {/* Calendário */}
          <div className="border rounded-xl p-3">
            <div className="flex items-center justify-between mb-3">
              <button 
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="font-medium text-sm">
                {currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </span>
              <button 
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                <div key={i} className="py-1 text-slate-500 font-medium">{d}</div>
              ))}
              
              {(() => {
                const { firstDay, daysInMonth } = getDaysInMonth(currentMonth)
                const days = []
                
                for (let i = 0; i < firstDay; i++) {
                  days.push(<div key={`empty-${i}`} />)
                }
                
                for (let day = 1; day <= daysInMonth; day++) {
                  const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  const available = isDateAvailable(day)
                  const selected = selectedDate === dateStr
                  
                  days.push(
                    <button
                      key={day}
                      onClick={() => available && handleDateSelect(day)}
                      disabled={!available}
                      className={`py-1.5 rounded-lg text-sm transition-all ${
                        selected ? 'bg-blue-500 text-white font-bold' :
                        available ? 'hover:bg-blue-100 text-slate-700' :
                        'text-slate-300 cursor-not-allowed'
                      }`}
                    >
                      {day}
                    </button>
                  )
                }
                
                return days
              })()}
            </div>
          </div>

          {/* Horários */}
          {selectedDate && (
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Horário para {new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
              </p>
              
              {availableSlots.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">Nenhum horário disponível</p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {availableSlots.map(time => {
                    const available = isSlotAvailable(time)
                    const selected = selectedTime === time
                    
                    return (
                      <button
                        key={time}
                        onClick={() => available && handleTimeSelect(time)}
                        disabled={!available}
                        className={`py-2 rounded-lg text-sm font-medium transition-all ${
                          selected ? 'bg-blue-500 text-white' :
                          available ? 'bg-slate-100 hover:bg-blue-100' :
                          'bg-slate-50 text-slate-300 cursor-not-allowed'
                        }`}
                      >
                        {time}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Info */}
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Antecedência mínima: {config.scheduling_min_hours}h
          </div>
        </>
      )}
    </div>
  )
}
