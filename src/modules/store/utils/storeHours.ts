/**
 * Utilitário para cálculo de status de funcionamento da loja e geração de slots de agendamento.
 * 
 * Usa date-fns para manipulação de datas com suporte a timezone.
 */

import {
  format,
  parse,
  addDays,
  addMinutes,
  setHours,
  setMinutes,
  isBefore,
  isAfter,
  startOfDay,
  isWithinInterval,
  getDay,
} from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'
import type { BusinessHour } from '../types'

// Mapeamento de dia da semana para índice do date-fns (0 = domingo)
const DAY_MAP: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
}

// Mapeamento inverso
const INDEX_TO_DAY: Record<number, string> = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
}

export interface StoreStatus {
  isOpen: boolean
  currentDay: string
  currentTime: string
  nextOpenAt: Date | null
  nextOpenFormatted: string | null
  closesAt: Date | null
  closesAtFormatted: string | null
}

export interface SchedulingSlot {
  date: Date
  dateFormatted: string
  time: string
  dateTime: Date
  available: boolean
}

export interface SchedulingDay {
  date: Date
  dateFormatted: string
  dayName: string
  slots: SchedulingSlot[]
}

/**
 * Obtém o status atual da loja (aberta/fechada)
 */
export function getStoreStatus(
  businessHours: BusinessHour[],
  timezone: string = 'America/Sao_Paulo'
): StoreStatus {
  const now = new Date()
  const zonedNow = toZonedTime(now, timezone)
  const currentDayIndex = getDay(zonedNow)
  const currentDayName = INDEX_TO_DAY[currentDayIndex]
  const currentTime = format(zonedNow, 'HH:mm')

  const todayHours = businessHours.find(h => h.day === currentDayName)

  let isOpen = false
  let closesAt: Date | null = null
  let closesAtFormatted: string | null = null

  if (todayHours?.enabled) {
    const openTime = todayHours.open
    const closeTime = todayHours.close

    if (currentTime >= openTime && currentTime < closeTime) {
      isOpen = true
      const [closeHour, closeMin] = closeTime.split(':').map(Number)
      closesAt = setMinutes(setHours(zonedNow, closeHour), closeMin)
      closesAtFormatted = closeTime
    }
  }

  // Encontrar próxima abertura se fechado
  let nextOpenAt: Date | null = null
  let nextOpenFormatted: string | null = null

  if (!isOpen) {
    // Procurar nos próximos 7 dias
    for (let i = 0; i <= 7; i++) {
      const checkDate = addDays(zonedNow, i)
      const checkDayIndex = getDay(checkDate)
      const checkDayName = INDEX_TO_DAY[checkDayIndex]
      const dayHours = businessHours.find(h => h.day === checkDayName)

      if (dayHours?.enabled) {
        const [openHour, openMin] = dayHours.open.split(':').map(Number)
        const openDateTime = setMinutes(setHours(startOfDay(checkDate), openHour), openMin)

        // Se for hoje, verificar se o horário ainda não passou
        if (i === 0 && currentTime >= dayHours.open) {
          continue
        }

        nextOpenAt = openDateTime
        const dayLabel = i === 0 ? 'hoje' : i === 1 ? 'amanhã' : format(checkDate, 'EEEE', { locale: undefined })
        nextOpenFormatted = `${dayLabel} às ${dayHours.open}`
        break
      }
    }
  }

  return {
    isOpen,
    currentDay: currentDayName,
    currentTime,
    nextOpenAt,
    nextOpenFormatted,
    closesAt,
    closesAtFormatted,
  }
}

/**
 * Gera slots de agendamento disponíveis
 */
export function buildSchedulingSlots(
  businessHours: BusinessHour[],
  config: {
    maxDays: number
    slotIntervalMinutes: number
    prepTimeMinutes: number
    timezone?: string
  }
): SchedulingDay[] {
  const {
    maxDays,
    slotIntervalMinutes,
    prepTimeMinutes,
    timezone = 'America/Sao_Paulo',
  } = config

  const now = new Date()
  const zonedNow = toZonedTime(now, timezone)
  const minScheduleTime = addMinutes(zonedNow, prepTimeMinutes)
  const result: SchedulingDay[] = []

  for (let dayOffset = 0; dayOffset <= maxDays; dayOffset++) {
    const targetDate = addDays(startOfDay(zonedNow), dayOffset)
    const dayIndex = getDay(targetDate)
    const dayName = INDEX_TO_DAY[dayIndex]
    const dayHours = businessHours.find(h => h.day === dayName)

    if (!dayHours?.enabled) {
      continue
    }

    const [openHour, openMin] = dayHours.open.split(':').map(Number)
    const [closeHour, closeMin] = dayHours.close.split(':').map(Number)

    const dayOpenTime = setMinutes(setHours(targetDate, openHour), openMin)
    const dayCloseTime = setMinutes(setHours(targetDate, closeHour), closeMin)

    const slots: SchedulingSlot[] = []
    let slotTime = dayOpenTime

    while (isBefore(slotTime, dayCloseTime)) {
      const isAvailable = isAfter(slotTime, minScheduleTime)

      slots.push({
        date: targetDate,
        dateFormatted: format(targetDate, 'dd/MM/yyyy'),
        time: format(slotTime, 'HH:mm'),
        dateTime: slotTime,
        available: isAvailable,
      })

      slotTime = addMinutes(slotTime, slotIntervalMinutes)
    }

    if (slots.length > 0) {
      result.push({
        date: targetDate,
        dateFormatted: format(targetDate, 'dd/MM/yyyy'),
        dayName: getDayLabel(dayOffset, dayName),
        slots,
      })
    }
  }

  return result
}

