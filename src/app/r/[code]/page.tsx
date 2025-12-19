import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

interface PageProps {
  params: { code: string }
}

export default async function ReferralCapturePage({ params }: PageProps) {
  const { code } = params
  const upperCode = code.toUpperCase()

  // Criar cliente anon para validar código
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
    httpOnly: false, // Precisa ser acessível no client para leitura
  })

  // Redirecionar para onboarding
  redirect('/onboarding')
}
