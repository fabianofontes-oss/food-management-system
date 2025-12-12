'use client'

import { useState, useEffect } from 'react'
import { ExternalLink, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function QAHubClient() {
  const [slug, setSlug] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('qa_store_slug') || ''
      setSlug(saved)
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined' && slug) {
      localStorage.setItem('qa_store_slug', slug)
    }
  }, [slug])

  const openUrl = (url: string) => {
    window.open(url, '_blank')
  }

  const copyAllUrls = () => {
    if (!slug) {
      alert('Digite um slug primeiro!')
      return
    }
    
    const urls = [
      `/${slug}`,
      `/${slug}/cart`,
      `/${slug}/checkout`,
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
      '/admin',
      '/admin/analytics',
      '/login',
      '/signup',
      '/select-store'
    ].join('\n')

    navigator.clipboard.writeText(urls)
    alert('URLs copiadas!')
  }

  const openAllTabs = () => {
    if (!slug) {
      alert('Digite um slug primeiro!')
      return
    }
    
    const urls = [
      `/${slug}`,
      `/${slug}/dashboard`,
      `/${slug}/dashboard/products`,
      `/${slug}/dashboard/orders`
    ]
    
    urls.forEach(url => window.open(url, '_blank'))
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🔍 QA Hub</h1>
          <p className="text-gray-600">Central de verificação e acesso rápido a todas as rotas do sistema</p>
          <div className="mt-2 px-3 py-1 bg-yellow-50 border border-yellow-200 rounded-lg inline-block">
            <span className="text-xs font-medium text-yellow-800">⚠️ Disponível apenas em desenvolvimento</span>
          </div>
        </div>

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
          </div>
        </div>

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

        {slug && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">🛒 Público (Cliente)</h2>
              <div className="space-y-2">
                <RouteButton url={`/${slug}`} label="Menu" />
                <RouteButton url={`/${slug}/cart`} label="Carrinho" />
                <RouteButton url={`/${slug}/checkout`} label="Checkout" />
              </div>
            </div>

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

            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">👑 Super Admin</h2>
                <div className="space-y-2">
                  <RouteButton url="/admin" label="Admin Home" />
                  <RouteButton url="/admin/analytics" label="Analytics" />
                </div>
              </div>

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
