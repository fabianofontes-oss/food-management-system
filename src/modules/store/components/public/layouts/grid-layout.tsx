'use client'

import { Search, Plus } from 'lucide-react'
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

interface GridLayoutProps {
  theme: MenuTheme
  storeName: string
  storeAddress?: string
  storePhone?: string
  storeWhatsapp?: string
  logoUrl?: string | null
  bannerUrl?: string | null
  categories: Category[]
  onAddToCart?: (product: Product) => void
}

export function GridLayout({
  theme,
  storeName,
  storeAddress,
  storePhone,
  storeWhatsapp,
  logoUrl,
  bannerUrl,
  categories,
  onAddToCart
}: GridLayoutProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const headerTextColor = isLightColor(theme.colors.header) ? '#1f2937' : '#ffffff'
  const headerMutedColor = isLightColor(theme.colors.header) ? '#64748b' : 'rgba(255,255,255,0.7)'

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
      {/* Header */}
      <header 
        className="sticky top-0 z-10 shadow-sm"
        style={{ backgroundColor: theme.colors.header }}
      >
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            {theme.display.showLogo && (
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0"
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
            <div className="flex-1 min-w-0">
              <h1 
                className="font-bold text-lg"
                style={{ color: headerTextColor }}
              >
                {storeName}
              </h1>
              {theme.display.showAddress && storeAddress && (
                <p 
                  className="text-xs"
                  style={{ color: headerMutedColor }}
                >
                  {storeAddress}
                </p>
              )}
            </div>

            {/* Search */}
            {theme.display.showSearch && (
              <div className="relative w-64 hidden sm:block">
                <Search 
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: headerMutedColor }}
                />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg text-sm outline-none"
                  style={{ 
                    backgroundColor: isLightColor(theme.colors.header) 
                      ? 'rgba(0,0,0,0.05)' 
                      : 'rgba(255,255,255,0.1)',
                    color: headerTextColor
                  }}
                />
              </div>
            )}
          </div>

          {/* Mobile Search */}
          {theme.display.showSearch && (
            <div className="mt-3 relative sm:hidden">
              <Search 
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: headerMutedColor }}
              />
              <input
                type="text"
                placeholder="Buscar no cardápio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm outline-none"
                style={{ 
                  backgroundColor: isLightColor(theme.colors.header) 
                    ? 'rgba(0,0,0,0.05)' 
                    : 'rgba(255,255,255,0.1)',
                  color: headerTextColor
                }}
              />
            </div>
          )}
        </div>
      </header>

      {/* Products Grid */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {displayCategories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500">Nenhum produto encontrado</p>
          </div>
        ) : (
          <div className="space-y-8">
            {displayCategories.map((category) => (
              <section key={category.id}>
                <h2 className="text-lg font-semibold text-slate-800 mb-4">
                  {category.name}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {category.products.map((product) => (
                    <ProductGridCard
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

function ProductGridCard({ 
  product, 
  primaryColor,
  onAdd 
}: { 
  product: Product
  primaryColor: string
  onAdd?: () => void 
}) {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {product.image_url ? (
        <div 
          className="w-full aspect-square bg-slate-100 bg-cover bg-center"
          style={{ backgroundImage: `url(${product.image_url})` }}
        />
      ) : (
        <div className="w-full aspect-square bg-slate-100 flex items-center justify-center">
          <span className="text-4xl text-slate-300">🍽️</span>
        </div>
      )}
      <div className="p-3">
        <h3 className="font-medium text-slate-800 text-sm truncate">{product.name}</h3>
        <div className="flex items-center justify-between mt-2">
          <span 
            className="font-bold text-sm"
            style={{ color: primaryColor }}
          >
            R$ {product.price.toFixed(2).replace('.', ',')}
          </span>
          {product.is_available && onAdd && (
            <button
              onClick={onAdd}
              className="w-7 h-7 rounded-full flex items-center justify-center text-white transition-transform hover:scale-110"
              style={{ backgroundColor: primaryColor }}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
