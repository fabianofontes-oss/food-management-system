'use client'

import { createContext, useContext, ReactNode } from 'react'
import {
  SupportedLocale,
  SupportedCountry,
  SupportedCurrency,
  messages,
  createCurrencyFormatter,
  createDateFormatter,
  createPhoneFormatter,
  isValidLocale,
  isValidCountry
} from './i18n'

export type LanguageContextValue = {
  locale: SupportedLocale
  country: SupportedCountry
  currency: string
  timezone: string
  t: (path: string, fallback?: string) => string
  formatCurrency: (valueInCents: number) => string
  formatDate: (date: Date) => string
  formatTime: (date: Date) => string
  formatDateTime: (date: Date) => string
  formatPhone: (phone: string) => string
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined)

type LanguageProviderProps = {
  locale: SupportedLocale
  country: SupportedCountry
  currency: SupportedCurrency | string
  timezone: string
  children: ReactNode
}

export function LanguageProvider({
  locale,
  country,
  currency,
  timezone,
  children
}: LanguageProviderProps) {
  // Validate and fallback to defaults if needed
  const validLocale: SupportedLocale = isValidLocale(locale) ? locale : 'pt-BR'
  const validCountry: SupportedCountry = isValidCountry(country) ? country : 'BR'

  // Create formatters
  const currencyFormatter = createCurrencyFormatter(validLocale, currency)
  const dateFormatters = createDateFormatter(validLocale, timezone)
  const phoneFormatter = createPhoneFormatter(validCountry)

  // Translation function with namespace support
  const t = (path: string, fallback?: string): string => {
    const keys = path.split('.')
    
    if (keys.length !== 2) {
      return fallback || path
    }

    const [namespace, key] = keys
    const namespaceMessages = messages[validLocale][namespace as keyof typeof messages[typeof validLocale]]
    
    if (!namespaceMessages) {
      return fallback || path
    }

    const message = namespaceMessages[key]
    return message || fallback || path
  }

  // Format currency (value in cents)
  const formatCurrency = (valueInCents: number): string => {
    const valueInUnits = valueInCents / 100
    return currencyFormatter.format(valueInUnits)
  }

  const value: LanguageContextValue = {
    locale: validLocale,
    country: validCountry,
    currency,
    timezone,
    t,
    formatCurrency,
    formatDate: dateFormatters.formatDate,
    formatTime: dateFormatters.formatTime,
    formatDateTime: dateFormatters.formatDateTime,
    formatPhone: phoneFormatter
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext)
  
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  
  return context
}
