'use client'

import { Search, Plus, Minus } from 'lucide-react'
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

interface ClassicLayoutProps {
  theme: MenuTheme
  storeName: string
  storeAddress?: string
  logoUrl?: string | null
  categories: Category[]
  onAddToCart?: (product: Product) => void
}

export function ClassicLayout({
  theme,
  storeName,
  storeAddress,
  logoUrl,
  categories,
  onAddToCart
}: ClassicLayoutProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(
    categories[0]?.id || null
  )

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
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            {theme.display.showLogo && (
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md flex-shrink-0"
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
                className="font-bold text-lg truncate"
                style={{ color: headerTextColor }}
              >
                {storeName}
              </h1>
              {theme.display.showAddress && storeAddress && (
                <p 
                  className="text-xs truncate"
                  style={{ color: headerMutedColor }}
                >
                  {storeAddress}
                </p>
              )}
            </div>
          </div>

          {/* Search */}
          {theme.display.showSearch && (
            <div className="mt-3 relative">
              <Search 
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: headerMutedColor }}
              />
              <input
                type="text"
                placeholder="Buscar no cardápio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm outline-none transition-shadow focus:ring-2"
                style={{ 
                  backgroundColor: isLightColor(theme.colors.header) 
                    ? 'rgba(0,0,0,0.05)' 
                    : 'rgba(255,255,255,0.1)',
                  color: headerTextColor,
                  '--tw-ring-color': theme.colors.primary
                } as React.CSSProperties}
              />
            </div>
          )}
        </div>

        {/* Category Tabs */}
        {!searchQuery && categories.length > 0 && (
          <div className="border-t" style={{ borderColor: isLightColor(theme.colors.header) ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)' }}>
            <div className="max-w-4xl mx-auto px-4">
              <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
                    style={{
                      backgroundColor: activeCategory === cat.id ? theme.colors.primary : 'transparent',
                      color: activeCategory === cat.id ? '#ffffff' : headerMutedColor
                    }}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Products */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {displayCategories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500">Nenhum produto encontrado</p>
          </div>
        ) : (
          <div className="space-y-8">
            {displayCategories.map((category) => (
              <section key={category.id} id={`category-${category.id}`}>
                <h2 className="text-lg font-semibold text-slate-800 mb-4">
                  {category.name}
                </h2>
                <div className="space-y-3">
                  {category.products.map((product) => (
                    <ProductCard
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

function ProductCard({ 
  product, 
  primaryColor,
  onAdd 
}: { 
  product: Product
  primaryColor: string
  onAdd?: () => void 
}) {
  return (
    <div className="bg-white rounded-xl p-3 flex gap-3 shadow-sm">
      {product.image_url && (
        <div 
          className="w-20 h-20 rounded-lg bg-slate-100 flex-shrink-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${product.image_url})` }}
        />
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-slate-800 text-sm">{product.name}</h3>
        {product.description && (
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{product.description}</p>
        )}
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
              className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-transform hover:scale-110"
              style={{ backgroundColor: primaryColor }}
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
