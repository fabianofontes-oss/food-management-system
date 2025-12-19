import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

interface PageProps {
  params: { code: string }
}

export default async function ReferralCapturePage({ params }: PageProps) {
  const { code } = params
  const upperCode = code.toUpperCase()

  // Criar cliente server para validar código
  const supabase = await createClient()

  // Verificar se código existe e está ativo
  const { data: codeData, error } = await supabase
    .from('referral_codes')
    .select('code, is_active')
    .eq('code', upperCode)
    .eq('is_active', true)
    .maybeSingle()

  if (error || !codeData) {
    // Código inválido - redirecionar com flag
    redirect('/onboarding?ref=invalid')
  }

  // Código válido - salvar cookie e redirecionar
  const cookieStore = await cookies()
  cookieStore.set('referral_code', upperCode, {
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 dias
    sameSite: 'lax',
    httpOnly: false,
  })

  // Redirecionar para onboarding
  redirect('/onboarding')
}
