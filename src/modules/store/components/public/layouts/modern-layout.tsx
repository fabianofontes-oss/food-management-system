'use client'

import { Search, Plus, MapPin, Clock, ShoppingBag, ChevronRight, Sparkles, AlertCircle } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import type { MenuTheme } from '../../../types'
import { useCartStore } from '@/modules/cart'
import { applyNicheAction } from '@/modules/store/actions'

// Mapeamento de cores de categoria para Tailwind
const CATEGORY_COLOR_MAP: Record<string, { bg: string; bgActive: string; text: string }> = {
  red: { bg: 'bg-red-500', bgActive: 'bg-red-600', text: 'text-white' },
  orange: { bg: 'bg-orange-500', bgActive: 'bg-orange-600', text: 'text-white' },
  amber: { bg: 'bg-amber-500', bgActive: 'bg-amber-600', text: 'text-white' },
  green: { bg: 'bg-green-500', bgActive: 'bg-green-600', text: 'text-white' },
  blue: { bg: 'bg-blue-500', bgActive: 'bg-blue-600', text: 'text-white' },
  purple: { bg: 'bg-purple-500', bgActive: 'bg-purple-600', text: 'text-white' },
  stone: { bg: 'bg-stone-600', bgActive: 'bg-stone-700', text: 'text-white' },
  slate: { bg: 'bg-slate-800', bgActive: 'bg-slate-900', text: 'text-white' },
}

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
  color?: string | null
  products: Product[]
}

interface ModernLayoutProps {
  theme: MenuTheme
  storeName: string
  storeAddress?: string
  storePhone?: string
  storeWhatsapp?: string
  logoUrl?: string | null
  bannerUrl?: string | null
  categories: Category[]
  onAddToCart?: (product: Product) => void
  // Props para botão de emergência (admin)
  storeId?: string
  storeSlug?: string
  nicheSlug?: string
  isOwner?: boolean
}