/**
 * Valida se um horário de agendamento é válido
 */
export function validateScheduledTime(
  scheduledFor: Date,
  businessHours: BusinessHour[],
  config: {
    maxDays: number
    slotIntervalMinutes: number
    prepTimeMinutes: number
    timezone?: string
  }
): { valid: boolean; error?: string } {
  const {
    maxDays,
    slotIntervalMinutes,
    prepTimeMinutes,
    timezone = 'America/Sao_Paulo',
  } = config

  const now = new Date()
  const zonedNow = toZonedTime(now, timezone)
  const zonedScheduled = toZonedTime(scheduledFor, timezone)

  // 1. Verificar se está no futuro com tempo de preparo mínimo
  const minScheduleTime = addMinutes(zonedNow, prepTimeMinutes)
  if (isBefore(zonedScheduled, minScheduleTime)) {
    return {
      valid: false,
      error: `Agendamento deve ser com no mínimo ${prepTimeMinutes} minutos de antecedência`,
    }
  }

  // 2. Verificar se está dentro do limite máximo de dias
  const maxDate = addDays(zonedNow, maxDays)
  if (isAfter(zonedScheduled, maxDate)) {
    return {
      valid: false,
      error: `Agendamento não pode ser mais de ${maxDays} dias no futuro`,
    }
  }

  // 3. Verificar se cai em um dia que a loja funciona
  const scheduledDayIndex = getDay(zonedScheduled)
  const scheduledDayName = INDEX_TO_DAY[scheduledDayIndex]
  const dayHours = businessHours.find(h => h.day === scheduledDayName)

  if (!dayHours?.enabled) {
    return {
      valid: false,
      error: `Loja não funciona neste dia (${scheduledDayName})`,
    }
  }

  // 4. Verificar se o horário está dentro do funcionamento
  const scheduledTime = format(zonedScheduled, 'HH:mm')
  if (scheduledTime < dayHours.open || scheduledTime >= dayHours.close) {
    return {
      valid: false,
      error: `Horário fora do funcionamento (${dayHours.open} - ${dayHours.close})`,
    }
  }

  // 5. Verificar alinhamento com o intervalo de slots
  const minutes = zonedScheduled.getMinutes()
  if (minutes % slotIntervalMinutes !== 0) {
    return {
      valid: false,
      error: `Horário deve ser em intervalos de ${slotIntervalMinutes} minutos`,
    }
  }

  return { valid: true }
}

/**
 * Helper para obter label do dia
 */
function getDayLabel(dayOffset: number, dayName: string): string {
  if (dayOffset === 0) return 'Hoje'
  if (dayOffset === 1) return 'Amanhã'

  const dayNames: Record<string, string> = {
    sunday: 'Domingo',
    monday: 'Segunda',
    tuesday: 'Terça',
    wednesday: 'Quarta',
    thursday: 'Quinta',
    friday: 'Sexta',
    saturday: 'Sábado',
  }

  return dayNames[dayName] || dayName
}

/**
 * Converte date + time separados para Date ISO
 */
export function combineDateAndTime(
  date: string, // 'YYYY-MM-DD'
  time: string, // 'HH:mm'
  timezone: string = 'America/Sao_Paulo'
): Date {
  const localDateTime = parse(`${date} ${time}`, 'yyyy-MM-dd HH:mm', new Date())
  return fromZonedTime(localDateTime, timezone)
}

/**
 * Extrai date e time de um Date para o formato do banco
 */
export function splitDateTime(
  dateTime: Date,
  timezone: string = 'America/Sao_Paulo'
): { date: string; time: string } {
  const zonedDate = toZonedTime(dateTime, timezone)
  return {
    date: format(zonedDate, 'yyyy-MM-dd'),
    time: format(zonedDate, 'HH:mm'),
  }
}
