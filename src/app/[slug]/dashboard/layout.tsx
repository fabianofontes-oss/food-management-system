import { LanguageProviderWrapper } from '@/components/LanguageProviderWrapper'
import { SupportedLocale, SupportedCountry, isValidLocale, isValidCountry } from '@/lib/i18n'
import DashboardClient from './DashboardClient'
import { createClient } from '@/lib/supabase/server'
import { isSuperAdmin } from '@/lib/auth/super-admin'
import { redirect } from 'next/navigation'

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

  // ============================================
  // MODO DEBUG: TODOS OS BLOQUEIOS REMOVIDOS
  // ============================================
  // TODO: Reimplementar segurança após estabilização
  console.log('[DEBUG MODE] Dashboard acesso livre:', params.slug, '| User:', user?.email || 'anônimo')

  let storeId: string | null = null

  // Buscar a store pelo slug
  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('slug', params.slug)
    .single()

  // Se loja não existe, mostra 404
  if (!store?.id) {
    redirect('/404')
  }

  // MODO DEBUG: Acesso direto sem verificações
  storeId = store.id

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
