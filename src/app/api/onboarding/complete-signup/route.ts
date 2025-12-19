import { NextRequest, NextResponse } from 'next/server'
import { completeSignupAction } from '@/modules/onboarding'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)

    const data = await completeSignupAction({
      token: String(body?.token || ''),
      userId: String(body?.userId || ''),
      email: String(body?.email || ''),
      name: String(body?.name || ''),
      phone: body?.phone ? String(body.phone) : undefined,
    })

    return NextResponse.json({ success: true, ...data })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Erro ao finalizar cadastro' },
      { status: 400 }
    )
  }
}
