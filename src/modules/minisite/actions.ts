/**
 * Módulo Minisite - Server Actions
 * Validação Zod + chamadas ao Repository
 */

'use server'

import { revalidatePath } from 'next/cache'
import { MinisiteRepository } from './repository'
import { MinisiteThemeSchema, type MinisiteTheme } from './types'

export async function updateMinisiteThemeAction(
  storeId: string,
  theme: MinisiteTheme,
  slug?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validar tema
    const validated = MinisiteThemeSchema.safeParse(theme)
    if (!validated.success) {
      return { success: false, error: 'Tema inválido' }
    }

    const success = await MinisiteRepository.updateTheme(storeId, validated.data)
    
    if (!success) {
      return { success: false, error: 'Erro ao salvar tema' }
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
    const success = await MinisiteRepository.updateBannerUrl(storeId, bannerUrl)
    
    if (!success) {
      return { success: false, error: 'Erro ao salvar banner' }
    }

    // Revalidar cache
    if (slug) {
      revalidatePath(`/${slug}`)
    }

    return { success: true }
  } catch (error: any) {
    console.error('[updateMinisiteBannerAction]', error)
    return { success: false, error: error.message || 'Erro desconhecido' }
  }
}
