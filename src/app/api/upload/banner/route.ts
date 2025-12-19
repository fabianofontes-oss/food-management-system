import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const storeId = formData.get('storeId') as string

    if (!file || !storeId) {
      return NextResponse.json(
        { success: false, error: 'Arquivo ou storeId ausente' },
        { status: 400 }
      )
    }

    // Verificar permissão do usuário na loja
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

    // Validar tipo de arquivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Tipo de arquivo inválido. Use JPG, PNG ou WebP' },
        { status: 400 }
      )
    }

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Arquivo muito grande. Máximo 5MB' },
        { status: 400 }
      )
    }

    // Upload para Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${storeId}-banner-${Date.now()}.${fileExt}`
    const filePath = `banners/${fileName}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('store-assets')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error('Error uploading banner:', {
        message: uploadError?.message,
        name: uploadError?.name,
        storeId,
      })
      return NextResponse.json(
        { success: false, error: 'Erro ao fazer upload do banner' },
        { status: 500 }
      )
    }

    // Obter URL pública
    const { data: publicUrlData } = supabase.storage
      .from('store-assets')
      .getPublicUrl(filePath)

    const bannerUrl = publicUrlData.publicUrl

    // Atualizar banner_url na tabela stores
    const { error: updateError } = await supabase
      .from('stores')
      .update({ banner_url: bannerUrl })
      .eq('id', storeId)

    if (updateError) {
      console.error('Error updating store banner_url:', {
        message: updateError?.message,
        code: updateError?.code,
        storeId,
      })
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar banner da loja' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      url: bannerUrl,
    })
  } catch (error: any) {
    console.error('Error in banner upload API:', {
      message: error?.message,
      stack: error?.stack,
    })
    return NextResponse.json(
      { success: false, error: 'Erro interno ao processar upload' },
      { status: 500 }
    )
  }
}
