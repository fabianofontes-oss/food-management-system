import { LanguageProviderWrapper } from '@/components/LanguageProviderWrapper'
import { SupportedLocale, SupportedCountry, isValidLocale, isValidCountry } from '@/lib/i18n'
import DashboardClient from './DashboardClient'
import { createClient } from '@/lib/supabase/server'
import { isSuperAdmin } from '@/lib/auth/super-admin'
import { redirect } from 'next/navigation'
import { getStoreModules } from '@/lib/plan-access'

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

  // Verificar autenticação
  if (!user) {
    redirect('/login')
  }

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

  // Verificar se usuário tem acesso à loja
  const { data: storeUser } = await supabase
    .from('store_users')
    .select('id')
    .eq('store_id', store.id)
    .eq('user_id', user.id)
    .single()

  // Super admin tem acesso a todas as lojas
  const isAdmin = await isSuperAdmin(user.email || '')
  
  if (!storeUser && !isAdmin) {
    redirect('/unauthorized')
  }

  const storeId = store.id
  
  // Buscar módulos disponíveis do plano
  const availableModules = await getStoreModules(storeId)

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
      <DashboardClient slug={params.slug} storeId={storeId} availableModules={availableModules}>
        {children}
      </DashboardClient>
    </LanguageProviderWrapper>
  )
}
