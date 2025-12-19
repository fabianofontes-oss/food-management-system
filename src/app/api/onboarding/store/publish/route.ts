import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json().catch(() => null)
    const storeId = String(body?.storeId || '')

    if (!storeId) {
      return NextResponse.json(
        { ok: false, error: 'storeId é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se usuário é OWNER da loja
    const { data: storeUser } = await supabaseAdmin
      .from('store_users')
      .select('role')
      .eq('store_id', storeId)
      .eq('user_id', user.id)
      .single()

    if (!storeUser || (storeUser.role !== 'OWNER' && storeUser.role !== 'MANAGER')) {
      return NextResponse.json(
        { ok: false, error: 'Sem permissão para publicar esta loja' },
        { status: 403 }
      )
    }

    // Buscar loja
    const { data: store, error: storeError } = await supabaseAdmin
      .from('stores')
      .select('id, slug, status, published_at')
      .eq('id', storeId)
      .single()

    if (storeError || !store) {
      return NextResponse.json(
        { ok: false, error: 'Loja não encontrada' },
        { status: 404 }
      )
    }

    // Se já está publicada, retorna sucesso
    if (store.status === 'active') {
      return NextResponse.json({
        ok: true,
        storeId: store.id,
        slug: store.slug,
        message: 'Loja já está publicada',
        publishedAt: store.published_at,
      })
    }

    // Validar mínimo publicável: 1 categoria ativa + 1 produto ativo
    const { data: categories } = await supabaseAdmin
      .from('categories')
      .select('id')
      .eq('store_id', storeId)
      .eq('is_active', true)
      .limit(1)

    if (!categories || categories.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'É necessário ter pelo menos 1 categoria ativa para publicar' },
        { status: 400 }
      )
    }

    const { data: products } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('store_id', storeId)
      .eq('is_active', true)
      .limit(1)

    if (!products || products.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'É necessário ter pelo menos 1 produto ativo para publicar' },
        { status: 400 }
      )
    }

    // Publicar loja
    const publishedAt = new Date().toISOString()
    const { error: updateError } = await supabaseAdmin
      .from('stores')
      .update({
        status: 'active',
        published_at: publishedAt,
      })
      .eq('id', storeId)

    if (updateError) {
      console.error('Erro ao publicar loja:', updateError)
      return NextResponse.json(
        { ok: false, error: 'Erro ao publicar loja' },
        { status: 500 }
      )
    }

    // CAPTURA DE REFERRAL: ler cookie e gravar tenant_referral
    let referralCaptured = false
    try {
      const cookieStore = await cookies()
      const referralCode = cookieStore.get('referral_code')?.value

      if (referralCode) {
        // Buscar tenant_id da store
        const { data: storeWithTenant } = await supabaseAdmin
          .from('stores')
          .select('tenant_id')
          .eq('id', storeId)
          .single()

        if (storeWithTenant?.tenant_id) {
          // Validar código e obter partner_id
          const { data: codeData } = await supabaseAdmin
            .from('referral_codes')
            .select('code, partner_id')
            .eq('code', referralCode.toUpperCase())
            .eq('is_active', true)
            .maybeSingle()

          if (codeData) {
            // Verificar se já existe referral para este tenant
            const { data: existingReferral } = await supabaseAdmin
              .from('tenant_referrals')
              .select('referred_tenant_id')
              .eq('referred_tenant_id', storeWithTenant.tenant_id)
              .maybeSingle()

            if (!existingReferral) {
              // Inserir tenant_referral
              const { error: referralError } = await supabaseAdmin
                .from('tenant_referrals')
                .insert({
                  referred_tenant_id: storeWithTenant.tenant_id,
                  referral_code: codeData.code,
                  partner_id: codeData.partner_id,
                  captured_by_user_id: user.id,
                })

              if (!referralError) {
                referralCaptured = true
                console.log('[Publish] Referral capturado:', { 
                  tenantId: storeWithTenant.tenant_id, 
                  code: codeData.code 
                })
              } else {
                console.error('[Publish] Erro ao capturar referral:', referralError)
              }
            }
          }
        }
      }
    } catch (refError) {
      console.error('[Publish] Erro ao processar referral:', refError)
    }

    return NextResponse.json({
      ok: true,
      storeId: store.id,
      slug: store.slug,
      publishedAt,
      referralCaptured,
    })
  } catch (error: any) {
    console.error('Erro ao publicar:', error)
    return NextResponse.json(
      { ok: false, error: error?.message || 'Erro interno' },
      { status: 500 }
    )
  }
}
