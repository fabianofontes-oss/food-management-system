'use client'

import { useState, useEffect, useMemo } from 'react'
import { Calendar, Clock, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import { buildSchedulingSlots, type SchedulingDay, type SchedulingSlot } from '@/modules/store/utils/storeHours'
import type { BusinessHour } from '@/modules/store/types'

interface SchedulingSelectorProps {
  businessHours: BusinessHour[]
  schedulingConfig: {
    enabled: boolean
    minHours: number
    maxDays: number
    intervalMinutes: number
  }
  timezone?: string
  isStoreClosed: boolean
  nextOpenFormatted: string | null
  selectedDate: string | null
  selectedTime: string | null
  onSelect: (date: string | null, time: string | null) => void
}

export function SchedulingSelector({
  businessHours,
  schedulingConfig,
  timezone = 'America/Sao_Paulo',
  isStoreClosed,
  nextOpenFormatted,
  selectedDate,
  selectedTime,
  onSelect,
}: SchedulingSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(isStoreClosed)
  const [activeDayIndex, setActiveDayIndex] = useState(0)

  // Gerar slots de agendamento
  const schedulingDays = useMemo(() => {
    if (!schedulingConfig.enabled) return []

    return buildSchedulingSlots(businessHours, {
      maxDays: schedulingConfig.maxDays,
      slotIntervalMinutes: schedulingConfig.intervalMinutes,
      prepTimeMinutes: schedulingConfig.minHours * 60,
      timezone,
    })
  }, [businessHours, schedulingConfig, timezone])

  // Expandir automaticamente se loja fechada
  useEffect(() => {
    if (isStoreClosed && schedulingConfig.enabled) {
      setIsExpanded(true)
    }
  }, [isStoreClosed, schedulingConfig.enabled])

  // Se agendamento não está habilitado
  if (!schedulingConfig.enabled) {
    if (isStoreClosed) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-800">Loja fechada</p>
              {nextOpenFormatted && (
                <p className="text-sm text-red-700 mt-1">
                  Abrimos {nextOpenFormatted}
                </p>
              )}
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  const activeDay = schedulingDays[activeDayIndex]
  const availableSlots = activeDay?.slots.filter(s => s.available) || []

  const handleSelectSlot = (slot: SchedulingSlot) => {
    const dateStr = slot.dateFormatted.split('/').reverse().join('-') // DD/MM/YYYY -> YYYY-MM-DD
    onSelect(dateStr, slot.time)
  }

  const handleClearScheduling = () => {
    onSelect(null, null)
    if (!isStoreClosed) {
      setIsExpanded(false)
    }
  }

  const isSlotSelected = (slot: SchedulingSlot) => {
    const dateStr = slot.dateFormatted.split('/').reverse().join('-')
    return selectedDate === dateStr && selectedTime === slot.time
  }

  return (
    <div className="bg-white rounded-xl border shadow-sm">
      {/* Header */}
      <button
        type="button"
        onClick={() => !isStoreClosed && setIsExpanded(!isExpanded)}
        className={`w-full p-4 flex items-center justify-between ${
          isStoreClosed ? 'cursor-default' : 'cursor-pointer hover:bg-gray-50'
        } transition-colors rounded-t-xl`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isStoreClosed ? 'bg-orange-100' : 'bg-blue-100'}`}>
            <Calendar className={`w-5 h-5 ${isStoreClosed ? 'text-orange-600' : 'text-blue-600'}`} />
          </div>
          <div className="text-left">
            <p className="font-medium text-gray-900">
              {isStoreClosed ? 'Agendar pedido' : 'Quer agendar para outro horário?'}
            </p>
            {isStoreClosed && (
              <p className="text-sm text-orange-600">
                Loja fechada • Selecione um horário
              </p>
            )}
            {selectedDate && selectedTime && (
              <p className="text-sm text-green-600">
                Agendado para {selectedDate.split('-').reverse().join('/')} às {selectedTime}
              </p>
            )}
          </div>
        </div>
        {!isStoreClosed && (
          isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t p-4 space-y-4">
          {/* Dias disponíveis */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {schedulingDays.map((day, index) => (
              <button
                key={day.dateFormatted}
                type="button"
                onClick={() => setActiveDayIndex(index)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  index === activeDayIndex
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="block">{day.dayName}</span>
                <span className="block text-xs opacity-80">{day.dateFormatted}</span>
              </button>
            ))}
          </div>

          {/* Horários disponíveis */}
          {activeDay && (
            <div>
              <p className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Horários disponíveis
              </p>
              
              {availableSlots.length > 0 ? (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.time}
                      type="button"
                      onClick={() => handleSelectSlot(slot)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isSlotSelected(slot)
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700'
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  Nenhum horário disponível neste dia
                </p>
              )}
            </div>
          )}

          {/* Limpar agendamento */}
          {selectedDate && selectedTime && !isStoreClosed && (
            <button
              type="button"
              onClick={handleClearScheduling}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Remover agendamento (receber agora)
            </button>
          )}
        </div>
      )}
    </div>
  )
}
