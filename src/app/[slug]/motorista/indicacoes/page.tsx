'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AffiliatesTab } from '@/modules/driver'
import type { ReferralData } from '@/modules/driver/types'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

interface DriverContext {
  driver: {
    id: string
    name: string
    phone: string
    commission_percent: number
  }
  store: {
    id: string
    name: string
    slug: string
  }
}

export default function IndicacoesPage({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [referralData, setReferralData] = useState<ReferralData | null>(null)
  const [baseUrl, setBaseUrl] = useState('')

  useEffect(() => {
    async function loadData() {
      // 1. Verificar autenticação local (localStorage)
      const driverDataStr = localStorage.getItem(`driver_${params.slug}`)
      if (!driverDataStr) {
        router.push(`/${params.slug}/motorista`)
        return
      }

      try {
        const driverContext: DriverContext = JSON.parse(driverDataStr)
        const supabase = createClient()

        // 2. Determinar base URL
        const protocol = window.location.protocol
        const host = window.location.host
        setBaseUrl(`${protocol}//${host}`)

        // 3. Buscar partner do motorista (se existir user_id)
        if (driverContext.driver.id) {
          const { data: partner } = await supabase
            .from('referral_partners')
            .select('*')
            .eq('user_id', driverContext.driver.id)
            .eq('store_id', driverContext.store.id)
            .eq('is_active', true)
            .maybeSingle()

          if (partner) {
            // Buscar códigos
            const { data: codesData } = await supabase
              .from('referral_codes')
              .select('code, is_active')
              .eq('partner_id', partner.id)

            const codes = codesData || []

            // Contar referrals
            const { count } = await supabase
              .from('tenant_referrals')
              .select('*', { count: 'exact', head: true })
              .eq('partner_id', partner.id)

            const referralsCount = count || 0

            // Calcular comissões
            const { data: sales } = await supabase
              .from('referral_sales')
              .select('commission_amount, status')
              .eq('partner_id', partner.id)

            let pendingCommission = 0
            let availableCommission = 0

            if (sales) {
              pendingCommission = sales
                .filter((s: any) => s.status === 'PENDING')
                .reduce((acc: number, s: any) => acc + (s.commission_amount || 0), 0)
              
              availableCommission = sales
                .filter((s: any) => s.status === 'AVAILABLE')
                .reduce((acc: number, s: any) => acc + (s.commission_amount || 0), 0)
            }

            setReferralData({
              partner: {
                id: partner.id,
                display_name: partner.display_name,
                is_active: partner.is_active,
              },
              codes,
              referralsCount,
              pendingCommission,
              availableCommission,
            })
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [params.slug, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

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
