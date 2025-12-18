'use client'

import { useMemo } from 'react'
import { Search, Package, Barcode, Grid2X2, Grid3X3, Square, LayoutList, Scale, Wifi, WifiOff } from 'lucide-react'
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
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-300'

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
      case 'photo-md': return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3'
      case 'photo-sm': return 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2'
      case 'card': return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-2'
      case 'list': return 'flex flex-col gap-1'
    }
  }

  const renderProduct = (product: any) => {
    const isWeightProduct = product.unit === 'kg' || product.sold_by_weight

    // FOTO MÉDIA
    if (layoutType === 'photo-md') {
      return (
        <button
          key={product.id}
          onClick={() => handleProductClick(product)}
          className={`${cardBg} rounded-xl border-2 ${borderColor} hover:border-blue-500 hover:shadow-lg active:scale-[0.98] transition-all text-left overflow-hidden`}
        >
          <div className={`w-full aspect-square ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-center`}>
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <Package className={`w-12 h-12 ${mutedText} opacity-40`} />
            )}
          </div>
          <div className="p-3">
            <p className={`font-semibold ${textColor} text-sm leading-tight line-clamp-2 min-h-[2.5rem]`}>{product.name}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-blue-600 font-bold text-lg">{formatCurrency(product.base_price)}</span>
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
          <div className={`w-full aspect-square ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-center`}>
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <Package className={`w-8 h-8 ${mutedText} opacity-40`} />
            )}
          </div>
          <div className="p-2">
            <p className={`font-medium ${textColor} text-xs truncate`}>{product.name}</p>
            <p className="text-blue-600 font-bold text-sm">{formatCurrency(product.base_price)}</p>
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
          className={`${cardBg} rounded-xl border-2 ${borderColor} hover:border-blue-500 hover:shadow-md active:scale-[0.98] transition-all p-4 text-left h-full flex flex-col justify-between`}
        >
          <p className={`font-semibold ${textColor} text-sm leading-tight line-clamp-2`}>{product.name}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-blue-600 font-bold text-lg">{formatCurrency(product.base_price)}</span>
            {isWeightProduct && <Scale className="w-4 h-4 text-orange-500" />}
          </div>
        </button>
      )
    }

    // LISTA
    return (
      <button
        key={product.id}
        onClick={() => handleProductClick(product)}
        className={`${cardBg} rounded-lg border ${borderColor} hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-gray-700 active:scale-[0.995] transition-all px-4 py-3 text-left flex items-center gap-4`}
      >
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
        ) : (
          <div className={`w-12 h-12 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-center flex-shrink-0`}>
            <Package className={`w-6 h-6 ${mutedText} opacity-40`} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className={`font-semibold ${textColor} text-sm truncate`}>{product.name}</p>
          {product.category?.name && <p className={`text-xs ${mutedText}`}>{product.category.name}</p>}
        </div>
        <div className="flex items-center gap-3">
          {isWeightProduct && <Scale className="w-4 h-4 text-orange-500" />}
          <span className="text-blue-600 font-bold text-lg">{formatCurrency(product.base_price)}</span>
        </div>
      </button>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* BALANÇA GRANDE */}
      <div className={`mb-4 p-4 rounded-2xl border-2 ${
        scaleConnected 
          ? 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30' 
          : 'border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-600'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${scaleConnected ? 'bg-green-500' : 'bg-gray-400'}`}>
              <Scale className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                {scaleConnected ? (
                  <Wifi className="w-4 h-4 text-green-600" />
                ) : (
                  <WifiOff className="w-4 h-4 text-gray-400" />
                )}
                <span className={`text-sm font-medium ${scaleConnected ? 'text-green-600' : 'text-gray-500'}`}>
                  {scaleConnected ? 'Balança Conectada' : 'Balança Offline'}
                </span>
              </div>
              <p className={`text-xs ${mutedText}`}>Clique no produto para pesar</p>
            </div>
          </div>
          <div className={`text-right px-6 py-2 rounded-xl ${scaleConnected ? 'bg-green-100 dark:bg-green-900/50' : 'bg-gray-100 dark:bg-gray-700'}`}>
            <p className={`text-xs uppercase tracking-wider ${scaleConnected ? 'text-green-600' : 'text-gray-500'}`}>PESO</p>
            <p className={`font-mono font-black text-4xl tracking-tight ${scaleConnected ? 'text-green-700 dark:text-green-400' : 'text-gray-400'}`}>
              {scaleWeight.toFixed(3)}
            </p>
            <p className={`text-sm font-medium ${scaleConnected ? 'text-green-600' : 'text-gray-500'}`}>kg</p>
          </div>
        </div>
      </div>

      {/* BARRA DE BUSCA E CONTROLES */}
      <div className="mb-4 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            id="search-input"
            type="text"
            placeholder="Buscar produto... (F1)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-12 pr-4 py-3 ${cardBg} rounded-xl border-2 ${borderColor} focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none ${textColor} text-base transition-all`}
          />
        </div>

        <div className="relative">
          <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Código"
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onBarcodeSearch()}
            className={`w-32 pl-10 pr-3 py-3 ${cardBg} rounded-xl border-2 ${borderColor} focus:border-blue-500 outline-none ${textColor}`}
          />
        </div>

        <div className={`flex rounded-xl border-2 ${borderColor} overflow-hidden ${cardBg}`}>
          {LAYOUTS.map(({ type, icon: Icon, label }) => (
            <button
              key={type}
              onClick={() => setLayoutType(type)}
              className={`px-4 py-3 transition-all flex items-center gap-2 ${
                layoutType === type 
                  ? 'bg-blue-600 text-white' 
                  : `hover:bg-gray-100 dark:hover:bg-gray-700 ${mutedText}`
              }`}
              title={label}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium hidden lg:block">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* CATEGORIAS */}
      {categories.length > 0 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-5 py-2.5 rounded-xl whitespace-nowrap transition-all font-semibold text-sm ${
              !selectedCategory 
                ? 'bg-blue-600 text-white shadow-lg' 
                : `${cardBg} ${textColor} border-2 ${borderColor} hover:border-blue-400`
            }`}
          >
            Todos ({products?.filter((p: any) => p.is_active).length || 0})
          </button>
          {categories.map(cat => {
            const count = products?.filter((p: any) => p.is_active && p.category?.name === cat).length || 0
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2.5 rounded-xl whitespace-nowrap transition-all font-semibold text-sm ${
                  selectedCategory === cat 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : `${cardBg} ${textColor} border-2 ${borderColor} hover:border-blue-400`
                }`}
              >
                {cat} ({count})
              </button>
            )
          })}
        </div>
      )}

      {/* GRID DE PRODUTOS */}
      <div className="flex-1 overflow-y-auto">
        <div className={`${getGridClass()}`}>
          {filteredProducts.map(renderProduct)}
        </div>

        {filteredProducts.length === 0 && (
          <div className={`flex flex-col items-center justify-center py-16 ${mutedText}`}>
            <Package className="w-20 h-20 mb-4 opacity-30" />
            <p className="text-xl font-semibold">Nenhum produto encontrado</p>
            <p className="text-sm mt-1">Tente outra busca ou categoria</p>
          </div>
        )}
      </div>
    </div>
  )
}
