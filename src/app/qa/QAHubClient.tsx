'use client'

import { useState, useEffect } from 'react'
import { ExternalLink, Copy, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  checkStore,
  checkTenant,
  checkCheckoutMode,
  checkPayments,
  checkUserSession,
  checkStoreAccess,
  getLastOrderIdForStore,
  getStoreBySlug,
  type QACheckResult
} from '@/lib/qa/queries'

type CheckResults = {
  store: QACheckResult | null
  tenant: QACheckResult | null
  checkoutMode: QACheckResult | null
  payments: QACheckResult | null
  userSession: QACheckResult | null
  storeAccess: QACheckResult | null
}

export function QAHubClient() {
  const [slug, setSlug] = useState('')
  const [lastOrderId, setLastOrderId] = useState<string | null>(null)
  const [checks, setChecks] = useState<CheckResults>({
    store: null,
    tenant: null,
    checkoutMode: null,
    payments: null,
    userSession: null,
    storeAccess: null
  })
  const [loading, setLoading] = useState(false)

  // Load slug from localStorage
  useEffect(() => {
    const savedSlug = localStorage.getItem('qa_store_slug') || ''
    setSlug(savedSlug)
    if (savedSlug) {
      runChecks(savedSlug)
    }
  }, [])

  // Save slug to localStorage
  useEffect(() => {
    if (slug) {
      localStorage.setItem('qa_store_slug', slug)
    }
  }, [slug])

  const runChecks = async (storeSlug: string) => {
    if (!storeSlug) return
    
    setLoading(true)
    
    try {
      const [
        storeCheck,
        tenantCheck,
        checkoutModeCheck,
        paymentsCheck,
        userSessionCheck,
        storeAccessCheck
      ] = await Promise.all([
        checkStore(storeSlug),
        checkTenant(storeSlug),
        checkCheckoutMode(storeSlug),
        checkPayments(storeSlug),
        checkUserSession(),
        checkStoreAccess(storeSlug)
      ])

      setChecks({
        store: storeCheck,
        tenant: tenantCheck,
        checkoutMode: checkoutModeCheck,
        payments: paymentsCheck,
        userSession: userSessionCheck,
        storeAccess: storeAccessCheck
      })

      // Get last order ID
      const store = await getStoreBySlug(storeSlug)
      if (store) {
        const orderId = await getLastOrderIdForStore(store.id)
        setLastOrderId(orderId)
      }
    } catch (error) {
      console.error('Error running checks:', error)
    } finally {
      setLoading(false)
    }
  }

  const openUrl = (url: string) => {
    window.open(url, '_blank')
  }

  const copyAllUrls = () => {
    const urls = [
      // Público
      `/${slug}`,
      `/${slug}/cart`,
      `/${slug}/checkout`,
      lastOrderId ? `/${slug}/order/${lastOrderId}` : null,
      // Lojista
      `/${slug}/dashboard`,
      `/${slug}/dashboard/products`,
      `/${slug}/dashboard/orders`,
      `/${slug}/dashboard/kitchen`,
      `/${slug}/dashboard/delivery`,
      `/${slug}/dashboard/crm`,
      `/${slug}/dashboard/pos`,
      `/${slug}/dashboard/reports`,
      `/${slug}/dashboard/coupons`,
      `/${slug}/dashboard/team`,
      `/${slug}/dashboard/settings`,
      // Super Admin
      '/admin',
      '/admin/analytics',
      // Auth
      '/login',
      '/signup',
      '/select-store'
    ].filter(Boolean).join('\n')

    navigator.clipboard.writeText(urls)
    alert('URLs copiadas!')
  }

  const openAllTabs = () => {
    const urls = [
      `/${slug}`,
      `/${slug}/dashboard`,
      `/${slug}/dashboard/products`,
      `/${slug}/dashboard/orders`
    ]
    
    urls.forEach(url => window.open(url, '_blank'))
  }

  const StatusBadge = ({ result }: { result: QACheckResult | null }) => {
    if (!result) return <span className="text-gray-400">-</span>

    const icons = {
      ok: <CheckCircle className="w-4 h-4 text-green-600" />,
      fail: <XCircle className="w-4 h-4 text-red-600" />,
      warning: <AlertCircle className="w-4 h-4 text-yellow-600" />
    }

    const colors = {
      ok: 'bg-green-50 text-green-700 border-green-200',
      fail: 'bg-red-50 text-red-700 border-red-200',
      warning: 'bg-yellow-50 text-yellow-700 border-yellow-200'
    }

    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${colors[result.status]}`}>
        {icons[result.status]}
        <span className="text-sm font-medium">{result.message}</span>
      </div>
    )
  }

  const RouteButton = ({ url, label }: { url: string; label: string }) => (
    <button
      onClick={() => openUrl(url)}
      className="flex items-center justify-between w-full px-4 py-2 text-left text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
    >
      <span className="font-medium text-gray-700">{label}</span>
      <ExternalLink className="w-4 h-4 text-gray-400" />
    </button>
  )

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🔍 QA Hub</h1>
          <p className="text-gray-600">Central de verificação e acesso rápido a todas as rotas do sistema</p>
          <div className="mt-2 px-3 py-1 bg-yellow-50 border border-yellow-200 rounded-lg inline-block">
            <span className="text-xs font-medium text-yellow-800">⚠️ Disponível apenas em desenvolvimento</span>
          </div>
        </div>

        {/* Store Slug Input */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Store Slug
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="ex: minha-loja"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Button
              onClick={() => runChecks(slug)}
              disabled={!slug || loading}
              className="px-6"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Verificar'
              )}
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
          <div className="flex gap-3">
            <Button
              onClick={copyAllUrls}
              disabled={!slug}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copiar todas as URLs
            </Button>
            <Button
              onClick={openAllTabs}
              disabled={!slug}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir principais (4 abas)
            </Button>
          </div>
        </div>

        {/* Checks */}
        {slug && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Checagens Rápidas</h2>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-600 mb-1 block">Store existe?</span>
                <StatusBadge result={checks.store} />
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600 mb-1 block">Tenant i18n</span>
                <StatusBadge result={checks.tenant} />
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600 mb-1 block">Checkout Mode</span>
                <StatusBadge result={checks.checkoutMode} />
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600 mb-1 block">Pagamentos</span>
                <StatusBadge result={checks.payments} />
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600 mb-1 block">Usuário autenticado?</span>
                <StatusBadge result={checks.userSession} />
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600 mb-1 block">Acesso à store?</span>
                <StatusBadge result={checks.storeAccess} />
              </div>
            </div>
          </div>
        )}

        {/* Routes Grid */}
        {slug && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Público */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">🛒 Público (Cliente)</h2>
              <div className="space-y-2">
                <RouteButton url={`/${slug}`} label="Menu" />
                <RouteButton url={`/${slug}/cart`} label="Carrinho" />
                <RouteButton url={`/${slug}/checkout`} label="Checkout" />
                {lastOrderId && (
                  <RouteButton url={`/${slug}/order/${lastOrderId}`} label="Último Pedido" />
                )}
              </div>
            </div>

            {/* Lojista */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">🏪 Lojista (Dashboard)</h2>
              <div className="space-y-2">
                <RouteButton url={`/${slug}/dashboard`} label="Dashboard" />
                <RouteButton url={`/${slug}/dashboard/products`} label="Produtos" />
                <RouteButton url={`/${slug}/dashboard/orders`} label="Pedidos" />
                <RouteButton url={`/${slug}/dashboard/kitchen`} label="Cozinha" />
                <RouteButton url={`/${slug}/dashboard/delivery`} label="Delivery" />
                <RouteButton url={`/${slug}/dashboard/crm`} label="CRM" />
                <RouteButton url={`/${slug}/dashboard/pos`} label="PDV" />
                <RouteButton url={`/${slug}/dashboard/reports`} label="Relatórios" />
                <RouteButton url={`/${slug}/dashboard/coupons`} label="Cupons" />
                <RouteButton url={`/${slug}/dashboard/team`} label="Equipe" />
                <RouteButton url={`/${slug}/dashboard/settings`} label="Configurações" />
              </div>
            </div>

            {/* Super Admin + Auth */}
            <div className="space-y-6">
              {/* Super Admin */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">👑 Super Admin</h2>
                <div className="space-y-2">
                  <RouteButton url="/admin" label="Admin Home" />
                  <RouteButton url="/admin/analytics" label="Analytics" />
                </div>
              </div>

              {/* Auth */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">🔐 Autenticação</h2>
                <div className="space-y-2">
                  <RouteButton url="/login" label="Login" />
                  <RouteButton url="/signup" label="Signup" />
                  <RouteButton url="/select-store" label="Selecionar Loja" />
                </div>
              </div>
            </div>
          </div>
        )}

        {!slug && (
          <div className="text-center py-12 text-gray-500">
            Digite um store slug acima para começar
          </div>
        )}
      </div>
    </div>
  )
}
