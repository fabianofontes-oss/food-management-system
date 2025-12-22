'use client'

import { useState, useEffect } from 'react'
import { 
  Search, Store, MapPin, Star, TrendingUp, Users, Utensils, Coffee, 
  Pizza, IceCream, Clock, Filter, X, Loader2, Navigation, Phone, ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { buscarCEP } from '@/lib/marketing-utils'

interface StoreData {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  banner_url: string | null
  city: string | null
  state: string | null
  phone: string | null
  whatsapp: string | null
  settings: any
  status: string
}

const CATEGORIES = [
  { icon: Pizza, label: 'Pizza', value: 'pizzaria', color: 'from-red-500 to-orange-500' },
  { icon: Utensils, label: 'Restaurante', value: 'restaurante', color: 'from-blue-500 to-cyan-500' },
  { icon: Coffee, label: 'Cafeteria', value: 'cafeteria', color: 'from-amber-500 to-yellow-500' },
  { icon: IceCream, label: 'Sobremesas', value: 'acai', color: 'from-pink-500 to-purple-500' },
  { icon: Users, label: 'Hamburgueria', value: 'hamburgueria', color: 'from-orange-500 to-red-500' },
  { icon: Store, label: 'Todos', value: '', color: 'from-slate-500 to-slate-600' },
]

export default function MarketplacePage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [stores, setStores] = useState<StoreData[]>([])
  const [filteredStores, setFilteredStores] = useState<StoreData[]>([])
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [cepFilter, setCepFilter] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  
  // Localização
  const [userCity, setUserCity] = useState('')
  const [userState, setUserState] = useState('')

  useEffect(() => {
    loadStores()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [searchTerm, cepFilter, cityFilter, categoryFilter, stores])

  async function loadStores() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('stores')
        .select('id, name, slug, description, logo_url, banner_url, city, state, phone, whatsapp, settings, status')
        .eq('status', 'active')
        .order('name')

      if (!error && data) {
        setStores(data)
        setFilteredStores(data)
      }
    } catch (err) {
      console.error('Erro ao carregar lojas:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleCEPSearch(cep: string) {
    setCepFilter(cep)
    if (cep.replace(/\D/g, '').length === 8) {
      const endereco = await buscarCEP(cep)
      if (endereco) {
        setUserCity(endereco.localidade)
        setUserState(endereco.uf)
        setCityFilter(endereco.localidade)
      }
    }
  }

  function applyFilters() {
    let filtered = stores

    // Filtro por termo de busca (nome ou descrição)
    if (searchTerm) {
      filtered = filtered.filter(store => 
        store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro por cidade
    if (cityFilter) {
      filtered = filtered.filter(store => 
        store.city?.toLowerCase().includes(cityFilter.toLowerCase())
      )
    }

    // Filtro por categoria (via settings.niche)
    if (categoryFilter) {
      filtered = filtered.filter(store => {
        const niche = store.settings?.niche || ''
        return niche.toLowerCase().includes(categoryFilter.toLowerCase())
      })
    }

    setFilteredStores(filtered)
  }

  function clearFilters() {
    setSearchTerm('')
    setCepFilter('')
    setCityFilter('')
    setCategoryFilter('')
    setUserCity('')
    setUserState('')
  }

  const activeFiltersCount = [searchTerm, cepFilter, cityFilter, categoryFilter].filter(Boolean).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50/30">
      {/* Hero */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              Descubra Restaurantes Incríveis
            </h1>
            <p className="text-xl text-white/90 mb-2">
              {stores.length} estabelecimentos cadastrados
            </p>
            {userCity && (
              <p className="text-lg text-white/80">
                📍 Mostrando resultados em {userCity}/{userState}
              </p>
            )}
          </div>

          {/* Search Bar Principal */}
          <div className="max-w-3xl mx-auto mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nome, tipo de comida, prato..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-4 py-5 rounded-2xl text-slate-800 text-lg shadow-2xl focus:outline-none focus:ring-4 focus:ring-white/50"
              />
            </div>
          </div>

          {/* Busca por Localização */}
          <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Digite seu CEP para ver perto de você"
                value={cepFilter}
                onChange={(e) => handleCEPSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl text-slate-800 shadow-lg focus:outline-none focus:ring-2 focus:ring-white/50"
                maxLength={9}
              />
            </div>
            <div className="relative">
              <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Ou digite sua cidade"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl text-slate-800 shadow-lg focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
          </div>

          {/* Filtros Ativos */}
          {activeFiltersCount > 0 && (
            <div className="max-w-3xl mx-auto mt-4 flex items-center gap-2 flex-wrap">
              <span className="text-sm text-white/80">Filtros ativos:</span>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm flex items-center gap-1 hover:bg-white/30"
                >
                  {searchTerm}
                  <X className="w-3 h-3" />
                </button>
              )}
              {cityFilter && (
                <button
                  onClick={() => setCityFilter('')}
                  className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm flex items-center gap-1 hover:bg-white/30"
                >
                  📍 {cityFilter}
                  <X className="w-3 h-3" />
                </button>
              )}
              {categoryFilter && (
                <button
                  onClick={() => setCategoryFilter('')}
                  className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm flex items-center gap-1 hover:bg-white/30"
                >
                  {CATEGORIES.find(c => c.value === categoryFilter)?.label}
                  <X className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={clearFilters}
                className="px-3 py-1 bg-red-500/80 backdrop-blur-sm rounded-full text-sm hover:bg-red-600/80"
              >
                Limpar tudo
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-6xl mx-auto px-4 -mt-8 mb-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon
            const isActive = categoryFilter === cat.value
            return (
              <button
                key={cat.label}
                onClick={() => setCategoryFilter(isActive ? '' : cat.value)}
                className={`bg-white rounded-2xl shadow-xl shadow-slate-200/50 border-2 p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ${
                  isActive ? 'border-purple-500 ring-4 ring-purple-500/20' : 'border-slate-100'
                }`}
              >
                <div className={`w-12 h-12 mx-auto mb-3 bg-gradient-to-br ${cat.color} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <p className="font-semibold text-slate-800 text-sm">{cat.label}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Resultados */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
              <Store className="w-8 h-8 text-purple-600" />
              {filteredStores.length === stores.length ? 'Todos os Restaurantes' : 'Resultados da Busca'}
            </h2>
            <p className="text-slate-600 mt-1">
              {filteredStores.length} {filteredStores.length === 1 ? 'estabelecimento encontrado' : 'estabelecimentos encontrados'}
            </p>
          </div>
          {activeFiltersCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Limpar filtros
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
          </div>
        ) : filteredStores.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
            <Store className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              Nenhum estabelecimento encontrado
            </h3>
            <p className="text-slate-500 mb-6">
              {activeFiltersCount > 0 
                ? 'Tente ajustar os filtros ou buscar por outra região'
                : 'Seja o primeiro a cadastrar seu negócio!'}
            </p>
            {activeFiltersCount > 0 ? (
              <Button onClick={clearFilters} variant="outline">
                Limpar filtros
              </Button>
            ) : (
              <Button asChild>
                <Link href="/criar-loja">
                  Cadastrar Meu Restaurante
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStores.map((store) => {
              const niche = store.settings?.niche || 'restaurante'
              const hasDelivery = store.settings?.has_delivery !== false
              
              return (
                <Link
                  key={store.id}
                  href={`/${store.slug}`}
                  className="group bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Banner/Logo */}
                  <div className="relative h-48 bg-gradient-to-br from-purple-100 to-pink-100">
                    {store.banner_url ? (
                      <img
                        src={store.banner_url}
                        alt={store.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Store className="w-16 h-16 text-purple-300" />
                      </div>
                    )}
                    {hasDelivery && (
                      <div className="absolute top-3 left-3 px-3 py-1 bg-green-500 text-white rounded-full text-xs font-bold">
                        🚚 Delivery
                      </div>
                    )}
                    {store.logo_url && (
                      <div className="absolute bottom-3 left-3 w-16 h-16 bg-white rounded-xl shadow-lg overflow-hidden border-2 border-white">
                        <img
                          src={store.logo_url}
                          alt={`${store.name} logo`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-5">
                    <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-purple-600 transition-colors">
                      {store.name}
                    </h3>
                    
                    {store.description && (
                      <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                        {store.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                      {store.city && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{store.city}/{store.state}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs rounded-full font-medium capitalize">
                        {niche}
                      </span>
                      {store.whatsapp && (
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <Phone className="w-3 h-3" />
                          WhatsApp
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Ver cardápio</span>
                        <ExternalLink className="w-4 h-4 text-purple-600 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Tem um Restaurante?
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Cadastre seu estabelecimento e comece a vender online hoje mesmo
          </p>
          <Button 
            asChild
            size="lg"
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-lg px-8 py-6 shadow-2xl shadow-cyan-500/25"
          >
            <Link href="/onboarding">
              Cadastrar Meu Negócio
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
