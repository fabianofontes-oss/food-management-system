'use client'

import { Search, Plus, MapPin, Clock } from 'lucide-react'
import { useState } from 'react'
import type { MenuTheme } from '../../../types'
import { isLightColor } from '../../../utils'

interface Product {
  id: string
  name: string
  description?: string | null
  price: number
  image_url?: string | null
  is_available: boolean
}

interface Category {
  id: string
  name: string
  products: Product[]
}

interface ModernLayoutProps {
  theme: MenuTheme
  storeName: string
  storeAddress?: string
  logoUrl?: string | null
  bannerUrl?: string | null
  categories: Category[]
  onAddToCart?: (product: Product) => void
}

export function ModernLayout({
  theme,
  storeName,
  storeAddress,
  logoUrl,
  bannerUrl,
  categories,
  onAddToCart
}: ModernLayoutProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(
    categories[0]?.id || null
  )

  // Filtrar produtos pela busca
  const filteredCategories = categories.map(cat => ({
    ...cat,
    products: cat.products.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.products.length > 0)

  const displayCategories = searchQuery ? filteredCategories : categories

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: theme.colors.background }}
    >
      {/* Hero Banner */}
      {theme.display.showBanner && (
        <div 
          className="h-48 sm:h-64 bg-gradient-to-r from-slate-800 to-slate-700 relative"
          style={{
            backgroundImage: bannerUrl ? `url(${bannerUrl})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-black/30" />
        </div>
      )}

      {/* Store Info Card */}
      <div className="max-w-4xl mx-auto px-4">
        <div 
          className={`bg-white rounded-2xl shadow-lg p-6 ${theme.display.showBanner ? '-mt-16 relative z-10' : 'mt-6'}`}
        >
          <div className="flex items-start gap-4">
            {theme.display.showLogo && (
              <div 
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-md flex-shrink-0"
                style={{ 
                  backgroundColor: theme.colors.primary,
                  backgroundImage: logoUrl ? `url(${logoUrl})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {!logoUrl && storeName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <h1 className="font-bold text-xl text-slate-800">{storeName}</h1>
              {theme.display.showAddress && storeAddress && (
                <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {storeAddress}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span 
                  className="px-2 py-1 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: theme.colors.primary }}
                >
                  Aberto agora
                </span>
              </div>
            </div>
          </div>

          {/* Search */}
          {theme.display.showSearch && (
            <div className="mt-4 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="O que você procura?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl text-sm outline-none bg-slate-100 focus:bg-slate-50 focus:ring-2 transition-all"
                style={{ '--tw-ring-color': theme.colors.primary } as React.CSSProperties}
              />
            </div>
          )}
        </div>
      </div>

      {/* Category Pills */}
      {!searchQuery && categories.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 mt-6">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className="px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all shadow-sm"
                style={{
                  backgroundColor: activeCategory === cat.id ? theme.colors.primary : '#ffffff',
                  color: activeCategory === cat.id ? '#ffffff' : '#64748b'
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Products */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {displayCategories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500">Nenhum produto encontrado</p>
          </div>
        ) : (
          <div className="space-y-8">
            {displayCategories.map((category) => (
              <section key={category.id}>
                <h2 className="text-lg font-bold text-slate-800 mb-4">
                  {category.name}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {category.products.map((product) => (
                    <ProductModernCard
                      key={product.id}
                      product={product}
                      primaryColor={theme.colors.primary}
                      onAdd={() => onAddToCart?.(product)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function ProductModernCard({ 
  product, 
  primaryColor,
  onAdd 
}: { 
  product: Product
  primaryColor: string
  onAdd?: () => void 
}) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
      <div className="flex">
        <div className="flex-1 p-4">
          <h3 className="font-semibold text-slate-800">{product.name}</h3>
          {product.description && (
            <p className="text-sm text-slate-500 mt-1 line-clamp-2">{product.description}</p>
          )}
          <div className="flex items-center justify-between mt-3">
            <span 
              className="font-bold text-lg"
              style={{ color: primaryColor }}
            >
              R$ {product.price.toFixed(2).replace('.', ',')}
            </span>
            {product.is_available && onAdd && (
              <button
                onClick={onAdd}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-transform hover:scale-105 shadow-md"
                style={{ backgroundColor: primaryColor }}
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
        {product.image_url && (
          <div 
            className="w-32 h-32 bg-slate-100 bg-cover bg-center flex-shrink-0"
            style={{ backgroundImage: `url(${product.image_url})` }}
          />
        )}
      </div>
    </div>
  )
}
