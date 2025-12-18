'use client'

import { useMemo } from 'react'
import { Search, Package, Barcode, Image, Square, LayoutList, Grid2X2, Grid3X3, Scale } from 'lucide-react'
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
  { type: 'photo-lg', icon: Image, label: 'Foto G' },
  { type: 'photo-md', icon: Grid2X2, label: 'Foto M' },
  { type: 'photo-sm', icon: Grid3X3, label: 'Foto P' },
  { type: 'card', icon: Square, label: 'Card' },
  { type: 'list', icon: LayoutList, label: 'Lista' },
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
  const cardBgHover = darkMode ? 'hover:bg-gray-750' : 'hover:bg-gray-50'
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
      case 'photo-lg': return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4'
      case 'photo-md': return 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3'
      case 'photo-sm': return 'grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2'
      case 'card': return 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2'
      case 'list': return 'grid-cols-1 gap-1'
    }
  }

  const renderProduct = (product: any) => {
    const isWeightProduct = product.unit === 'kg' || product.sold_by_weight

    // FOTO GRANDE
    if (layoutType === 'photo-lg') {
      return (
        <button
          key={product.id}
          onClick={() => handleProductClick(product)}
          className={`${cardBg} rounded-2xl border-2 ${borderColor} hover:border-blue-500 hover:shadow-lg transition-all text-left group overflow-hidden`}
        >
          <div className={`w-full aspect-square ${darkMode ? 'bg-gray-700' : 'bg-gradient-to-br from-gray-100 to-gray-200'} flex items-center justify-center overflow-hidden`}>
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
            ) : (
              <Package className={`w-16 h-16 ${mutedText}`} />
            )}
          </div>
          <div className="p-4">
            <p className={`font-semibold ${textColor} text-base mb-1 line-clamp-2`}>{product.name}</p>
            <div className="flex items-center justify-between">
              <p className="text-blue-600 font-bold text-lg">
                {formatCurrency(product.base_price)}
                {isWeightProduct && <span className="text-sm text-gray-400 font-normal">/kg</span>}
              </p>
              {isWeightProduct && <Scale className="w-4 h-4 text-orange-500" />}
            </div>
            {product.addons_count > 0 && (
              <span className="text-xs text-orange-500 mt-1 block">+{product.addons_count} adicionais</span>
            )}
          </div>
        </button>
      )
    }

    // FOTO MÉDIA
    if (layoutType === 'photo-md') {
      return (
        <button
          key={product.id}
          onClick={() => handleProductClick(product)}
          className={`${cardBg} rounded-xl border ${borderColor} hover:border-blue-500 hover:shadow-md transition-all text-left group overflow-hidden`}
        >
          <div className={`w-full aspect-[4/3] ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-center overflow-hidden`}>
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
            ) : (
              <Package className={`w-10 h-10 ${mutedText}`} />
            )}
          </div>
          <div className="p-3">
            <p className={`font-medium ${textColor} text-sm truncate`}>{product.name}</p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-blue-600 font-bold text-sm">{formatCurrency(product.base_price)}</p>
              {isWeightProduct && <Scale className="w-3 h-3 text-orange-500" />}
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
          className={`${cardBg} rounded-lg border ${borderColor} hover:border-blue-500 transition-all text-left group overflow-hidden`}
        >
          <div className={`w-full aspect-square ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-center overflow-hidden`}>
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <Package className={`w-6 h-6 ${mutedText}`} />
            )}
          </div>
          <div className="p-2">
            <p className={`font-medium ${textColor} text-xs truncate`}>{product.name}</p>
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
          className={`${cardBg} rounded-lg border-2 ${borderColor} hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all p-3 text-left`}
        >
          <p className={`font-medium ${textColor} text-xs truncate mb-1`}>{product.name}</p>
          <div className="flex items-center justify-between">
            <p className="text-blue-600 font-bold text-sm">{formatCurrency(product.base_price)}</p>
            {isWeightProduct && <Scale className="w-3 h-3 text-orange-500" />}
          </div>
        </button>
      )
    }

    // LISTA
    return (
      <button
        key={product.id}
        onClick={() => handleProductClick(product)}
        className={`${cardBg} ${cardBgHover} rounded-lg border ${borderColor} hover:border-blue-500 transition-all px-4 py-3 text-left flex items-center justify-between`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
          ) : (
            <div className={`w-10 h-10 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-center flex-shrink-0`}>
              <Package className={`w-5 h-5 ${mutedText}`} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className={`font-medium ${textColor} text-sm truncate`}>{product.name}</p>
            {product.category?.name && (
              <p className={`text-xs ${mutedText} truncate`}>{product.category.name}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4">
          {isWeightProduct && <Scale className="w-4 h-4 text-orange-500" />}
          <p className="text-blue-600 font-bold text-base whitespace-nowrap">{formatCurrency(product.base_price)}</p>
        </div>
      </button>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Barra de Busca e Controles */}
      <div className="mb-4 flex gap-2 flex-wrap">
        {/* Busca */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            id="search-input"
            type="text"
            placeholder="Buscar produto... (F1)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 ${cardBg} rounded-xl border-2 ${borderColor} focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none ${textColor} transition-all`}
          />
        </div>

        {/* Código de Barras */}
        <div className="relative w-36">
          <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Código"
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onBarcodeSearch()}
            className={`w-full pl-9 pr-3 py-3 ${cardBg} rounded-xl border ${borderColor} focus:border-blue-500 outline-none ${textColor} text-sm`}
          />
        </div>

        {/* Visor da Balança */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 ${
          scaleConnected ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : `${borderColor} ${cardBg}`
        }`}>
          <Scale className={`w-5 h-5 ${scaleConnected ? 'text-green-600' : mutedText}`} />
          <div className="text-right">
            <p className={`text-[10px] uppercase tracking-wide ${scaleConnected ? 'text-green-600' : mutedText}`}>
              {scaleConnected ? 'Balança' : 'Offline'}
            </p>
            <p className={`font-mono font-bold text-lg leading-tight ${scaleConnected ? 'text-green-700' : mutedText}`}>
              {scaleWeight.toFixed(3)}
            </p>
          </div>
        </div>

        {/* Seletor de Layout */}
        <div className={`flex rounded-xl border ${borderColor} overflow-hidden ${cardBg}`}>
          {LAYOUTS.map(({ type, icon: Icon, label }) => (
            <button
              key={type}
              onClick={() => setLayoutType(type)}
              className={`p-3 transition-all ${
                layoutType === type 
                  ? 'bg-blue-600 text-white' 
                  : `${cardBgHover} ${mutedText}`
              }`}
              title={label}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>

      {/* Categorias */}
      {categories.length > 0 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2.5 rounded-xl whitespace-nowrap transition-all font-medium ${
              !selectedCategory 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                : `${cardBg} ${textColor} border-2 ${borderColor} hover:border-blue-300`
            }`}
          >
            🏷️ Todos
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2.5 rounded-xl whitespace-nowrap transition-all font-medium ${
                selectedCategory === cat 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                  : `${cardBg} ${textColor} border-2 ${borderColor} hover:border-blue-300`
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Contador de Produtos */}
      <div className={`mb-3 text-sm ${mutedText}`}>
        {filteredProducts.length} produto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
      </div>

      {/* Grid de Produtos */}
      <div className="flex-1 overflow-y-auto pr-2">
        <div className={`grid ${getGridClass()}`}>
          {filteredProducts.map(renderProduct)}
        </div>

        {filteredProducts.length === 0 && (
          <div className={`flex flex-col items-center justify-center py-20 ${mutedText}`}>
            <Package className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium">Nenhum produto encontrado</p>
            <p className="text-sm">Tente outra busca ou categoria</p>
          </div>
        )}
      </div>
    </div>
  )
}
