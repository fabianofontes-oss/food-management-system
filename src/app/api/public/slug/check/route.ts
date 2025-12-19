import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
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
    const body = await request.json().catch(() => null)
    const rawSlug = String(body?.slug || '')

    if (!rawSlug) {
      return NextResponse.json({
        ok: true,
        normalized: '',
        available: false,
        reason: 'Slug é obrigatório',
      })
    }

    const normalized = normalizeSlug(rawSlug)

    // Validar formato do slug
    const validation = isValidSlug(normalized)
    if (!validation.valid) {
      return NextResponse.json({
        ok: true,
        normalized,
        available: false,
        reason: validation.reason,
      })
    }

    // Verificar se é slug reservado
    if (isReservedSlug(normalized)) {
      return NextResponse.json({
        ok: true,
        normalized,
        available: false,
        reason: 'Este slug é reservado pelo sistema',
      })
    }

    // Verificar se slug já existe em stores (case-insensitive)
    const { data: existingStore } = await supabaseAdmin
      .from('stores')
      .select('id')
      .ilike('slug', normalized)
      .maybeSingle()

    if (existingStore) {
      return NextResponse.json({
        ok: true,
        normalized,
        available: false,
        reason: 'Este slug já está em uso',
      })
    }

    // Verificar se slug está reservado em draft_stores
    const { data: existingDraft } = await supabaseAdmin
      .from('draft_stores')
      .select('id')
      .eq('slug', normalized)
      .maybeSingle()

    if (existingDraft) {
      return NextResponse.json({
        ok: true,
        normalized,
        available: false,
        reason: 'Este slug está temporariamente reservado',
      })
    }

    // Verificar slug_reservations também
    const { data: existingReservation } = await supabaseAdmin
      .from('slug_reservations')
      .select('id')
      .eq('slug', normalized)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (existingReservation) {
      return NextResponse.json({
        ok: true,
        normalized,
        available: false,
        reason: 'Este slug está temporariamente reservado',
      })
    }

    // Slug disponível!
    return NextResponse.json({
      ok: true,
      normalized,
      available: true,
    })
  } catch (error: any) {
    console.error('Erro ao verificar slug:', error)
    return NextResponse.json(
      { ok: false, error: error?.message || 'Erro ao verificar slug' },
      { status: 500 }
    )
  }
}
