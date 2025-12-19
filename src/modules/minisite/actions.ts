/**
 * Módulo Minisite - Server Actions
 * Chamadas ao Repository
 */

'use server'

import { revalidatePath } from 'next/cache'
import { MinisiteRepository } from './repository'
import type { MinisiteTheme } from './types'

export async function updateMinisiteThemeAction(
  storeId: string,
  theme: MinisiteTheme,
  slug?: string
): Promise<{ success: boolean; error?: string }> {
  console.log('=== updateMinisiteThemeAction ===')
  console.log('storeId:', storeId)
  console.log('theme:', JSON.stringify(theme))
  console.log('slug:', slug)
  
  try {
    // Validação simples
    if (!theme || !theme.layout || !theme.colors || !theme.display) {
      return { success: false, error: 'Tema inválido' }
    }

    const success = await MinisiteRepository.updateTheme(storeId, theme)
    console.log('repository result:', success)
    
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
