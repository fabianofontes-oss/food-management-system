'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Store, MapPin, Phone, ExternalLink, LayoutDashboard, Loader2 } from 'lucide-react'
import { getStores, type StoreWithTenant } from '@/lib/superadmin/queries'

const nicheLabels: Record<string, string> = {
  acai: 'Açaíteria',
  burger: 'Hamburgueria',
  hotdog: 'Hotdog',
  marmita: 'Marmitaria',
  butcher: 'Açougue',
  ice_cream: 'Sorveteria',
  pizza: 'Pizzaria',
  sushi: 'Sushi',
  bakery: 'Padaria',
  other: 'Outro'
}

const modeLabels: Record<string, string> = {
  store: 'Loja Física',
  home: 'Home-based'
}

export default function StoresPage() {
  const [stores, setStores] = useState<StoreWithTenant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadStores()
  }, [])

  async function loadStores() {
    try {
      setLoading(true)
      const data = await getStores()
      setStores(data)
    } catch (err) {
      console.error('Erro ao carregar lojas:', err)
      setError('Erro ao carregar lojas')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando lojas...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={loadStores} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Gestão de Lojas</h1>
          <p className="text-gray-600 mt-1">Gerenciar Lojas e Unidades</p>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Store className="w-8 h-8 text-green-600" />
              <span className="text-3xl font-bold text-gray-900">{stores.length}</span>
            </div>
            <div className="text-gray-600">Total de Lojas</div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Store className="w-8 h-8 text-blue-600" />
              <span className="text-3xl font-bold text-gray-900">
                {stores.filter(s => s.is_active).length}
              </span>
            </div>
            <div className="text-gray-600">Lojas Ativas</div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Store className="w-8 h-8 text-purple-600" />
              <span className="text-3xl font-bold text-gray-900">
                {new Set(stores.map(s => s.niche)).size}
              </span>
            </div>
            <div className="text-gray-600">Nichos Diferentes</div>
          </div>
        </div>

        {/* Stores List */}
        {stores.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Nenhuma loja cadastrada</p>
          </div>
        ) : (
          <div className="space-y-4">
            {stores.map((store) => (
              <div key={store.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Store className="w-6 h-6 text-green-600" />
                      <h3 className="text-2xl font-bold text-gray-900">{store.name}</h3>
                      {store.is_active ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">
                          Ativa
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded-full">
                          Inativa
                        </span>
                      )}
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-3 text-gray-600 mb-4">
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4" />
                        <span className="text-sm">
                          <span className="font-semibold">Tenant:</span> {store.tenant.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4" />
                        <span className="text-sm">
                          <span className="font-semibold">Slug:</span> <code className="bg-gray-100 px-2 py-1 rounded text-xs">{store.slug}</code>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4" />
                        <span className="text-sm">
                          <span className="font-semibold">Nicho:</span> {nicheLabels[store.niche] || store.niche}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4" />
                        <span className="text-sm">
                          <span className="font-semibold">Modo:</span> {modeLabels[store.mode] || store.mode}
                        </span>
                      </div>
                      {store.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <span className="text-sm">{store.phone}</span>
                        </div>
                      )}
                      {store.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm">{store.address}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-500 mb-3">
                      Criado em: {new Date(store.created_at).toLocaleDateString('pt-BR')}
                    </div>
                    
                    {/* Links de Acesso Rápido */}
                    <div className="flex gap-2">
                      <Link
                        href={`/${store.slug}`}
                        target="_blank"
                        className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Cardápio
                      </Link>
                      <Link
                        href={`/${store.slug}/dashboard`}
                        target="_blank"
                        className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-emerald-600 border border-emerald-300 rounded-lg hover:bg-emerald-50 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
