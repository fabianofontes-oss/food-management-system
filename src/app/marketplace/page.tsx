'use client'

import { useState } from 'react'
import { Search, Store, MapPin, Star, TrendingUp, Users, Utensils, Coffee, Pizza, IceCream, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const FEATURED_STORES = [
  {
    id: '1',
    name: 'Pizzaria Bella',
    slug: 'pizzaria-bella',
    category: 'Pizzaria',
    rating: 4.8,
    deliveryTime: '30-40 min',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400',
    tags: ['Pizza', 'Italiana', 'Delivery']
  },
  {
    id: '2',
    name: 'Burger House',
    slug: 'burger-house',
    category: 'Hamburgueria',
    rating: 4.6,
    deliveryTime: '25-35 min',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
    tags: ['Burger', 'Fast Food', 'Artesanal']
  },
  {
    id: '3',
    name: 'Café Aroma',
    slug: 'cafe-aroma',
    category: 'Cafeteria',
    rating: 4.9,
    deliveryTime: '15-25 min',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
    tags: ['Café', 'Doces', 'Breakfast']
  }
]

const CATEGORIES = [
  { icon: Pizza, label: 'Pizza', color: 'from-red-500 to-orange-500' },
  { icon: Utensils, label: 'Restaurante', color: 'from-blue-500 to-cyan-500' },
  { icon: Coffee, label: 'Cafeteria', color: 'from-amber-500 to-yellow-500' },
  { icon: IceCream, label: 'Sobremesas', color: 'from-pink-500 to-purple-500' },
]

export default function MarketplacePage() {
  const [searchTerm, setSearchTerm] = useState('')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50/30">
      {/* Hero */}
      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Descubra os Melhores Restaurantes
          </h1>
          <p className="text-xl text-cyan-100 mb-8 max-w-2xl mx-auto">
            Encontre estabelecimentos incríveis perto de você. Delivery rápido e seguro.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por restaurante, prato ou categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-4 py-5 rounded-2xl text-slate-800 text-lg shadow-2xl focus:outline-none focus:ring-4 focus:ring-white/50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-6xl mx-auto px-4 -mt-8 mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon
            return (
              <button
                key={cat.label}
                className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-12 h-12 mx-auto mb-3 bg-gradient-to-br ${cat.color} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <p className="font-semibold text-slate-800">{cat.label}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Featured Stores */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-cyan-600" />
            Em Destaque
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURED_STORES.map((store) => (
            <Link
              key={store.id}
              href={`/${store.slug}`}
              className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200">
                <img
                  src={store.image}
                  alt={store.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-sm">{store.rating}</span>
                </div>
              </div>

              <div className="p-5">
                <h3 className="text-xl font-bold text-slate-800 mb-2">{store.name}</h3>
                <p className="text-sm text-slate-500 mb-3">{store.category}</p>
                
                <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
                  <Clock className="w-4 h-4" />
                  <span>{store.deliveryTime}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {store.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-cyan-50 text-cyan-700 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {FEATURED_STORES.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
            <Store className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              Nenhum estabelecimento encontrado
            </h3>
            <p className="text-slate-500">
              Seja o primeiro a cadastrar seu negócio!
            </p>
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
