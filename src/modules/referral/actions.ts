'use server'

import { ReferralRepository } from './repository'
import { CreatePartnerSchema, CreateCodeSchema } from './types'

/**
 * Buscar meus dados de referral
 */
export async function getMyReferralDataAction() {
  try {
    const data = await ReferralRepository.getMyReferralData()
    return { ok: true, data }
  } catch (error: any) {
    console.error('Erro ao buscar dados de referral:', error)
    return { ok: false, error: error?.message || 'Erro ao buscar dados' }
  }
}

/**
 * Criar meu perfil de afiliado
 */
export async function createMyPartnerAction(input: {
  storeId?: string
  partnerType: string
  displayName: string
}) {
  try {
    const validated = CreatePartnerSchema.parse(input)
    
    const partner = await ReferralRepository.createMyPartner({
      storeId: validated.storeId,
      partnerType: validated.partnerType,
      displayName: validated.displayName,
    })

    return { ok: true, partner }
  } catch (error: any) {
    console.error('Erro ao criar partner:', error)
    return { ok: false, error: error?.message || 'Erro ao criar perfil' }
  }
}

/**
 * Criar código de referral
 */
export async function createMyCodeAction(partnerId: string) {
  try {
    const validated = CreateCodeSchema.parse({ partnerId })
    const code = await ReferralRepository.createMyCode(validated.partnerId)
    return { ok: true, code }
  } catch (error: any) {
    console.error('Erro ao criar código:', error)
    return { ok: false, error: error?.message || 'Erro ao criar código' }
  }
}

/**
 * Buscar minhas lojas (para seleção no self-service)
 */
export async function getMyStoresForReferralAction() {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { ok: false, error: 'Não autenticado' }
    }

    const { data: storeUsers } = await supabase
      .from('store_users')
      .select(`
        store_id,
        role,
        stores:store_id (id, name, slug)
      `)
      .eq('user_id', user.id)

    if (!storeUsers) {
      return { ok: true, stores: [] }
    }

    const stores = storeUsers.map((su: any) => ({
      id: su.stores?.id,
      name: su.stores?.name,
      slug: su.stores?.slug,
      role: su.role,
    })).filter((s: any) => s.id)

    return { ok: true, stores }
  } catch (error: any) {
    console.error('Erro ao buscar lojas:', error)
    return { ok: false, error: error?.message || 'Erro ao buscar lojas' }
  }
}

/**
 * Capturar referral (chamado no publish do onboarding)
 */
export async function captureReferralAction(
  tenantId: string,
  referralCode: string,
  utm?: Record<string, any>
) {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { ok: false, error: 'Não autenticado' }
    }

    const captured = await ReferralRepository.captureReferral(
      tenantId,
      referralCode,
      user.id,
      utm
    )

    return { ok: true, captured }
  } catch (error: any) {
    console.error('Erro ao capturar referral:', error)
    return { ok: false, error: error?.message || 'Erro ao capturar indicação' }
  }
}