export function ModernLayout({
  theme,
  storeName,
  storeAddress,
  storePhone,
  storeWhatsapp,
  logoUrl,
  bannerUrl,
  categories,
  onAddToCart,
  storeId,
  storeSlug,
  nicheSlug,
  isOwner = false
}: ModernLayoutProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [isNavSticky, setIsNavSticky] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const navRef = useRef<HTMLDivElement>(null)
  
  // Carrinho
  const { getTotalItems, getSubtotal, toggleCart } = useCartStore()
  const totalItems = getTotalItems()
  const subtotal = getSubtotal()
  
  // Handler para gerar cardápio demo
  const handleGenerateDemo = async () => {
    if (!storeId || !storeSlug || !nicheSlug) {
      setGenerationError('Dados da loja incompletos')
      return
    }
    
    setIsGenerating(true)
    setGenerationError(null)
    
    try {
      const result = await applyNicheAction(storeId, storeSlug, nicheSlug)
      if (result.success) {
        // Recarregar a página para mostrar os novos produtos
        window.location.reload()
      } else {
        setGenerationError(result.error || 'Erro ao gerar cardápio')
      }
    } catch (error) {
      setGenerationError('Erro inesperado. Tente novamente.')
    } finally {
      setIsGenerating(false)
    }
  }

  // Detectar scroll para sticky nav
  useEffect(() => {
    const handleScroll = () => {
      if (navRef.current) {
        const navTop = navRef.current.getBoundingClientRect().top
        setIsNavSticky(navTop <= 0)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Filtrar produtos pela busca
  const filteredCategories = categories.map(cat => ({
    ...cat,
    products: cat.products.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.products.length > 0)

  const displayCategories = searchQuery 
    ? filteredCategories 
    : activeCategory 
      ? categories.filter(c => c.id === activeCategory)
      : categories

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  // Total de produtos
  const totalProducts = categories.reduce((sum, cat) => sum + cat.products.length, 0)

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* ========== HERO BANNER (estilo iFood) ========== */}
      <div className="relative">
        {/* Banner de Capa */}
        <div 
          className="h-40 sm:h-52 md:h-64"
          style={{
            backgroundColor: theme.colors.primary,
            backgroundImage: bannerUrl 
              ? `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.4)), url(${bannerUrl})` 
              : `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.header || theme.colors.primary} 100%)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />

        {/* Card da Loja (sobreposto ao banner) */}
        <div className="max-w-4xl mx-auto px-3 sm:px-4">
          <div className="bg-white rounded-2xl shadow-xl -mt-20 sm:-mt-24 relative z-10 overflow-hidden">
            <div className="p-4 sm:p-6">
              <div className="flex items-start gap-4">
                {/* Logo Avatar */}
                <div className="relative -mt-12 sm:-mt-16 flex-shrink-0">
                  <div 
                    className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center text-white font-bold text-3xl overflow-hidden"
                    style={{ backgroundColor: theme.colors.primary }}
                  >
                    {logoUrl ? (
                      <Image src={logoUrl} alt={storeName} fill className="object-cover" />
                    ) : (
                      storeName.charAt(0).toUpperCase()
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 pt-1">
                  <h1 className="font-bold text-xl sm:text-2xl text-slate-800 truncate">{storeName}</h1>
                  {storeAddress && (
                    <p className="text-sm text-slate-500 flex items-center gap-1 mt-1 truncate">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{storeAddress}</span>
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span 
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: '#22C55E' }}
                    >
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      Aberto
                    </span>
                    <span className="text-xs text-slate-400">
                      {totalProducts} produtos
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
                    placeholder="Buscar no cardápio..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl text-base outline-none bg-slate-100 focus:bg-white focus:ring-2 transition-all border-2 border-transparent focus:border-emerald-500"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========== NAVEGAÇÃO DE CATEGORIAS (Sticky) ========== */}
      <div 
        ref={navRef}
        className={`sticky top-0 z-40 transition-all duration-300 ${
          isNavSticky ? 'bg-white shadow-md' : 'bg-transparent'
        }`}
      >
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {/* Botão "Todos" */}
            <button
              onClick={() => setActiveCategory(null)}
              className={`
                flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-full font-semibold text-sm whitespace-nowrap
                transition-all min-h-[44px] shadow-sm
                ${!activeCategory 
                  ? 'bg-slate-800 text-white shadow-lg' 
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }
              `}
            >
              Todos
            </button>

            {/* Categorias com cores */}
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id
              const colorConfig = cat.color ? CATEGORY_COLOR_MAP[cat.color] : null
              
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(isActive ? null : cat.id)}
                  className={`
                    flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-full font-semibold text-sm whitespace-nowrap
                    transition-all min-h-[44px] shadow-sm
                    ${isActive && colorConfig 
                      ? `${colorConfig.bg} ${colorConfig.text} shadow-lg` 
                      : isActive 
                        ? 'text-white shadow-lg'
                        : colorConfig
                          ? `bg-white border-2 hover:opacity-90`
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }
                  `}
                  style={
                    isActive && !colorConfig 
                      ? { backgroundColor: theme.colors.primary } 
                      : !isActive && colorConfig
                        ? { borderColor: colorConfig.bg.replace('bg-', '').replace('-500', ''), color: colorConfig.bg.includes('slate') ? '#1e293b' : undefined }
                        : undefined
                  }
                >
                  {/* Bolinha de cor */}
                  {colorConfig && !isActive && (
                    <span className={`w-3 h-3 rounded-full ${colorConfig.bg}`} />
                  )}
                  {cat.name}
                  <span className="text-xs opacity-70">({cat.products.length})</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ========== GRID DE PRODUTOS ========== */}
      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-4">
        {displayCategories.length === 0 || totalProducts === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-slate-100 rounded-full flex items-center justify-center">
              <ShoppingBag className="w-12 h-12 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">
              {searchQuery ? 'Nenhum produto encontrado' : 'Cardápio vazio'}
            </h3>
            <p className="text-slate-500 mb-6">
              {searchQuery ? 'Tente buscar por outro termo' : 'Em breve novos produtos!'}
            </p>
            
            {/* ========== BOTÃO DE EMERGÊNCIA (Admin) ========== */}
            {isOwner && nicheSlug && !searchQuery && (
              <div className="max-w-md mx-auto mt-8 p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-200 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-amber-100 rounded-xl">
                    <AlertCircle className="w-6 h-6 text-amber-600" />
                  </div>
                  <h4 className="font-bold text-lg text-slate-800">Seu cardápio está vazio!</h4>
                </div>
                <p className="text-sm text-slate-600 mb-4">
                  Deseja gerar produtos de exemplo baseados no nicho <strong>{nicheSlug}</strong>? 
                  Você poderá editar ou remover depois.
                </p>
                
                {generationError && (
                  <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                    {generationError}
                  </div>
                )}
                
                <button
                  onClick={handleGenerateDemo}
                  disabled={isGenerating}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-white font-bold text-base shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl active:scale-[0.98]"
                  style={{ 
                    backgroundColor: theme.colors.primary,
                    boxShadow: `0 8px 20px -5px ${theme.colors.primary}50`
                  }}
                >
                  {isGenerating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Gerando cardápio...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      🪄 Gerar Cardápio Demo
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {displayCategories.map((category) => (
              <section key={category.id}>
                {/* Título da categoria */}
                <div className="flex items-center gap-3 mb-4">
                  {category.color && CATEGORY_COLOR_MAP[category.color] && (
                    <span className={`w-4 h-4 rounded-full ${CATEGORY_COLOR_MAP[category.color].bg}`} />
                  )}
                  <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                    {category.name}
                  </h2>
                  <span className="text-sm text-slate-400">
                    {category.products.length} {category.products.length === 1 ? 'item' : 'itens'}
                  </span>
                </div>

                {/* Grid responsivo: 1 col mobile, 2 tablet, 3 desktop */}
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* ========== CARRINHO FLUTUANTE (Mobile) ========== */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 bg-gradient-to-t from-white via-white to-transparent">
          <button
            onClick={toggleCart}
            className="w-full flex items-center justify-between gap-4 px-5 py-4 rounded-2xl text-white font-bold shadow-2xl transition-transform active:scale-[0.98]"
            style={{ 
              backgroundColor: theme.colors.primary,
              boxShadow: `0 10px 40px -10px ${theme.colors.primary}80`
            }}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingBag className="w-6 h-6" />
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-white rounded-full text-xs font-bold flex items-center justify-center"
                  style={{ color: theme.colors.primary }}
                >
                  {totalItems}
                </span>
              </div>
              <span>Ver Carrinho</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">{formatCurrency(subtotal)}</span>
              <ChevronRight className="w-5 h-5" />
            </div>
          </button>
        </div>
      )}
    </div>
  )
}

// ========== PRODUCT CARD (Estilo iFood) ==========
function ProductCard({ 
  product, 
  primaryColor,
  onAdd 
}: { 
  product: Product
  primaryColor: string
  onAdd?: () => void 
}) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  return (
    <button
      onClick={onAdd}
      disabled={!product.is_available}
      className={`
        w-full bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl 
        transition-all text-left group border border-slate-100
        ${!product.is_available ? 'opacity-60 cursor-not-allowed' : 'active:scale-[0.98]'}
      `}
    >
      <div className="flex h-full">
        {/* Conteúdo */}
        <div className="flex-1 p-4 flex flex-col">
          <h3 className="font-bold text-base text-slate-800 line-clamp-1 group-hover:text-emerald-600 transition-colors">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-sm text-slate-500 mt-1 line-clamp-2 flex-1">
              {product.description}
            </p>
          )}
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
            <span className="font-extrabold text-lg text-emerald-600">
              {formatCurrency(product.price)}
            </span>
            {product.is_available && (
              <div 
                className="w-9 h-9 rounded-full flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform"
                style={{ backgroundColor: primaryColor }}
              >
                <Plus className="w-5 h-5" />
              </div>
            )}
            {!product.is_available && (
              <span className="text-xs text-red-500 font-medium">Esgotado</span>
            )}
          </div>
        </div>

        {/* Imagem */}
        {product.image_url && (
          <div className="relative w-28 sm:w-32 flex-shrink-0">
            <div 
              className="absolute inset-0 bg-slate-100 bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
              style={{ backgroundImage: `url(${product.image_url})` }}
            />
          </div>
        )}
      </div>
    </button>
  )
}
