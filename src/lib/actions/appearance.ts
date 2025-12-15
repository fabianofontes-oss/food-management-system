'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const BusinessHoursSchema = z.object({
  monday: z.string().optional(),
  tuesday: z.string().optional(),
  wednesday: z.string().optional(),
  thursday: z.string().optional(),
  friday: z.string().optional(),
  saturday: z.string().optional(),
  sunday: z.string().optional(),
})

const PublicProfileSchema = z.object({
  displayName: z.string().optional(),
  slogan: z.string().optional(),
  fullAddress: z.string().optional(),
  googleMapsUrl: z.string().url().optional().or(z.literal('')),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  tiktok: z.string().optional(),
  businessHours: BusinessHoursSchema.optional(),
  notes: z.string().optional(),
})

const MenuThemeSchema = z.object({
  preset: z.enum(['menuA', 'menuB', 'menuC']).optional(),
  cardVariant: z.enum(['cardA', 'cardB', 'cardC']).optional(),
  colors: z.object({
    primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    bg: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    text: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  }).optional(),
  layout: z.object({
    showSearch: z.boolean().optional(),
    showCategories: z.boolean().optional(),
  }).optional(),
})

const UpdateAppearanceSchema = z.object({
  storeId: z.string().uuid(),
  publicProfile: PublicProfileSchema.optional(),
  menuTheme: MenuThemeSchema.optional(),
})

export async function updateStoreAppearance(data: z.infer<typeof UpdateAppearanceSchema>) {
  try {
    const validated = UpdateAppearanceSchema.parse(data)
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Não autenticado' }
    }

    const { data: userStore } = await supabase
      .from('user_stores')
      .select('store_id')
      .eq('user_id', user.id)
      .eq('store_id', validated.storeId)
      .single()

    if (!userStore) {
      return { success: false, error: 'Sem permissão para editar esta loja' }
    }

    const updateData: Record<string, any> = {}
    
    if (validated.publicProfile !== undefined) {
      updateData.public_profile = validated.publicProfile
    }
    
    if (validated.menuTheme !== undefined) {
      updateData.menu_theme = validated.menuTheme
    }

    // @ts-ignore - public_profile and menu_theme not in generated types yet
    const { error } = await supabase
      .from('stores')
      .update(updateData)
      .eq('id', validated.storeId)

    if (error) {
      console.error('Error updating store appearance:', error)
      return { success: false, error: 'Erro ao atualizar aparência da loja' }
    }

    // @ts-ignore - slug exists in stores table
    const { data: store } = await supabase
      .from('stores')
      .select('slug')
      .eq('id', validated.storeId)
      .single()

    if (store?.slug) {
      revalidatePath(`/${store.slug}`)
      revalidatePath(`/${store.slug}/dashboard/appearance`)
    }

    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Dados inválidos', details: error.errors }
    }
    console.error('Error in updateStoreAppearance:', error)
    return { success: false, error: 'Erro ao atualizar aparência' }
  }
}

export async function getStoreAppearance(storeId: string) {
  try {
    const supabase = await createClient()

    // @ts-ignore - public_profile and menu_theme not in generated types yet
    const { data: store, error } = await supabase
      .from('stores')
      .select('public_profile, menu_theme, slug')
      .eq('id', storeId)
      .single()

    if (error) {
      console.error('Error fetching store appearance:', error)
      return { success: false, error: 'Erro ao buscar aparência da loja' }
    }

    return {
      success: true,
      data: {
        publicProfile: store.public_profile || {},
        menuTheme: store.menu_theme || {},
        slug: store.slug,
      },
    }
  } catch (error) {
    console.error('Error in getStoreAppearance:', error)
    return { success: false, error: 'Erro ao buscar aparência' }
  }
}
