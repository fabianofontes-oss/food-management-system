import { supabase } from '@/lib/supabase'
import { LanguageProviderWrapper } from '@/components/LanguageProviderWrapper'
import { SupportedLocale, SupportedCountry, isValidLocale, isValidCountry } from '@/lib/i18n'
import DashboardClient from './DashboardClient'

async function getStoreWithTenant(slug: string) {
  const { data: store } = await supabase
    .from('stores')
    .select('id, tenant_id, tenants(country, language, currency, timezone)')
    .eq('slug', slug)
    .single()

  return store
}

export default async function StoreDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { slug: string }
}) {
  const store = await getStoreWithTenant(params.slug)
  
  // Extract tenant localization data with fallbacks
  const tenant = store?.tenants as any
  const country = tenant?.country || 'BR'
  const language = tenant?.language || 'pt-BR'
  const currency = tenant?.currency || 'BRL'
  const timezone = tenant?.timezone || 'America/Sao_Paulo'

  // Validate and ensure type safety
  const validLocale: SupportedLocale = isValidLocale(language) ? language : 'pt-BR'
  const validCountry: SupportedCountry = isValidCountry(country) ? country : 'BR'

  return (
    <LanguageProviderWrapper
      locale={validLocale}
      country={validCountry}
      currency={currency}
      timezone={timezone}
    >
      <DashboardClient slug={params.slug} storeId={store?.id}>
        {children}
      </DashboardClient>
    </LanguageProviderWrapper>
  )
}
