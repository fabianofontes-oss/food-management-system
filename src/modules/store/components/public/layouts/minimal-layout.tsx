'use client'

import { Search, ChevronRight } from 'lucide-react'
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

interface MinimalLayoutProps {
  theme: MenuTheme
  storeName: string
  storeAddress?: string
  logoUrl?: string | null
  categories: Category[]
  onAddToCart?: (product: Product) => void
}

export function MinimalLayout({
  theme,
  storeName,
  storeAddress,
  logoUrl,
  categories,
  onAddToCart
}: MinimalLayoutProps) {
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
      {/* Minimal Header */}
      <header 
        className="border-b"
        style={{ 
          backgroundColor: theme.colors.header,
          borderColor: isLightColor(theme.colors.header) ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'
        }}
      >
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="text-center">
            {theme.display.showLogo && logoUrl && (
              <div 
                className="w-16 h-16 rounded-full mx-auto mb-3 bg-cover bg-center"
                style={{ backgroundImage: `url(${logoUrl})` }}
              />
            )}
            <h1 
              className="font-bold text-xl"
              style={{ color: headerTextColor }}
            >
              {storeName}
            </h1>
            {theme.display.showAddress && storeAddress && (
              <p 
                className="text-sm mt-1"
                style={{ color: headerMutedColor }}
              >
                {storeAddress}
              </p>
            )}
          </div>

          {/* Search */}
          {theme.display.showSearch && (
            <div className="mt-4 relative max-w-md mx-auto">
              <Search 
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: headerMutedColor }}
              />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-full text-sm outline-none border"
                style={{ 
                  backgroundColor: theme.colors.background,
                  borderColor: isLightColor(theme.colors.header) ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)',
                  color: '#1f2937'
                }}
              />
            </div>
          )}
        </div>
      </header>

      {/* Products List */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {displayCategories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500">Nenhum produto encontrado</p>
          </div>
        ) : (
          <div className="space-y-6">
            {displayCategories.map((category) => (
              <section key={category.id}>
                <h2 
                  className="text-xs font-semibold uppercase tracking-wider mb-3 px-1"
                  style={{ color: theme.colors.primary }}
                >
                  {category.name}
                </h2>
                <div className="bg-white rounded-lg divide-y divide-slate-100 shadow-sm">
                  {category.products.map((product) => (
                    <ProductMinimalRow
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

function ProductMinimalRow({ 
  product, 
  primaryColor,
  onAdd 
}: { 
  product: Product
  primaryColor: string
  onAdd?: () => void 
}) {
  return (
    <button
      onClick={onAdd}
      disabled={!product.is_available}
      className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left disabled:opacity-50"
    >
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-slate-800 text-sm">{product.name}</h3>
        {product.description && (
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{product.description}</p>
        )}
      </div>
      <div className="flex items-center gap-2 ml-4">
        <span 
          className="font-semibold text-sm"
          style={{ color: primaryColor }}
        >
          R$ {product.price.toFixed(2).replace('.', ',')}
        </span>
        {product.is_available && (
          <ChevronRight className="w-4 h-4 text-slate-400" />
        )}
      </div>
    </button>
  )
}
