'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Store, Building2, MapPin, ArrowRight, ExternalLink, LayoutDashboard, Loader2, RefreshCw, Rocket } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getTenantsCount, getStoresCount, getRecentStores, type StoreWithTenant } from '@/lib/superadmin/queries'
import { resetDemoStoreAction } from '@/lib/demo/actions'
import { toast } from 'sonner'

export default function SuperAdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [tenantsCount, setTenantsCount] = useState(0)
  const [storesCount, setStoresCount] = useState(0)
  const [recentStores, setRecentStores] = useState<StoreWithTenant[]>([])
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
        const [tenants, stores, recent] = await Promise.all([
          getTenantsCount(),
          getStoresCount(),
          getRecentStores(10),
        ])
        setTenantsCount(tenants)
        setStoresCount(stores)
        setRecentStores(recent)
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total de Tenants</CardTitle>
              <div className="p-2 rounded-lg bg-indigo-50">
                <Building2 className="w-5 h-5 text-indigo-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{tenantsCount}</div>
              <p className="text-sm text-gray-500 mt-1">Redes cadastradas</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total de Lojas</CardTitle>
              <div className="p-2 rounded-lg bg-green-50">
                <Store className="w-5 h-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{storesCount}</div>
              <p className="text-sm text-gray-500 mt-1">Unidades operacionais</p>
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
