import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { AffiliatesTab } from '@/modules/driver'
import type { ReferralData } from '@/modules/driver/types'

export default async function IndicacoesPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient()

  // 1. Verificar autenticação
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/${params.slug}/login`)
  }

  // 2. Buscar loja pelo slug
  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('slug', params.slug)
    .single()

  if (!store) {
    redirect(`/${params.slug}/login`)
  }

  // 3. Buscar partner do motorista
  const { data: partner } = await supabase
    .from('referral_partners')
    .select('*')
    .eq('user_id', user.id)
    .eq('store_id', store.id)
    .eq('is_active', true)
    .maybeSingle()

  // 4. Se tiver partner, buscar códigos e stats
  let codes: Array<{ code: string; is_active: boolean }> = []
  let referralsCount = 0
  let pendingCommission = 0
  let availableCommission = 0

  if (partner) {
    // Buscar códigos
    const { data: codesData } = await supabase
      .from('referral_codes')
      .select('code, is_active')
      .eq('partner_id', partner.id)

    codes = codesData || []

    // Contar referrals
    const { count } = await supabase
      .from('tenant_referrals')
      .select('*', { count: 'exact', head: true })
      .eq('partner_id', partner.id)

    referralsCount = count || 0

    // Calcular comissões
    const { data: sales } = await supabase
      .from('referral_sales')
      .select('commission_amount, status')
      .eq('partner_id', partner.id)

    if (sales) {
      pendingCommission = sales
        .filter((s: any) => s.status === 'PENDING')
        .reduce((acc: number, s: any) => acc + (s.commission_amount || 0), 0)
      
      availableCommission = sales
        .filter((s: any) => s.status === 'AVAILABLE')
        .reduce((acc: number, s: any) => acc + (s.commission_amount || 0), 0)
    }
  }

  // 5. Montar dados de referral
  const referralData: ReferralData | null = partner ? {
    partner: {
      id: partner.id,
      display_name: partner.display_name,
      is_active: partner.is_active,
    },
    codes,
    referralsCount,
    pendingCommission,
    availableCommission,
  } : null

  // 6. Determinar base URL
  const headersList = await headers()
  const host = headersList.get('host') || 'pediu.food'
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
  const baseUrl = `${protocol}://${host}`

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Programa de Indicações</h1>
      <AffiliatesTab 
        referralData={referralData} 
        baseUrl={baseUrl} 
      />
    </div>
  )
}
