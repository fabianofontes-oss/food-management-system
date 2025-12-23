'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Store, Building2, MapPin, ArrowRight, ExternalLink, Loader2, RefreshCw, Rocket,
  DollarSign, Users, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Clock,
  CreditCard, FileText, Activity, Calendar, BarChart3, PieChart
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { resetDemoStoreAction } from '@/lib/demo/actions'
import { toast } from 'sonner'

type StoreWithTenant = {
  id: string
  name: string
  slug: string
  created_at: string
  is_active: boolean
  tenant: {
    name: string
  }
}

interface DashboardStats {
  tenantsCount: number
  storesCount: number
  activeTenantsCount: number
  trialTenantsCount: number
  suspendedTenantsCount: number
  mrrCents: number // Monthly Recurring Revenue
  pendingInvoicesCents: number
  paidInvoicesCount: number
  overdueInvoicesCount: number
  newTenantsThisMonth: number
  ordersToday: number
  revenueToday: number
}

export default function SuperAdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentStores, setRecentStores] = useState<StoreWithTenant[]>([])
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [resettingDemo, setResettingDemo] = useState(false)

  const handleResetDemo = async () => {
    if (!confirm('Isso vai criar/resetar a loja-demo com dados de exemplo. Continuar?')) return
    
    setResettingDemo(true)
    try {
      const result = await resetDemoStoreAction()
      if (result.success && result.slug) {
        toast.success('Loja demo criada com sucesso!')
        router.push(`/${result.slug}/dashboard`)
      } else {
        toast.error(result.error || 'Erro ao criar loja demo')
      }
    } catch (err) {
      console.error('Erro:', err)
      toast.error('Erro ao criar loja demo')
    } finally {
      setResettingDemo(false)
    }
  }

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        
        // Buscar estatísticas via API (usa admin client)
        const [statsRes, storesRes] = await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/admin/stores?limit=10')
        ])
        
        if (!statsRes.ok || !storesRes.ok) {
          throw new Error('Erro ao carregar dados')
        }
        
        const statsData = await statsRes.json()
        const storesData = await storesRes.json()
        
        setStats(statsData)
        setRecentStores(storesData.stores || [])
      } catch (err) {
        console.error('Erro ao carregar dados:', err)
        setError('Erro ao carregar dados do dashboard')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando dados...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Centro de Comando</h1>
            <p className="text-gray-600">Visão geral do sistema multi-tenant</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-bold flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Sistema Operacional
            </span>
          </div>
        </div>

        {/* KPIs Principais */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-indigo-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Tenants</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.tenantsCount || 0}</p>
                </div>
                <Building2 className="w-8 h-8 text-indigo-500" />
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className="text-green-600 font-medium">{stats?.activeTenantsCount || 0} ativos</span>
                <span className="text-gray-400">•</span>
                <span className="text-blue-600">{stats?.trialTenantsCount || 0} trial</span>
                {(stats?.suspendedTenantsCount || 0) > 0 && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="text-red-600">{stats?.suspendedTenantsCount} suspensos</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Lojas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.storesCount || 0}</p>
                </div>
                <Store className="w-8 h-8 text-green-500" />
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Unidades operacionais
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">MRR</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    R$ {((stats?.mrrCents || 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-emerald-500" />
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Receita Mensal Recorrente
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-amber-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">A Receber</p>
                  <p className="text-2xl font-bold text-amber-600">
                    R$ {((stats?.pendingInvoicesCents || 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <CreditCard className="w-8 h-8 text-amber-500" />
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs">
                {(stats?.overdueInvoicesCount || 0) > 0 && (
                  <span className="text-red-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {stats?.overdueInvoicesCount} vencidas
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Métricas Secundárias */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Novos este mês</p>
                  <p className="text-xl font-bold text-gray-900">{stats?.newTenantsThisMonth || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Faturas Pagas</p>
                  <p className="text-xl font-bold text-gray-900">{stats?.paidInvoicesCount || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100">
                  <Activity className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Pedidos Hoje</p>
                  <p className="text-xl font-bold text-gray-900">{stats?.ordersToday || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">GMV Hoje</p>
                  <p className="text-xl font-bold text-gray-900">
                    R$ {(stats?.revenueToday || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* BOTÃO DE EMERGÊNCIA - LOJA DEMO */}
        <Card className="border-2 border-dashed border-amber-300 bg-amber-50">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-100 rounded-xl">
                  <Rocket className="w-8 h-8 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-amber-900">Loja Demo para Testes</h3>
                  <p className="text-amber-700">Cria/reseta uma loja com categorias e produtos de exemplo</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Link href="/loja-demo/dashboard">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold px-8"
                  >
                    <ArrowRight className="w-5 h-5 mr-2" />
                    ENTRAR NA LOJA
                  </Button>
                </Link>
                <Button
                  onClick={handleResetDemo}
                  disabled={resettingDemo}
                  size="lg"
                  variant="outline"
                  className="border-amber-500 text-amber-700 hover:bg-amber-100 font-bold px-6"
                >
                  {resettingDemo ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2" />
                      RESETAR
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/admin/tenants">
            <Card className="hover:shadow-xl transition-all hover:scale-105 cursor-pointer bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Building2 className="w-12 h-12 mb-4" />
                    <h3 className="text-2xl font-bold mb-2">Gerenciar Tenants</h3>
                    <p className="text-indigo-100">Redes, franquias e grupos empresariais</p>
                  </div>
                  <ArrowRight className="w-8 h-8" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/stores">
            <Card className="hover:shadow-xl transition-all hover:scale-105 cursor-pointer bg-gradient-to-br from-violet-500 to-violet-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <MapPin className="w-12 h-12 mb-4" />
                    <h3 className="text-2xl font-bold mb-2">Ver Todas as Lojas</h3>
                    <p className="text-violet-100">Gestão completa de unidades operacionais</p>
                  </div>
                  <ArrowRight className="w-8 h-8" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Últimas Lojas Criadas</CardTitle>
          </CardHeader>
          <CardContent>
            {recentStores.length === 0 ? (
              <div className="text-center py-12">
                <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhuma loja cadastrada ainda</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Loja</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Tenant</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Slug</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Data</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentStores.map((store) => (
                      <tr key={store.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 font-medium text-gray-900">{store.name}</td>
                        <td className="py-3 px-4 text-gray-600">{store.tenant.name}</td>
                        <td className="py-3 px-4">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">{store.slug}</code>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{new Date(store.created_at).toLocaleDateString('pt-BR')}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              store.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {store.is_active ? 'Ativa' : 'Inativa'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Link
                              href={`/${store.slug}/dashboard`}
                              className="flex items-center gap-1 px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-sm"
                            >
                              <ArrowRight className="w-4 h-4" />
                              ENTRAR
                            </Link>
                            <Link
                              href={`/${store.slug}`}
                              target="_blank"
                              className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Cardápio
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center text-gray-500 text-sm py-4">
          <p>Food Management System • Multi-tenant SaaS Platform • v1.0.0</p>
        </div>
      </div>
    </div>
  )
}
