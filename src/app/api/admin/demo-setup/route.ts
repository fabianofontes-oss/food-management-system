import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireInternalAuth } from '@/lib/security/internal-auth'

/**
 * Cria ou atualiza a loja demo com isDemo: true
 * Permite acesso ao dashboard sem login
 */
export async function POST(request: Request) {
  // SECURITY: Proteger endpoint (cria recursos sem autenticação)
  try {
    requireInternalAuth(request)
  } catch (error) {
    if (error instanceof Response) {
      return error
    }
    throw error
  }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Verificar se já existe loja demo
  const { data: existingStore } = await supabase
    .from('stores')
    .select('id, settings')
    .eq('slug', 'demo')
    .single()

  if (existingStore) {
    // Atualizar para isDemo: true
    const currentSettings = (existingStore.settings as any) || {}
    await supabase
      .from('stores')
      .update({ 
        settings: { ...currentSettings, isDemo: true }
      })
      .eq('id', existingStore.id)

    return NextResponse.json({ 
      success: true, 
      message: 'Loja demo atualizada',
      url: '/demo/dashboard'
    })
  }

  // Buscar primeiro tenant
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .limit(1)
    .single()

  if (!tenant) {
    return NextResponse.json({ error: 'Nenhum tenant encontrado' }, { status: 400 })
  }

  // Criar loja demo
  const { data: store, error } = await supabase
    .from('stores')
    .insert({
      tenant_id: tenant.id,
      name: 'Loja Demo',
      slug: 'demo',
      niche: 'acai',
      mode: 'store',
      is_active: true,
      phone: '(11) 99999-9999',
      address: 'Rua Demo, 123',
      menu_theme: {
        layout: 'modern',
        colors: { primary: '#7C3AED', background: '#F5F3FF' }
      },
      settings: { isDemo: true }
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Criar categorias e produtos de exemplo
  const { data: cat } = await supabase
    .from('categories')
    .insert({
      store_id: store.id,
      name: '🥤 Açaí',
      sort_order: 1,
      is_active: true
    })
    .select('id')
    .single()

  if (cat) {
    await supabase.from('products').insert([
      { store_id: store.id, category_id: cat.id, name: 'Açaí 300ml', base_price: 12, unit_type: 'unit', is_active: true },
      { store_id: store.id, category_id: cat.id, name: 'Açaí 500ml', base_price: 18, unit_type: 'unit', is_active: true },
      { store_id: store.id, category_id: cat.id, name: 'Açaí 700ml', base_price: 24, unit_type: 'unit', is_active: true },
    ])
  }

  return NextResponse.json({ 
    success: true, 
    message: 'Loja demo criada',
    url: '/demo/dashboard'
  })
}

export async function GET(request: Request) {
  // SECURITY: Proteger endpoint
  try {
    requireInternalAuth(request)
  } catch (error) {
    if (error instanceof Response) {
      return error
    }
    throw error
  }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: store } = await supabase
    .from('stores')
    .select('id, name, slug, settings')
    .eq('slug', 'demo')
    .single()

  if (!store) {
    return NextResponse.json({ exists: false })
  }

  const settings = store.settings as any
  return NextResponse.json({ 
    exists: true,
    isDemo: settings?.isDemo === true,
    url: '/demo/dashboard'
  })
}
