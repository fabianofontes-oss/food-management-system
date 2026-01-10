import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { slug, storeName, storeDescription, niche } = body

    if (!slug || !storeName) {
      return NextResponse.json(
        { success: false, error: 'Slug e nome da loja são obrigatórios' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: existingStore } = await supabaseAdmin
      .from('stores')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (existingStore) {
      return NextResponse.json(
        { success: false, error: 'Slug já está em uso' },
        { status: 400 }
      )
    }

    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .insert({
        name: storeName,
        owner_id: user.id,
        status: 'trial',
        trial_ends_at: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single()

    if (tenantError || !tenant) {
      console.error('Erro ao criar tenant:', tenantError)
      return NextResponse.json(
        { success: false, error: 'Erro ao criar tenant' },
        { status: 500 }
      )
    }

    const { data: store, error: storeError } = await supabaseAdmin
      .from('stores')
      .insert({
        tenant_id: tenant.id,
        name: storeName,
        slug: slug,
        description: storeDescription || null,
        status: 'active',
        settings: {
          niche: niche || 'other',
          theme: { primaryColor: '#10b981' },
          businessHours: {},
        },
      })
      .select()
      .single()

    if (storeError || !store) {
      console.error('Erro ao criar store:', storeError)
      await supabaseAdmin.from('tenants').delete().eq('id', tenant.id)
      return NextResponse.json(
        { success: false, error: 'Erro ao criar loja' },
        { status: 500 }
      )
    }

    const { error: storeUserError } = await supabaseAdmin
      .from('store_users')
      .insert({
        store_id: store.id,
        user_id: user.id,
        role: 'OWNER',
      })

    if (storeUserError) {
      console.error('Erro ao criar store_user:', storeUserError)
      await supabaseAdmin.from('stores').delete().eq('id', store.id)
      await supabaseAdmin.from('tenants').delete().eq('id', tenant.id)
      return NextResponse.json(
        { success: false, error: 'Erro ao vincular usuário à loja' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      slug: store.slug,
      storeId: store.id,
      tenantId: tenant.id,
      trialEndsAt: tenant.trial_ends_at,
    })
  } catch (error) {
    console.error('Erro ao criar loja:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
