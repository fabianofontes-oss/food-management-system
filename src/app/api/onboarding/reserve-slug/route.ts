import { NextRequest, NextResponse } from 'next/server'
import { reserveSlugAction } from '@/modules/onboarding'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const slug = String(body?.slug || '')

    const data = await reserveSlugAction(slug)
    return NextResponse.json({ success: true, ...data })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Erro ao reservar slug' },
      { status: 400 }
    )
  }
}
