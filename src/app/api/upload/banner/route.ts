import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'

function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Variáveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias')
  }

  return createSupabaseAdminClient(supabaseUrl, serviceRoleKey)
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const formData = await request.formData()
    const file = formData.get('file') as File
    const storeId = formData.get('storeId') as string

    if (!file || !storeId) {
      return NextResponse.json(
        { success: false, error: 'Arquivo ou storeId ausente' },
        { status: 400 }
      )
    }

    const isDemoStore = await (async () => {
      const { data } = await supabase.from('stores').select('slug').eq('id', storeId).single()
      return data?.slug === 'demo'
    })()

    // SECURITY: Em produção, exigir autenticação (exceto para demo)
    if (!user && !isDemoStore && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, error: 'Autenticação necessária' },
        { status: 401 }
      )
    }

    const client = !user && isDemoStore ? createAdminClient() : supabase

    if (user) {
      const { data: userStore } = await supabase
        .from('store_users')
        .select('store_id')
        .eq('user_id', user.id)
        .eq('store_id', storeId)
        .single()

      if (!userStore) {
        return NextResponse.json(
          { success: false, error: 'Sem permissão para editar esta loja' },
          { status: 403 }
        )
      }
    } else if (!isDemoStore) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Tipo de arquivo inválido. Use JPG, PNG ou WebP' },
        { status: 400 }
      )
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Arquivo muito grande. Máximo 5MB' },
        { status: 400 }
      )
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${storeId}-${Date.now()}.${fileExt}`
    const filePath = `banners/${fileName}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await client.storage
      .from('store-assets')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      return NextResponse.json(
        { success: false, error: 'Erro ao fazer upload do banner' },
        { status: 500 }
      )
    }

    const { data: publicUrlData } = client.storage
      .from('store-assets')
      .getPublicUrl(filePath)

    const bannerUrl = publicUrlData.publicUrl

    const { error: updateError } = await client
      .from('stores')
      .update({ banner_url: bannerUrl })
      .eq('id', storeId)

    if (updateError) {
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar banner da loja' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, url: bannerUrl })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Erro interno ao processar upload' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const body = await request.json().catch(() => null)
    const storeId = body?.storeId as string | undefined

    if (!storeId) {
      return NextResponse.json(
        { success: false, error: 'storeId ausente' },
        { status: 400 }
      )
    }

    const { data: storeData } = await supabase.from('stores').select('slug').eq('id', storeId).single()
    const isDemoStore = storeData?.slug === 'demo'
    const client = !user && isDemoStore ? createAdminClient() : supabase

    if (user) {
      const { data: userStore } = await supabase
        .from('store_users')
        .select('store_id')
        .eq('user_id', user.id)
        .eq('store_id', storeId)
        .single()

      if (!userStore) {
        return NextResponse.json(
          { success: false, error: 'Sem permissão para editar esta loja' },
          { status: 403 }
        )
      }
    } else if (!isDemoStore) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const { error } = await client
      .from('stores')
      .update({ banner_url: null })
      .eq('id', storeId)

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, url: null })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Erro interno ao remover banner' },
      { status: 500 }
    )
  }
}
