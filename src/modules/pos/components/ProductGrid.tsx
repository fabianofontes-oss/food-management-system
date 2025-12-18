'use client'

import { useMemo } from 'react'
import { Search, Package, Barcode, LayoutGrid, List, Grid3X3, Scale } from 'lucide-react'
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
  onAddToCart: (product: any, weight?: number) => void
  layoutType: LayoutType
  setLayoutType: (layout: LayoutType) => void
  darkMode: boolean
  scaleWeight?: number
  scaleConnected?: boolean
  onWeightProduct?: (product: any) => void
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
  darkMode,
  scaleWeight = 0,
  scaleConnected = false,
  onWeightProduct
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

  const cycleLayout = () => {
    const layouts: LayoutType[] = ['large', 'medium', 'compact']
    const currentIndex = layouts.indexOf(layoutType)
    const nextIndex = (currentIndex + 1) % layouts.length
    setLayoutType(layouts[nextIndex])
  }

  const getGridClass = () => {
    switch (layoutType) {
      case 'large': return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
      case 'medium': return 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6'
      case 'compact': return 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10'
    }
  }

  const getLayoutIcon = () => {
    switch (layoutType) {
      case 'large': return <LayoutGrid className={`w-5 h-5 ${mutedText}`} />
      case 'medium': return <Grid3X3 className={`w-5 h-5 ${mutedText}`} />
      case 'compact': return <List className={`w-5 h-5 ${mutedText}`} />
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Busca, código de barras e visor da balança */}
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
        <div className="relative w-40">
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

        {/* Visor da Balança */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${
          scaleConnected ? 'border-green-500 bg-green-50' : `${borderColor} ${cardBg}`
        }`}>
          <Scale className={`w-5 h-5 ${scaleConnected ? 'text-green-600' : mutedText}`} />
          <div className="text-right min-w-[80px]">
            <p className={`text-xs ${scaleConnected ? 'text-green-600' : mutedText}`}>
              {scaleConnected ? 'Balança' : 'Desconectada'}
            </p>
            <p className={`font-mono font-bold text-lg ${scaleConnected ? 'text-green-700' : mutedText}`}>
              {scaleWeight.toFixed(3)} kg
            </p>
          </div>
        </div>

        {/* Botão de Layout */}
        <button
          onClick={cycleLayout}
          className={`p-3 rounded-xl ${cardBg} ${borderColor} border flex items-center gap-2`}
          title={`Layout: ${layoutType}`}
        >
          {getLayoutIcon()}
          <span className={`text-xs ${mutedText} hidden sm:block`}>
            {layoutType === 'large' ? 'Grande' : layoutType === 'medium' ? 'Médio' : 'Compacto'}
          </span>
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
        <div className={`grid gap-3 ${getGridClass()}`}>
          {filteredProducts.map((product: any) => {
            const isWeightProduct = product.unit === 'kg' || product.sold_by_weight
            
            return (
              <button
                key={product.id}
                onClick={() => {
                  if (isWeightProduct && onWeightProduct) {
                    onWeightProduct(product)
                  } else {
                    onAddToCart(product)
                  }
                }}
                className={`${cardBg} rounded-xl border ${borderColor} hover:border-blue-500 hover:shadow-md transition-all text-left group ${
                  layoutType === 'compact' ? 'p-2' : 'p-3'
                }`}
              >
                {/* Imagem - só mostra no layout grande */}
                {layoutType === 'large' && (
                  <div className={`w-full aspect-square ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg mb-2 flex items-center justify-center overflow-hidden`}>
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className={`w-10 h-10 ${mutedText}`} />
                    )}
                  </div>
                )}

                {/* Imagem menor - layout médio */}
                {layoutType === 'medium' && (
                  <div className={`w-full aspect-video ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg mb-2 flex items-center justify-center overflow-hidden`}>
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className={`w-6 h-6 ${mutedText}`} />
                    )}
                  </div>
                )}

                {/* Nome e Preço */}
                <p className={`font-medium ${textColor} truncate ${
                  layoutType === 'compact' ? 'text-xs' : layoutType === 'medium' ? 'text-sm' : 'text-base'
                }`}>
                  {product.name}
                </p>
                <div className="flex items-center justify-between">
                  <p className={`text-blue-500 font-bold ${
                    layoutType === 'compact' ? 'text-xs' : 'text-sm'
                  }`}>
                    {formatCurrency(product.base_price)}
                    {isWeightProduct && <span className="text-gray-400">/kg</span>}
                  </p>
                  {isWeightProduct && (
                    <Scale className={`w-3 h-3 text-orange-500`} />
                  )}
                </div>
                {layoutType !== 'compact' && product.addons_count > 0 && (
                  <span className="text-xs text-orange-500">+{product.addons_count} adicionais</span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
