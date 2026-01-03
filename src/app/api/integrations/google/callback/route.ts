import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { exchangeCodeForTokens } from '@/lib/integrations/google-reviews'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const APP_BASE_URL =
  process.env.APP_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'https://app.pediu.food'

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state') // storeId
  const oauthError = searchParams.get('error')

  // 1) Garantir que há usuário logado
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData?.user

  if (!user) {
    const qs = new URLSearchParams()
    if (state) qs.set('state', state)
    qs.set('redirect', '/select-store')
    return NextResponse.redirect(new URL(`/login?${qs.toString()}`, APP_BASE_URL))
  }

  // 2) Validar state (storeId) antes de qualquer coisa
  if (!state || !isUuid(state)) {
    const qs = new URLSearchParams()
    qs.set('error', 'invalid_state')
    return NextResponse.redirect(new URL(`/select-store?${qs.toString()}`, APP_BASE_URL))
  }

  // 3) Cliente ADMIN (service role) só para operações privilegiadas
  const admin = createSupabaseAdmin(supabaseUrl, supabaseServiceKey)

  // 4) Buscar slug e validar que o usuário tem acesso à loja
  const { data: store, error: storeErr } = await admin
    .from('stores')
    .select('id, slug')
    .eq('id', state)
    .maybeSingle()

  const slug = store?.slug || ''

  if (storeErr || !store?.id) {
    const qs = new URLSearchParams()
    qs.set('error', 'store_not_found')
    return NextResponse.redirect(new URL(`/select-store?${qs.toString()}`, APP_BASE_URL))
  }

  // Validar acesso do usuário à loja (mesmo padrão do dashboard layout)
  const { data: membership } = await admin
    .from('store_users')
    .select('id')
    .eq('store_id', store.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) {
    return NextResponse.redirect(new URL('/unauthorized', APP_BASE_URL))
  }

  // Helper: sempre volta para a tela certa, com slug e query bem formada
  const redirectToIntegrations = (params: Record<string, string>) => {
    const qs = new URLSearchParams(params)
    if (slug) {
      return NextResponse.redirect(
        new URL(`/${slug}/dashboard/reviews/integrations?${qs.toString()}`, APP_BASE_URL)
      )
    }
    return NextResponse.redirect(new URL(`/select-store?${qs.toString()}`, APP_BASE_URL))
  }

  // 5) Se houve erro no OAuth
  if (oauthError) {
    return redirectToIntegrations({ error: oauthError })
  }

  // 6) Validar parâmetros
  if (!code) {
    return redirectToIntegrations({ error: 'missing_code' })
  }

  try {
    const tokens = await exchangeCodeForTokens(code)

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000)

    const { data: existingIntegration } = await admin
      .from('review_integrations')
      .select('id')
      .eq('store_id', state)
      .eq('platform', 'google')
      .maybeSingle()

    if (existingIntegration?.id) {
      await admin
        .from('review_integrations')
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: expiresAt.toISOString(),
          is_connected: true,
          is_active: true,
          last_sync_status: 'connected',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingIntegration.id)
    } else {
      await admin.from('review_integrations').insert({
        store_id: state,
        platform: 'google',
        platform_name: 'Google Meu Negócio',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: expiresAt.toISOString(),
        is_connected: true,
        is_active: true,
        last_sync_status: 'connected',
      })
    }

    return redirectToIntegrations({ success: 'google_connected' })
  } catch (err: any) {
    console.error('Erro no callback do Google:', err)
    return redirectToIntegrations({
      error: err?.message ? String(err.message) : 'oauth_callback_failed',
    })
  }
}
