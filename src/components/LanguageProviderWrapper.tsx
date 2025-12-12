'use client'

import { ReactNode } from 'react'
import { LanguageProvider } from '@/lib/LanguageContext'
import { SupportedLocale, SupportedCountry, SupportedCurrency } from '@/lib/i18n'

type LanguageProviderWrapperProps = {
  locale: SupportedLocale
  country: SupportedCountry
  currency: SupportedCurrency | string
  timezone: string
  children: ReactNode
}

export function LanguageProviderWrapper({
  locale,
  country,
  currency,
  timezone,
  children
}: LanguageProviderWrapperProps) {
  return (
    <LanguageProvider
      locale={locale}
      country={country}
      currency={currency}
      timezone={timezone}
    >
      {children}
    </LanguageProvider>
  )
}
