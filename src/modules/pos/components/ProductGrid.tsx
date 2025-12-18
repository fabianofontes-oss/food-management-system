'use client'

import { useMemo } from 'react'
import { Search, Package, Barcode, LayoutGrid, List } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { LayoutType } from '../types'

interface ProductGridProps {
  products: any[]
  search: string
  setSearch: (search: string) => void
  selectedCategory: string | null
  setSelectedCategory: (category: string | null) => void
  barcodeInput: string
  setBarcodeInput: (barcode: string) => void
  onBarcodeSearch: () => void
  onAddToCart: (product: any) => void
  layoutType: LayoutType
  setLayoutType: (layout: LayoutType) => void
  darkMode: boolean
}

export function ProductGrid({
  products,
  search,
  setSearch,
  selectedCategory,
  setSelectedCategory,
  barcodeInput,
  setBarcodeInput,
  onBarcodeSearch,
  onAddToCart,
  layoutType,
  setLayoutType,
  darkMode
}: ProductGridProps) {
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white'
  const textColor = darkMode ? 'text-white' : 'text-gray-900'
  const mutedText = darkMode ? 'text-gray-400' : 'text-gray-500'
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-200'

  const categories = useMemo(() => {
    if (!products) return []
    const cats = [...new Set(products.map((p: any) => p.category?.name).filter(Boolean))]
    return cats as string[]
  }, [products])

  const filteredProducts = useMemo(() => {
    if (!products) return []
    return products.filter((p: any) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
      const matchCategory = !selectedCategory || p.category?.name === selectedCategory
      return p.is_active && matchSearch && matchCategory
    })
  }, [products, search, selectedCategory])

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Busca e código de barras */}
      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            id="search-input"
            type="text"
            placeholder="Buscar produto... (F1)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 ${cardBg} rounded-xl border ${borderColor} focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none ${textColor}`}
          />
        </div>
        <div className="relative w-48">
          <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Código..."
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onBarcodeSearch()}
            className={`w-full pl-10 pr-4 py-3 ${cardBg} rounded-xl border ${borderColor} focus:border-blue-500 outline-none ${textColor}`}
          />
        </div>
        <button
          onClick={() => setLayoutType(layoutType === 'grid' ? 'compact' : 'grid')}
          className={`p-3 rounded-xl ${cardBg} ${borderColor} border`}
          title="Alternar layout"
        >
          {layoutType === 'grid' ? <List className={`w-5 h-5 ${mutedText}`} /> : <LayoutGrid className={`w-5 h-5 ${mutedText}`} />}
        </button>
      </div>

      {/* Categorias */}
      {categories.length > 0 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
              !selectedCategory 
                ? 'bg-blue-600 text-white' 
                : `${cardBg} ${textColor} border ${borderColor}`
            }`}
          >
            Todos
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                selectedCategory === cat 
                  ? 'bg-blue-600 text-white' 
                  : `${cardBg} ${textColor} border ${borderColor}`
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Grid de Produtos */}
      <div className="flex-1 overflow-y-auto">
        <div className={`grid gap-3 ${
          layoutType === 'compact' 
            ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8' 
            : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
        }`}>
          {filteredProducts.map((product: any) => (
            <button
              key={product.id}
              onClick={() => onAddToCart(product)}
              className={`${cardBg} p-3 rounded-xl border ${borderColor} hover:border-blue-500 hover:shadow-md transition-all text-left group`}
            >
              {layoutType === 'grid' && (
                <div className={`w-full aspect-square ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg mb-2 flex items-center justify-center overflow-hidden`}>
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className={`w-8 h-8 ${mutedText}`} />
                  )}
                </div>
              )}
              <p className={`font-medium ${textColor} text-sm truncate`}>{product.name}</p>
              <p className="text-blue-500 font-bold text-sm">{formatCurrency(product.base_price)}</p>
              {product.addons_count > 0 && (
                <span className="text-xs text-orange-500">+{product.addons_count} adicionais</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
