import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { normalizeSlug, isValidSlug, isReservedSlug } from '@/lib/slugs/reserved'

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
    const rawSlug = String(body?.slug || '')
    const storeName = String(body?.storeName || '').trim()

    if (!rawSlug) {
      return NextResponse.json(
        { ok: false, error: 'Slug é obrigatório' },
        { status: 400 }
      )
    }

    const slug = normalizeSlug(rawSlug)

    // Validar slug
    const validation = isValidSlug(slug)
    if (!validation.valid) {
      return NextResponse.json(
        { ok: false, error: validation.reason },
        { status: 400 }
      )
    }

    if (isReservedSlug(slug)) {
      return NextResponse.json(
        { ok: false, error: 'Este slug é reservado pelo sistema' },
        { status: 400 }
      )
    }

    // Verificar se usuário já tem uma loja
    const { data: existingStoreUser } = await supabaseAdmin
      .from('store_users')
      .select('store_id, stores(id, slug, status)')
      .eq('user_id', user.id)
      .eq('role', 'OWNER')
      .maybeSingle()

    // Se já tem loja, verifica se é draft e atualiza o slug
    if (existingStoreUser?.store_id) {
      const store = (existingStoreUser as any).stores
      
      // Se a loja já está ativa, não pode alterar slug por aqui
      if (store?.status === 'active') {
        return NextResponse.json({
          ok: true,
          storeId: store.id,
          slug: store.slug,
          message: 'Loja já está publicada',
        })
      }

      // Verificar se o novo slug está disponível (ignorando a própria loja)
      const { data: slugInUse } = await supabaseAdmin
        .from('stores')
        .select('id')
        .ilike('slug', slug)
        .neq('id', store.id)
        .maybeSingle()

      if (slugInUse) {
        return NextResponse.json(
          { ok: false, error: 'Este slug já está em uso' },
          { status: 400 }
        )
      }

      // Atualizar loja existente
      const { error: updateError } = await supabaseAdmin
        .from('stores')
        .update({
          slug,
          name: storeName || store.name || slug,
        })
        .eq('id', store.id)

      if (updateError) {
        console.error('Erro ao atualizar loja:', updateError)
        return NextResponse.json(
          { ok: false, error: 'Erro ao atualizar loja' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        ok: true,
        storeId: store.id,
        slug,
      })
    }

    // Verificar se slug está disponível
    const { data: existingStore } = await supabaseAdmin
      .from('stores')
      .select('id')
      .ilike('slug', slug)
      .maybeSingle()

    if (existingStore) {
      return NextResponse.json(
        { ok: false, error: 'Este slug já está em uso' },
        { status: 400 }
      )
    }

    // Criar tenant
    const finalName = storeName || slug
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .insert({ name: finalName })
      .select('id')
      .single()

    if (tenantError || !tenant) {
      console.error('Erro ao criar tenant:', tenantError)
      return NextResponse.json(
        { ok: false, error: 'Erro ao criar tenant' },
        { status: 500 }
      )
    }

    // Criar loja como DRAFT
    const { data: store, error: storeError } = await supabaseAdmin
      .from('stores')
      .insert({
        tenant_id: tenant.id,
        name: finalName,
        slug,
        niche: 'other',
        mode: 'store',
        is_active: true,
        status: 'draft',
      })
      .select('id')
      .single()

    if (storeError || !store) {
      console.error('Erro ao criar loja:', storeError)
      // Rollback tenant
      await supabaseAdmin.from('tenants').delete().eq('id', tenant.id)
      return NextResponse.json(
        { ok: false, error: 'Erro ao criar loja' },
        { status: 500 }
      )
    }

    // Garantir user row existe
    await supabaseAdmin.from('users').upsert(
      { id: user.id, name: user.user_metadata?.name || user.email || 'Usuário', email: user.email! },
      { onConflict: 'id' }
    )

    // Vincular usuário como OWNER
    const { error: linkError } = await supabaseAdmin
      .from('store_users')
      .insert({
        store_id: store.id,
        user_id: user.id,
        role: 'OWNER',
      })

    if (linkError) {
      console.error('Erro ao vincular usuário:', linkError)
      // Rollback
      await supabaseAdmin.from('stores').delete().eq('id', store.id)
      await supabaseAdmin.from('tenants').delete().eq('id', tenant.id)
      return NextResponse.json(
        { ok: false, error: 'Erro ao vincular usuário à loja' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      storeId: store.id,
      slug,
    })
  } catch (error: any) {
    console.error('Erro no prepare:', error)
    return NextResponse.json(
      { ok: false, error: error?.message || 'Erro interno' },
      { status: 500 }
    )
  }
}
