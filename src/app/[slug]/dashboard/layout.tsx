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

  // Se não estiver logado, redireciona para login
  // EXCEÇÃO: loja-demo é pública para demonstração
  const isLojaDemo = params.slug === 'loja-demo'
  if (!user && !isLojaDemo) {
    redirect(`/login?next=/${params.slug}/dashboard`)
  }

  let storeId: string | null = null

  // Primeiro, buscar a store pelo slug
  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('slug', params.slug)
    .single()

  if (!store?.id) {
    redirect('/404')
  }

  // LOJA DEMO: Acesso público para demonstração
  if (isLojaDemo) {
    storeId = store.id
  }
  // SUPER ADMIN: Acesso total a qualquer loja
  else if (user && isSuperAdmin(user.email)) {
    storeId = store.id
  } 
  // Usuário logado: verificar se tem acesso via store_users
  else if (user) {
    const { data: userStore } = await supabase
      .from('store_users')
      .select('store_id')
      .eq('user_id', user.id)
      .eq('store_id', store.id)
      .single()

    storeId = userStore?.store_id ?? null

    // Se não tem acesso, redireciona para página de acesso negado
    if (!storeId) {
      redirect(`/access-denied?store=${params.slug}`)
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
