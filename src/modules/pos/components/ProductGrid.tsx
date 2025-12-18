'use client'

import { useMemo } from 'react'
import { Search, Package, Barcode, Grid2X2, Grid3X3, Square, LayoutList, Scale } from 'lucide-react'
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

const LAYOUTS: { type: LayoutType; icon: any; label: string }[] = [
  { type: 'photo-md', icon: Grid2X2, label: 'Foto' },
  { type: 'photo-sm', icon: Grid3X3, label: 'Mini' },
  { type: 'card', icon: Square, label: 'Card' },
  { type: 'list', icon: LayoutList, label: 'Lista' },
]

// Cores para botões de categoria (apenas nos botões, não nos produtos)
const CATEGORY_COLORS = [
  'bg-blue-600', 'bg-emerald-600', 'bg-violet-600', 'bg-amber-600',
  'bg-rose-600', 'bg-cyan-600', 'bg-indigo-600', 'bg-teal-600',
]

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
  const mutedText = darkMode ? 'text-gray-400' : 'text-gray-600'
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-200'
  const inputBg = darkMode ? 'bg-gray-900' : 'bg-white'

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

  const handleProductClick = (product: any) => {
    const isWeightProduct = product.unit === 'kg' || product.sold_by_weight
    if (isWeightProduct && onWeightProduct) {
      onWeightProduct(product)
    } else {
      onAddToCart(product)
    }
  }

  const getGridClass = () => {
    switch (layoutType) {
      case 'photo-md': return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3'
      case 'photo-sm': return 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9 gap-2'
      case 'card': return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2'
      case 'list': return 'flex flex-col gap-1'
    }
  }

  const renderProduct = (product: any) => {
    const isWeightProduct = product.unit === 'kg' || product.sold_by_weight

    // FOTO MÉDIA - Card limpo
    if (layoutType === 'photo-md') {
      return (
        <button
          key={product.id}
          onClick={() => handleProductClick(product)}
          className={`${cardBg} rounded-lg border ${borderColor} hover:border-blue-500 hover:shadow-md active:scale-[0.98] transition-all text-left overflow-hidden`}
        >
          <div className={`w-full aspect-square ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} flex items-center justify-center`}>
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <Package className="w-10 h-10 text-gray-300" />
            )}
          </div>
          <div className="p-2">
            <p className={`font-medium ${textColor} text-sm leading-tight line-clamp-2 min-h-[2.5rem]`}>{product.name}</p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-blue-600 font-bold">{formatCurrency(product.base_price)}</span>
              {isWeightProduct && <Scale className="w-4 h-4 text-orange-500" />}
            </div>
          </div>
        </button>
      )
    }

    // FOTO PEQUENA
    if (layoutType === 'photo-sm') {
      return (
        <button
          key={product.id}
          onClick={() => handleProductClick(product)}
          className={`${cardBg} rounded-lg border ${borderColor} hover:border-blue-500 active:scale-[0.98] transition-all text-left overflow-hidden`}
        >
          <div className={`w-full aspect-square ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} flex items-center justify-center`}>
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <Package className="w-6 h-6 text-gray-300" />
            )}
          </div>
          <div className="p-1.5">
            <p className={`font-medium ${textColor} text-[11px] truncate`}>{product.name}</p>
            <p className="text-blue-600 font-bold text-xs">{formatCurrency(product.base_price)}</p>
          </div>
        </button>
      )
    }

    // CARD (sem foto)
    if (layoutType === 'card') {
      return (
        <button
          key={product.id}
          onClick={() => handleProductClick(product)}
          className={`${cardBg} rounded-lg border ${borderColor} hover:border-blue-500 hover:shadow active:scale-[0.98] transition-all p-3 text-left h-full min-h-[80px] flex flex-col justify-between`}
        >
          <p className={`font-medium ${textColor} text-xs leading-tight line-clamp-2`}>{product.name}</p>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-blue-600 font-bold text-sm">{formatCurrency(product.base_price)}</span>
            {isWeightProduct && <Scale className="w-3.5 h-3.5 text-orange-500" />}
          </div>
        </button>
      )
    }

    // LISTA
    return (
      <button
        key={product.id}
        onClick={() => handleProductClick(product)}
        className={`${cardBg} rounded-lg border ${borderColor} hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-[0.995] transition-all px-3 py-2 text-left flex items-center gap-3`}
      >
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-10 h-10 rounded object-cover flex-shrink-0" />
        ) : (
          <div className={`w-10 h-10 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-center flex-shrink-0`}>
            <Package className="w-5 h-5 text-gray-300" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className={`font-medium ${textColor} text-sm truncate`}>{product.name}</p>
          {product.category?.name && <p className="text-xs text-gray-400">{product.category.name}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isWeightProduct && <Scale className="w-4 h-4 text-orange-500" />}
          <span className="text-blue-600 font-bold">{formatCurrency(product.base_price)}</span>
        </div>
      </button>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      {/* ═══════════════════════════════════════════════════════════════════
          BUSCA + CÓDIGO + LAYOUTS
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex-shrink-0 mb-3 flex flex-wrap gap-2">
        {/* Busca */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            id="search-input"
            type="text"
            placeholder="Buscar... (F1)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full h-10 pl-9 pr-3 ${inputBg} rounded-lg border ${borderColor} focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none ${textColor} text-sm`}
          />
        </div>

        {/* Código de barras */}
        <div className="relative w-28 sm:w-32">
          <Barcode className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Código"
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onBarcodeSearch()}
            className={`w-full h-10 pl-8 pr-2 ${inputBg} rounded-lg border ${borderColor} focus:border-blue-500 outline-none ${textColor} text-sm`}
          />
        </div>

        {/* Botões de layout */}
        <div className={`flex rounded-lg border ${borderColor} overflow-hidden ${cardBg}`}>
          {LAYOUTS.map(({ type, icon: Icon }) => (
            <button
              key={type}
              onClick={() => setLayoutType(type)}
              className={`w-10 h-10 flex items-center justify-center transition-colors ${
                layoutType === type 
                  ? 'bg-blue-600 text-white' 
                  : `${mutedText} hover:bg-gray-100 dark:hover:bg-gray-700`
              }`}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          CATEGORIAS
      ═══════════════════════════════════════════════════════════════════ */}
      {categories.length > 0 && (
        <div className="flex-shrink-0 mb-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-semibold transition-all ${
              !selectedCategory 
                ? 'bg-blue-600 text-white shadow-md' 
                : `${cardBg} ${textColor} border ${borderColor} hover:border-blue-400`
            }`}
          >
            Todos
          </button>
          {categories.map((cat, index) => {
            const bgColor = CATEGORY_COLORS[index % CATEGORY_COLORS.length]
            const isSelected = selectedCategory === cat
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-semibold transition-all ${
                  isSelected 
                    ? `${bgColor} text-white shadow-md` 
                    : `${cardBg} ${textColor} border ${borderColor} hover:border-blue-400`
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          GRID DE PRODUTOS
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className={getGridClass()}>
          {filteredProducts.map(renderProduct)}
        </div>

        {filteredProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Package className="w-16 h-16 mb-3 opacity-30" />
            <p className="text-lg font-medium">Nenhum produto</p>
            <p className="text-sm">Tente outra busca</p>
          </div>
        )}
      </div>
    </div>
  )
}
