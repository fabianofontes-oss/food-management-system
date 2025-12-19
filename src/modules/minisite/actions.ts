/**
 * Módulo Minisite - Server Actions
 * Chamadas diretas ao Supabase
 */

'use server'

import { revalidatePath } from 'next/cache'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import type { MinisiteTheme } from './types'

function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Variáveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias para modo demo')
  }

  return createSupabaseAdminClient(supabaseUrl, serviceRoleKey)
}

export async function updateMinisiteThemeAction(
  storeId: string,
  theme: MinisiteTheme,
  slug?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validação simples
    if (!theme || !theme.layout || !theme.colors || !theme.display) {
      return { success: false, error: 'Tema inválido' }
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const isDemoSlug = slug === 'demo'
    const client = !user && isDemoSlug ? createAdminClient() : supabase

    const { data, error } = await client
      .from('stores')
      .update({ menu_theme: theme })
      .eq('id', storeId)
      .select('id')

    if (error) {
      return { success: false, error: error.message }
    }

    if (!data || data.length === 0) {
      return { success: false, error: 'Loja não encontrada' }
    }

    // Revalidar cache
    revalidatePath('/', 'layout')
    if (slug) {
      revalidatePath(`/${slug}`)
      revalidatePath(`/${slug}/dashboard/appearance`)
    }

    return { success: true }
  } catch (error: any) {
    console.error('[updateMinisiteThemeAction]', error)
    return { success: false, error: error.message || 'Erro desconhecido' }
  }
}

export async function updateMinisiteBannerAction(
  storeId: string,
  bannerUrl: string | null,
  slug?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const isDemoSlug = slug === 'demo'
    const client = !user && isDemoSlug ? createAdminClient() : supabase

    const { error } = await client
      .from('stores')
      .update({ banner_url: bannerUrl })
      .eq('id', storeId)

    if (error) {
      return { success: false, error: error.message }
    }

    if (slug) {
      revalidatePath(`/${slug}`)
    }

    return { success: true }
  } catch (error: any) {
    console.error('[updateMinisiteBannerAction]', error)
    return { success: false, error: error.message || 'Erro desconhecido' }
  }
}
