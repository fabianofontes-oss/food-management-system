import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { exchangeCodeForTokens } from '@/lib/integrations/google-reviews'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const APP_BASE_URL =
  process.env.APP_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'https://app.pediu.food'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state') // storeId
  const error = searchParams.get('error')

  // Criar cliente Supabase com service role
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  // Buscar slug no início (se tiver storeId)
  let slug = ''
  if (state) {
    const { data: store } = await supabase
      .from('stores')
      .select('slug')
      .eq('id', state)
      .single()
    slug = store?.slug || ''
  }

  // Helper para redirect com slug
  const redirectToReviews = (queryParams: string) => {
    if (slug) {
      return NextResponse.redirect(
        new URL(`/${slug}/dashboard/reviews/integrations?${queryParams}`, APP_BASE_URL)
      )
    }
    // Fallback se não tiver slug
    return NextResponse.redirect(
      new URL(`/select-store?error=missing_store&${queryParams}`, APP_BASE_URL)
    )
  }

  // Se houve erro no OAuth
  if (error) {
    return redirectToReviews(`error=${error}`)
  }

  // Validar parâmetros
  if (!code || !state) {
    return redirectToReviews('error=missing_params')
  }

  try {
    // Trocar código por tokens
    const tokens = await exchangeCodeForTokens(code)
    
    // Calcular quando o token expira
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000)
    
    // Atualizar ou criar integração do Google
    const { data: existingIntegration } = await supabase
      .from('review_integrations')
      .select('id')
      .eq('store_id', state)
      .eq('platform', 'google')
      .single()

    if (existingIntegration) {
      // Atualizar integração existente
      await supabase
        .from('review_integrations')
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: expiresAt.toISOString(),
          is_connected: true,
          is_active: true,
          last_sync_status: 'connected',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingIntegration.id)
    } else {
      // Criar nova integração
      await supabase
        .from('review_integrations')
        .insert({
          store_id: state,
          platform: 'google',
          platform_name: 'Google Meu Negócio',
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: expiresAt.toISOString(),
          is_connected: true,
          is_active: true,
          last_sync_status: 'connected'
        })
    }
    
    return redirectToReviews('success=google_connected')
  } catch (err: any) {
    console.error('Erro no callback do Google:', err)
    return redirectToReviews(`error=${encodeURIComponent(err.message)}`)
  }
}
