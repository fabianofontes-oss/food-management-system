'use client'

import { Search, Plus, Minus, ShoppingBag, Home, Heart, User, ChevronRight, X, MapPin, Clock, Phone } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import type { MenuTheme } from '../../../types'
import { useCartStore } from '@/modules/cart'

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

interface AppLayoutProps {
  theme: MenuTheme
  storeName: string
  storeAddress?: string
  storePhone?: string
  storeWhatsapp?: string
  logoUrl?: string | null
  bannerUrl?: string | null
  categories: Category[]
  onAddToCart?: (product: Product) => void
  storeId?: string
  storeSlug?: string
  nicheSlug?: string
  isOwner?: boolean
}

export function AppLayout({
  theme,
  storeName,
  storeAddress,
  storePhone,
  logoUrl,
  bannerUrl,
  categories,
}: AppLayoutProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const categoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  
  const { addItem, getTotalItems, getSubtotal, toggleCart } = useCartStore()
  const totalItems = getTotalItems()
  const subtotal = getSubtotal()

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  // Scroll para categoria
  const scrollToCategory = (categoryId: string) => {
    setActiveCategory(categoryId)
    categoryRefs.current[categoryId]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Detectar categoria ativa no scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200
      
      for (const cat of categories) {
        const element = categoryRefs.current[cat.id]
        if (element) {
          const { offsetTop, offsetHeight } = element
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveCategory(cat.id)
            break
          }
        }
      }
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [categories])

  // Filtrar produtos
  const filteredCategories = searchQuery
    ? categories.map(cat => ({
        ...cat,
        products: cat.products.filter(p =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(cat => cat.products.length > 0)
    : categories

  // Adicionar ao carrinho
  const handleAddToCart = (product: Product, qty: number = 1) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: qty,
      image_url: product.image_url || undefined,
    })
    setSelectedProduct(null)
    setQuantity(1)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* ═══════════════════════════════════════════════════════════════
          HEADER ESTILO APP
      ═══════════════════════════════════════════════════════════════ */}
      <div 
        className="sticky top-0 z-50 safe-area-top"
        style={{ backgroundColor: theme.colors.primary }}
      >
        {/* Status Bar Space (iOS) */}
        <div className="h-safe-top" />
        
        {/* Header Principal */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div 
              className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center overflow-hidden flex-shrink-0"
            >
              {logoUrl ? (
                <Image src={logoUrl} alt={storeName} width={48} height={48} className="object-cover" />
              ) : (
                <span className="text-white font-bold text-xl">{storeName.charAt(0)}</span>
              )}
            </div>
            
            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-white font-bold text-lg truncate">{storeName}</h1>
              <div className="flex items-center gap-2 text-white/80 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  Aberto agora
                </span>
                {storeAddress && (
                  <>
                    <span>•</span>
                    <span className="truncate">{storeAddress.split(',')[0]}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Barra de Busca */}
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="O que você procura?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </div>
        </div>
        
        {/* Navegação de Categorias */}
        <div className="bg-white border-b border-gray-100">
          <div className="flex overflow-x-auto scrollbar-hide px-2 py-2 gap-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeCategory === cat.id
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={activeCategory === cat.id ? { backgroundColor: theme.colors.primary } : {}}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          LISTA DE PRODUTOS
      ═══════════════════════════════════════════════════════════════ */}
      <div className="px-4 py-4">
        {filteredCategories.map((category) => (
          <div 
            key={category.id}
            ref={(el) => { categoryRefs.current[category.id] = el }}
            className="mb-6"
          >
            {/* Título da Categoria */}
            <h2 className="text-lg font-bold text-gray-800 mb-3 sticky top-[180px] bg-gray-50 py-2 z-10">
              {category.name}
              <span className="text-sm font-normal text-gray-400 ml-2">
                {category.products.length} itens
              </span>
            </h2>
            
            {/* Grid de Produtos */}
            <div className="space-y-3">
              {category.products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => setSelectedProduct(product)}
                  className="w-full bg-white rounded-2xl p-3 flex gap-3 shadow-sm hover:shadow-md transition-all active:scale-[0.98] text-left"
                >
                  {/* Imagem */}
                  <div className="w-24 h-24 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden">
                    {product.image_url ? (
                      <Image 
                        src={product.image_url} 
                        alt={product.name} 
                        width={96} 
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div 
                        className="w-full h-full flex items-center justify-center text-3xl"
                        style={{ backgroundColor: `${theme.colors.primary}20` }}
                      >
                        🍽️
                      </div>
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                    <div>
                      <h3 className="font-semibold text-gray-800 line-clamp-2">{product.name}</h3>
                      {product.description && (
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1">{product.description}</p>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span 
                        className="font-bold text-lg"
                        style={{ color: theme.colors.primary }}
                      >
                        {formatCurrency(product.price)}
                      </span>
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: theme.colors.primary }}
                      >
                        <Plus className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
        
        {/* Empty State */}
        {filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-500">Nenhum produto encontrado</p>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          BOTTOM BAR (CARRINHO)
      ═══════════════════════════════════════════════════════════════ */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 safe-area-bottom">
          <button
            onClick={toggleCart}
            className="w-full py-4 px-6 rounded-2xl flex items-center justify-between shadow-2xl active:scale-[0.98] transition-all"
            style={{ backgroundColor: theme.colors.primary }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-white/80 text-xs">Ver sacola</p>
                <p className="text-white font-bold">{totalItems} {totalItems === 1 ? 'item' : 'itens'}</p>
              </div>
            </div>
            <span className="text-white font-bold text-lg">{formatCurrency(subtotal)}</span>
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          MODAL DO PRODUTO
      ═══════════════════════════════════════════════════════════════ */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedProduct(null)}
          />
          
          {/* Modal */}
          <div className="relative bg-white w-full sm:w-[480px] sm:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-hidden animate-slide-up">
            {/* Imagem */}
            <div className="relative h-64 bg-gray-100">
              {selectedProduct.image_url ? (
                <Image 
                  src={selectedProduct.image_url} 
                  alt={selectedProduct.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div 
                  className="w-full h-full flex items-center justify-center text-8xl"
                  style={{ backgroundColor: `${theme.colors.primary}20` }}
                >
                  🍽️
                </div>
              )}
              
              {/* Botão Fechar */}
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            {/* Conteúdo */}
            <div className="p-5">
              <h2 className="text-xl font-bold text-gray-800">{selectedProduct.name}</h2>
              {selectedProduct.description && (
                <p className="text-gray-500 mt-2">{selectedProduct.description}</p>
              )}
              
              <div className="flex items-center justify-between mt-6">
                <span 
                  className="text-2xl font-bold"
                  style={{ color: theme.colors.primary }}
                >
                  {formatCurrency(selectedProduct.price)}
                </span>
                
                {/* Controle de Quantidade */}
                <div className="flex items-center gap-4 bg-gray-100 rounded-full p-1">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm"
                  >
                    <Minus className="w-5 h-5 text-gray-600" />
                  </button>
                  <span className="font-bold text-lg w-8 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm"
                  >
                    <Plus className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
              
              {/* Botão Adicionar */}
              <button
                onClick={() => handleAddToCart(selectedProduct, quantity)}
                className="w-full mt-6 py-4 rounded-2xl text-white font-bold text-lg active:scale-[0.98] transition-all"
                style={{ backgroundColor: theme.colors.primary }}
              >
                Adicionar • {formatCurrency(selectedProduct.price * quantity)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS para animação */}
      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        .safe-area-top {
          padding-top: env(safe-area-inset-top, 0);
        }
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom, 0);
        }
        .h-safe-top {
          height: env(safe-area-inset-top, 0);
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}
