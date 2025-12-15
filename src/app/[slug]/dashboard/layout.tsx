import { LanguageProviderWrapper } from '@/components/LanguageProviderWrapper'
import { SupportedLocale, SupportedCountry, isValidLocale, isValidCountry } from '@/lib/i18n'
import DashboardClient from './DashboardClient'
import { createClient } from '@/lib/supabase/server'

export default async function StoreDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { slug: string }
}) {
  const country = 'BR'
  const language = 'pt-BR'
  const currency = 'BRL'
  const timezone = 'America/Sao_Paulo'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let storeId: string | null = null

  if (user) {
    // Primeiro, buscar a store pelo slug
    const { data: store } = await supabase
      .from('stores')
      .select('id')
      .eq('slug', params.slug)
      .single()

    // Se encontrou a store, verificar se o usuário tem acesso via store_users
    if (store?.id) {
      const { data: userStore } = await supabase
        .from('store_users')
        .select('store_id')
        .eq('user_id', user.id)
        .eq('store_id', store.id)
        .single()

      storeId = userStore?.store_id ?? null
    }
  }

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
      <DashboardClient slug={params.slug} storeId={storeId}>
        {children}
      </DashboardClient>
    </LanguageProviderWrapper>
  )
}
