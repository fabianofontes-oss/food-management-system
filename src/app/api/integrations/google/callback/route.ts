import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { exchangeCodeForTokens } from '@/lib/integrations/google-reviews'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state') // storeId
  const error = searchParams.get('error')

  // Se houve erro no OAuth
  if (error) {
    return NextResponse.redirect(
      new URL(`/dashboard/reviews/integrations?error=${error}`, request.url)
    )
  }

  // Validar parâmetros
  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/dashboard/reviews/integrations?error=missing_params', request.url)
    )
  }

  try {
    // Trocar código por tokens
    const tokens = await exchangeCodeForTokens(code)
    
    // Criar cliente Supabase com service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
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

    // Buscar slug da loja para redirecionar
    const { data: store } = await supabase
      .from('stores')
      .select('slug')
      .eq('id', state)
      .single()

    const slug = store?.slug || ''
    
    return NextResponse.redirect(
      new URL(`/${slug}/dashboard/reviews/integrations?success=google_connected`, request.url)
    )
  } catch (err: any) {
    console.error('Erro no callback do Google:', err)
    return NextResponse.redirect(
      new URL(`/dashboard/reviews/integrations?error=${encodeURIComponent(err.message)}`, request.url)
    )
  }
}
