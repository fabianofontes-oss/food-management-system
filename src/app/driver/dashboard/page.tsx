'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Loader2, Truck, MapPin, Star, DollarSign, Link2, Copy, Check,
  Package, Clock, TrendingUp, Users, ChevronRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

type Tab = 'entregas' | 'afiliados'

interface DriverStats {
  totalDeliveries: number
  pendingDeliveries: number
  averageRating: number
  totalEarnings: number
}

interface ReferralData {
  partner: {
    id: string
    display_name: string
    is_active: boolean
  } | null
  codes: Array<{ code: string; is_active: boolean }>
  referralsCount: number
  pendingCommission: number
  availableCommission: number
}

export default function DriverDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('entregas')
  const [driverStats, setDriverStats] = useState<DriverStats | null>(null)
  const [referralData, setReferralData] = useState<ReferralData | null>(null)
  const [copied, setCopied] = useState(false)
  const [stores, setStores] = useState<Array<{ id: string; name: string; slug: string }>>([])

  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : 'https://pediu.food'

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const supabase = createClient()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Buscar stores onde é DRIVER
      const { data: storeUsers } = await supabase
        .from('store_users')
        .select('store_id, role, stores(id, name, slug)')
        .eq('user_id', user.id)
        .eq('role', 'DRIVER')

      const storeList = (storeUsers || []).map((su: any) => ({
        id: su.stores?.id,
        name: su.stores?.name,
        slug: su.stores?.slug,
      })).filter((s: any) => s.id)

      setStores(storeList)

      // Buscar dados de afiliado
      const { data: partner } = await supabase
        .from('referral_partners')
        .select('id, display_name, is_active')
        .eq('user_id', user.id)
        .eq('partner_type', 'DRIVER')
        .maybeSingle()

      if (partner) {
        const { data: codes } = await supabase
          .from('referral_codes')
          .select('code, is_active')
          .eq('partner_id', partner.id)

        const { data: referrals } = await supabase
          .from('tenant_referrals')
          .select('id, referral_codes!inner(partner_id)')
          .eq('referral_codes.partner_id', partner.id)

        const { data: sales } = await supabase
          .from('referral_sales')
          .select('commission_amount, status')
          .eq('partner_id', partner.id)

        const pending = (sales || [])
          .filter((s: any) => s.status === 'PENDING')
          .reduce((sum: number, s: any) => sum + (s.commission_amount || 0), 0)

        const available = (sales || [])
          .filter((s: any) => s.status === 'AVAILABLE')
          .reduce((sum: number, s: any) => sum + (s.commission_amount || 0), 0)

        setReferralData({
          partner: { id: partner.id, display_name: partner.display_name, is_active: partner.is_active },
          codes: codes || [],
          referralsCount: referrals?.length || 0,
          pendingCommission: pending,
          availableCommission: available,
        })
      }

      // Stats de entregas (simulados por enquanto)
      setDriverStats({
        totalDeliveries: 0,
        pendingDeliveries: 0,
        averageRating: 0,
        totalEarnings: 0,
      })

    } catch (e) {
      console.error('Erro ao carregar dados:', e)
    } finally {
      setLoading(false)
    }
  }

  function copyLink(code: string) {
    const link = `${baseUrl}/r/${code}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
      </div>
    )
  }

  const mainCode = referralData?.codes?.[0]?.code

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-lg">
              <Truck className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold">Dashboard Motoboy</h1>
          </div>
          <p className="text-white/80">Gerencie suas entregas e indicações</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('entregas')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === 'entregas'
                  ? 'border-violet-600 text-violet-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Package className="w-4 h-4 inline mr-2" />
              Entregas
            </button>
            <button
              onClick={() => setActiveTab('afiliados')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === 'afiliados'
                  ? 'border-violet-600 text-violet-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Link2 className="w-4 h-4 inline mr-2" />
              Afiliados
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Tab: Entregas */}
        {activeTab === 'entregas' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <Package className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{driverStats?.totalDeliveries || 0}</p>
                    <p className="text-xs text-slate-500">Entregas</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <Clock className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{driverStats?.pendingDeliveries || 0}</p>
                    <p className="text-xs text-slate-500">Pendentes</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <Star className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{driverStats?.averageRating?.toFixed(1) || '-'}</p>
                    <p className="text-xs text-slate-500">Avaliação</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <DollarSign className="w-6 h-6 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold">R$ {((driverStats?.totalEarnings || 0) / 100).toFixed(0)}</p>
                    <p className="text-xs text-slate-500">Ganhos</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Lojas vinculadas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Lojas Vinculadas</CardTitle>
              </CardHeader>
              <CardContent>
                {stores.length === 0 ? (
                  <p className="text-slate-500 text-center py-4">
                    Você ainda não está vinculado a nenhuma loja
                  </p>
                ) : (
                  <div className="space-y-2">
                    {stores.map((store) => (
                      <Link
                        key={store.id}
                        href={`/${store.slug}/dashboard`}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <span className="font-medium">{store.name}</span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Entregas pendentes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Entregas Pendentes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-500 text-center py-8">
                  Nenhuma entrega pendente no momento
                </p>
              </CardContent>
            </Card>
          </>
        )}

        {/* Tab: Afiliados */}
        {activeTab === 'afiliados' && (
          <>
            {!referralData?.partner ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <div className="inline-block p-4 bg-violet-100 rounded-full mb-4">
                    <Users className="w-8 h-8 text-violet-600" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mb-2">
                    Seja um Afiliado!
                  </h2>
                  <p className="text-slate-600 mb-6 max-w-md mx-auto">
                    Indique outros motoboys e ganhe 80% de comissão sobre as indicações.
                  </p>
                  <Link href={stores[0] ? `/${stores[0].slug}/dashboard/afiliados` : '/login'}>
                    <Button>
                      Criar meu link de afiliado
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Meu Link */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Link2 className="w-5 h-5" />
                      Meu Link de Indicação
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {mainCode ? (
                      <div className="bg-slate-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="overflow-hidden">
                            <p className="text-sm text-slate-500 mb-1">Compartilhe este link:</p>
                            <p className="text-lg font-mono font-semibold text-violet-600 truncate">
                              {baseUrl}/r/{mainCode}
                            </p>
                          </div>
                          <button
                            onClick={() => copyLink(mainCode)}
                            className="p-3 bg-violet-100 rounded-lg hover:bg-violet-200 transition-colors flex-shrink-0 ml-2"
                          >
                            {copied ? (
                              <Check className="w-5 h-5 text-green-600" />
                            ) : (
                              <Copy className="w-5 h-5 text-violet-600" />
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-500">Nenhum código gerado</p>
                    )}
                  </CardContent>
                </Card>

                {/* Stats de Afiliado */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Indicações</p>
                          <p className="text-2xl font-bold">{referralData.referralsCount}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                          <Clock className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Pendente</p>
                          <p className="text-2xl font-bold">
                            R$ {(referralData.pendingCommission / 100).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Disponível</p>
                          <p className="text-2xl font-bold text-green-600">
                            R$ {(referralData.availableCommission / 100).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Info */}
                <Card className="bg-violet-50 border-violet-200">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold text-violet-900 mb-2">Como funciona?</h3>
                    <ul className="text-sm text-violet-800 space-y-1">
                      <li>• Você recebe <strong>80%</strong> da comissão por cada indicação</li>
                      <li>• A loja que te cadastrou recebe os outros 20% como crédito</li>
                      <li>• Comissões ficam pendentes por 60 dias (D+60)</li>
                      <li>• Após 60 dias, o valor fica disponível para saque</li>
                    </ul>
                  </CardContent>
                </Card>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
