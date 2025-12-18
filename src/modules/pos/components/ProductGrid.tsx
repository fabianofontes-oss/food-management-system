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

// Paleta de cores vibrantes para categorias
const CATEGORY_COLORS: { bg: string; border: string; text: string; light: string; badge: string }[] = [
  { bg: 'bg-red-500', border: 'border-red-500', text: 'text-red-600', light: 'bg-red-50 dark:bg-red-900/20', badge: 'bg-red-100 text-red-700' },
  { bg: 'bg-orange-500', border: 'border-orange-500', text: 'text-orange-600', light: 'bg-orange-50 dark:bg-orange-900/20', badge: 'bg-orange-100 text-orange-700' },
  { bg: 'bg-amber-500', border: 'border-amber-500', text: 'text-amber-600', light: 'bg-amber-50 dark:bg-amber-900/20', badge: 'bg-amber-100 text-amber-700' },
  { bg: 'bg-yellow-500', border: 'border-yellow-500', text: 'text-yellow-600', light: 'bg-yellow-50 dark:bg-yellow-900/20', badge: 'bg-yellow-100 text-yellow-700' },
  { bg: 'bg-lime-500', border: 'border-lime-500', text: 'text-lime-600', light: 'bg-lime-50 dark:bg-lime-900/20', badge: 'bg-lime-100 text-lime-700' },
  { bg: 'bg-green-500', border: 'border-green-500', text: 'text-green-600', light: 'bg-green-50 dark:bg-green-900/20', badge: 'bg-green-100 text-green-700' },
  { bg: 'bg-emerald-500', border: 'border-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-50 dark:bg-emerald-900/20', badge: 'bg-emerald-100 text-emerald-700' },
  { bg: 'bg-teal-500', border: 'border-teal-500', text: 'text-teal-600', light: 'bg-teal-50 dark:bg-teal-900/20', badge: 'bg-teal-100 text-teal-700' },
  { bg: 'bg-cyan-500', border: 'border-cyan-500', text: 'text-cyan-600', light: 'bg-cyan-50 dark:bg-cyan-900/20', badge: 'bg-cyan-100 text-cyan-700' },
  { bg: 'bg-sky-500', border: 'border-sky-500', text: 'text-sky-600', light: 'bg-sky-50 dark:bg-sky-900/20', badge: 'bg-sky-100 text-sky-700' },
  { bg: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-600', light: 'bg-blue-50 dark:bg-blue-900/20', badge: 'bg-blue-100 text-blue-700' },
  { bg: 'bg-indigo-500', border: 'border-indigo-500', text: 'text-indigo-600', light: 'bg-indigo-50 dark:bg-indigo-900/20', badge: 'bg-indigo-100 text-indigo-700' },
  { bg: 'bg-violet-500', border: 'border-violet-500', text: 'text-violet-600', light: 'bg-violet-50 dark:bg-violet-900/20', badge: 'bg-violet-100 text-violet-700' },
  { bg: 'bg-purple-500', border: 'border-purple-500', text: 'text-purple-600', light: 'bg-purple-50 dark:bg-purple-900/20', badge: 'bg-purple-100 text-purple-700' },
  { bg: 'bg-fuchsia-500', border: 'border-fuchsia-500', text: 'text-fuchsia-600', light: 'bg-fuchsia-50 dark:bg-fuchsia-900/20', badge: 'bg-fuchsia-100 text-fuchsia-700' },
  { bg: 'bg-pink-500', border: 'border-pink-500', text: 'text-pink-600', light: 'bg-pink-50 dark:bg-pink-900/20', badge: 'bg-pink-100 text-pink-700' },
  { bg: 'bg-rose-500', border: 'border-rose-500', text: 'text-rose-600', light: 'bg-rose-50 dark:bg-rose-900/20', badge: 'bg-rose-100 text-rose-700' },
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

  // Mapear categoria para cor
  const getCategoryColor = (categoryName: string | undefined) => {
    if (!categoryName) return CATEGORY_COLORS[0]
    const index = categories.indexOf(categoryName)
    return CATEGORY_COLORS[index % CATEGORY_COLORS.length]
  }

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
    const color = getCategoryColor(product.category?.name)

    // FOTO MÉDIA - Card com barra colorida
    if (layoutType === 'photo-md') {
      return (
        <button
          key={product.id}
          onClick={() => handleProductClick(product)}
          className={`${cardBg} rounded-xl border-2 ${color.border} hover:shadow-xl active:scale-[0.97] transition-all text-left overflow-hidden`}
        >
          {/* Barra colorida no topo */}
          <div className={`h-1.5 ${color.bg}`} />
          <div className={`w-full aspect-square ${color.light} flex items-center justify-center`}>
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <Package className={`w-12 h-12 ${color.text} opacity-40`} />
            )}
          </div>
          <div className="p-2.5">
            <p className={`font-semibold ${textColor} text-sm leading-tight line-clamp-2 h-10`}>{product.name}</p>
            <div className="flex items-center justify-between mt-1.5">
              <span className={`${color.text} font-bold text-lg`}>{formatCurrency(product.base_price)}</span>
              {isWeightProduct && <Scale className="w-4 h-4 text-orange-500" />}
            </div>
          </div>
        </button>
      )
    }

    // FOTO PEQUENA - Mini card colorido
    if (layoutType === 'photo-sm') {
      return (
        <button
          key={product.id}
          onClick={() => handleProductClick(product)}
          className={`${cardBg} rounded-lg border-2 ${color.border} hover:shadow-lg active:scale-[0.97] transition-all text-left overflow-hidden`}
        >
          <div className={`w-full aspect-square ${color.light} flex items-center justify-center`}>
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <Package className={`w-8 h-8 ${color.text} opacity-40`} />
            )}
          </div>
          <div className={`p-1.5 ${color.light}`}>
            <p className={`font-medium ${textColor} text-[11px] truncate`}>{product.name}</p>
            <p className={`${color.text} font-bold text-xs`}>{formatCurrency(product.base_price)}</p>
          </div>
        </button>
      )
    }

    // CARD (sem foto) - Fundo colorido
    if (layoutType === 'card') {
      return (
        <button
          key={product.id}
          onClick={() => handleProductClick(product)}
          className={`${color.light} rounded-xl border-2 ${color.border} hover:shadow-lg active:scale-[0.97] transition-all p-3 text-left h-full min-h-[90px] flex flex-col justify-between`}
        >
          <p className={`font-semibold ${textColor} text-xs leading-tight line-clamp-2`}>{product.name}</p>
          <div className="flex items-center justify-between mt-2">
            <span className={`${color.text} font-bold`}>{formatCurrency(product.base_price)}</span>
            {isWeightProduct && <Scale className="w-3.5 h-3.5 text-orange-500" />}
          </div>
        </button>
      )
    }

    // LISTA - Linha com indicador colorido
    return (
      <button
        key={product.id}
        onClick={() => handleProductClick(product)}
        className={`${cardBg} rounded-lg border ${borderColor} hover:${color.light} active:scale-[0.995] transition-all text-left flex items-center overflow-hidden`}
      >
        {/* Barra lateral colorida */}
        <div className={`w-1.5 self-stretch ${color.bg}`} />
        
        <div className="flex items-center gap-3 px-3 py-2.5 flex-1">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-10 h-10 rounded object-cover flex-shrink-0" />
          ) : (
            <div className={`w-10 h-10 rounded ${color.light} flex items-center justify-center flex-shrink-0`}>
              <Package className={`w-5 h-5 ${color.text}`} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className={`font-medium ${textColor} text-sm truncate`}>{product.name}</p>
            {product.category?.name && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${color.badge}`}>{product.category.name}</span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {isWeightProduct && <Scale className="w-4 h-4 text-orange-500" />}
            <span className={`${color.text} font-bold text-lg`}>{formatCurrency(product.base_price)}</span>
          </div>
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
          CATEGORIAS COM CORES
      ═══════════════════════════════════════════════════════════════════ */}
      {categories.length > 0 && (
        <div className="flex-shrink-0 mb-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-xl whitespace-nowrap text-sm font-bold transition-all ${
              !selectedCategory 
                ? 'bg-gray-900 text-white shadow-lg scale-105' 
                : `${cardBg} text-gray-500 border-2 border-gray-300 hover:border-gray-400`
            }`}
          >
            🏪 Todos
          </button>
          {categories.map((cat, index) => {
            const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length]
            const isSelected = selectedCategory === cat
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl whitespace-nowrap text-sm font-bold transition-all ${
                  isSelected 
                    ? `${color.bg} text-white shadow-lg scale-105` 
                    : `${cardBg} ${color.text} border-2 ${color.border} hover:shadow-md`
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
