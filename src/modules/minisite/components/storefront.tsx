/**
 * Componente StoreFront - Renderiza o cardápio público
 * Seleciona o layout correto baseado no tema
 */

'use client'

import { cn } from '@/lib/utils'
import type { MinisiteData, MinisiteTheme, MinisiteCategory } from '../types'
import { Search, MapPin, Phone } from 'lucide-react'
import { useState } from 'react'

interface StoreFrontProps {
  data: MinisiteData
}

export function StoreFront({ data }: StoreFrontProps) {
  const { store, theme, categories } = data
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  // Filtrar produtos por busca
  const filteredCategories = categories
    .map(cat => ({
      ...cat,
      products: cat.products.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase())
      )
    }))
    .filter(cat => cat.products.length > 0)

  // CSS Variables do tema
  const cssVars = {
    '--theme-primary': theme.colors.primary,
    '--theme-background': theme.colors.background,
    '--theme-header': theme.colors.header,
  } as React.CSSProperties

  return (
    <div 
      className="min-h-screen"
      style={{ ...cssVars, backgroundColor: theme.colors.background }}
    >
      {/* Header */}
      <header style={{ backgroundColor: theme.colors.header }}>
        {/* Banner */}
        {theme.display.showBanner && (
          <div 
            className="h-40 bg-gradient-to-r from-slate-200 to-slate-300 bg-cover bg-center"
            style={{ 
              backgroundImage: theme.bannerUrl || store.banner_url 
                ? `url(${theme.bannerUrl || store.banner_url})` 
                : undefined 
            }}
          />
        )}

        {/* Store Info */}
        <div className={cn(
          'p-4',
          theme.display.showBanner && '-mt-12 relative z-10'
        )}>
          <div className="flex items-center gap-4">
            {theme.display.showLogo && (
              <div 
                className="w-20 h-20 rounded-xl bg-white shadow-lg flex items-center justify-center text-2xl font-bold overflow-hidden"
                style={{ color: theme.colors.primary }}
              >
                {store.logo_url ? (
                  <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover" />
                ) : (
                  store.name.charAt(0)
                )}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-slate-900">{store.name}</h1>
              {theme.display.showAddress && store.address && (
                <p className="text-sm text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {store.address}
                </p>
              )}
            </div>
          </div>

          {/* Search */}
          {theme.display.showSearch && (
            <div className="mt-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar no cardápio..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm"
              />
            </div>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex overflow-x-auto gap-2 px-4 pb-4 scrollbar-hide">
          <button
            onClick={() => setActiveCategory(null)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
              !activeCategory 
                ? 'text-white' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            )}
            style={{ 
              backgroundColor: !activeCategory ? theme.colors.primary : undefined 
            }}
          >
            Todos
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                activeCategory === cat.id 
                  ? 'text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
              style={{ 
                backgroundColor: activeCategory === cat.id ? theme.colors.primary : undefined 
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </header>

      {/* Products */}
      <main className="p-4 space-y-6">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500">Nenhum produto encontrado</p>
          </div>
        ) : (
          filteredCategories
            .filter(cat => !activeCategory || cat.id === activeCategory)
            .map(cat => (
              <section key={cat.id}>
                <h2 className="font-semibold text-lg text-slate-800 mb-3">{cat.name}</h2>
                <div className={cn(
                  theme.layout === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-3'
                )}>
                  {cat.products.map(product => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      layout={theme.layout}
                      primaryColor={theme.colors.primary}
                    />
                  ))}
                </div>
              </section>
            ))
        )}
      </main>
    </div>
  )
}

// Componente de card de produto
function ProductCard({ 
  product, 
  layout, 
  primaryColor 
}: { 
  product: MinisiteCategory['products'][0]
  layout: string
  primaryColor: string
}) {
  const formatPrice = (price: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)

  if (layout === 'grid') {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="aspect-square bg-slate-100">
          {product.image_url && (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          )}
        </div>
        <div className="p-3">
          <p className="font-medium text-sm text-slate-800 line-clamp-1">{product.name}</p>
          <p className="font-bold text-sm mt-1" style={{ color: primaryColor }}>
            {formatPrice(product.price)}
          </p>
        </div>
      </div>
    )
  }

  // Layout padrão (modern, classic, minimal)
  return (
    <div className="flex gap-3 bg-white rounded-xl shadow-sm border border-slate-100 p-3">
      {product.image_url && (
        <div className="w-20 h-20 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden">
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-800">{product.name}</p>
        {product.description && (
          <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{product.description}</p>
        )}
        <p className="font-bold text-sm mt-1" style={{ color: primaryColor }}>
          {formatPrice(product.price)}
        </p>
      </div>
    </div>
  )
}
