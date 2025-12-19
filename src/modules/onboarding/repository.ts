import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type {
  ReserveSlugResult,
  CompleteSignupInput,
  CompleteSignupResult,
} from './types'

function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Variáveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias')
  }

  return createSupabaseAdminClient<Database>(supabaseUrl, serviceRoleKey)
}

export const OnboardingRepository = {
  async reserveSlug(slug: string): Promise<ReserveSlugResult> {
    const supabase = createAdminClient()

    // Cleanup simples de expiradas (evita bloquear slug pra sempre)
    await supabase.from('slug_reservations').delete().lt('expires_at', new Date().toISOString())

    // Verificar se slug já existe em stores
    const { data: existingStore } = await supabase
      .from('stores')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (existingStore?.id) {
      throw new Error('Slug indisponível')
    }

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('slug_reservations')
      .insert({ slug, expires_at: expiresAt })
      .select('slug, token, expires_at')
      .single()

    if (error) {
      // Provável violação de UNIQUE(slug)
      throw new Error('Slug indisponível')
    }

    return {
      slug: data.slug,
      token: String(data.token),
      expiresAt: data.expires_at,
    }
  },

  async getReservationByToken(token: string) {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('slug_reservations')
      .select('id, slug, token, expires_at')
      .eq('token', token)
      .single()

    if (error || !data) return null
    return data
  },

  async completeSignup(input: CompleteSignupInput): Promise<CompleteSignupResult> {
    const supabase = createAdminClient()

    const reservation = await this.getReservationByToken(input.token)
    if (!reservation) {
      throw new Error('Reserva inválida ou expirada')
    }

    if (new Date(reservation.expires_at).getTime() < Date.now()) {
      // Expirada
      await supabase.from('slug_reservations').delete().eq('id', reservation.id)
      throw new Error('Reserva expirada')
    }

    const slug = reservation.slug

    // Criar tenant
    const tenantName = input.name?.trim() ? input.name.trim() : slug
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({ name: tenantName })
      .select('id')
      .single()

    if (tenantError || !tenant) {
      throw new Error(tenantError?.message || 'Erro ao criar tenant')
    }

    // Criar store (defaults coerentes com os enums)
    const storeName = input.name?.trim() ? input.name.trim() : slug
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .insert({
        tenant_id: tenant.id,
        name: storeName,
        slug,
        niche: 'other',
        mode: 'store',
        is_active: true,
        phone: input.phone || null,
      } as any)
      .select('id')
      .single()

    if (storeError || !store) {
      // rollback tenant
      await supabase.from('tenants').delete().eq('id', tenant.id)
      throw new Error(storeError?.message || 'Erro ao criar loja')
    }

    // Garantir user row
    await supabase.from('users').upsert(
      { id: input.userId, name: input.name, email: input.email },
      { onConflict: 'id' }
    )

    // Vincular store_user OWNER
    const { error: linkError } = await supabase
      .from('store_users')
      .insert({ store_id: store.id, user_id: input.userId, role: 'OWNER' } as any)

    if (linkError) {
      // rollback store + tenant
      await supabase.from('stores').delete().eq('id', store.id)
      await supabase.from('tenants').delete().eq('id', tenant.id)
      throw new Error(linkError.message || 'Erro ao vincular usuário à loja')
    }

    // Remover reserva
    await supabase.from('slug_reservations').delete().eq('id', reservation.id)

    return {
      tenantId: tenant.id,
      storeId: store.id,
      slug,
    }
  },
}
