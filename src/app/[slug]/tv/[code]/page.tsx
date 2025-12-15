'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { QRCodeSVG } from 'qrcode.react'
import { Loader2, Wifi, WifiOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'

interface TvConfig {
  id: string
  name: string
  display_type: string
  layout: string
  columns: number
  rows: number
  show_prices: boolean
  show_images: boolean
  show_descriptions: boolean
  show_qr_code: boolean
  qr_position: string
  qr_size: number
  promo_rotation_seconds: number
  theme: string
  background_color: string
  text_color: string
  accent_color: string
  font_size: string
  category_ids: string[]
}

interface Product {
  id: string
  name: string
  description?: string
  price: number
  image_url?: string
  category_id: string
}

interface Category {
  id: string
  name: string
}

interface Store {
  id: string
  name: string
  logo_url?: string
  slug: string
}

interface Promotion {
  id: string
  title: string
  subtitle?: string
  image_url?: string
  background_color?: string
  text_color?: string
}

export default function TvMenuBoardPage() {
  const params = useParams()
  const slug = params.slug as string
  const code = params.code as string
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [store, setStore] = useState<Store | null>(null)
  const [tvConfig, setTvConfig] = useState<TvConfig | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0)
  const [isOnline, setIsOnline] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  
  const supabase = createClient()

  useEffect(() => {
    loadData()
    
    // Atualizar relógio
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    
    // Monitorar conexão
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      clearInterval(clockInterval)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Rotação de promoções
  useEffect(() => {
    if (promotions.length <= 1 || !tvConfig) return
    
    const interval = setInterval(() => {
      setCurrentPromoIndex(prev => (prev + 1) % promotions.length)
    }, (tvConfig.promo_rotation_seconds || 10) * 1000)
    
    return () => clearInterval(interval)
  }, [promotions.length, tvConfig?.promo_rotation_seconds])

  // Auto-refresh dos dados
  useEffect(() => {
    const interval = setInterval(() => {
      loadData()
    }, 60000) // Atualiza a cada 1 minuto
    
    return () => clearInterval(interval)
  }, [])

  async function loadData() {
    try {
      // Buscar loja
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('id, name, logo_url, slug')
        .eq('slug', slug)
        .single()
      
      if (storeError || !storeData) {
        setError('Loja não encontrada')
        return
      }
      setStore(storeData)

      // Buscar configuração da TV
      const { data: tvData, error: tvError } = await supabase
        .from('tv_displays')
        .select('*')
        .eq('store_id', storeData.id)
        .eq('code', code)
        .eq('is_active', true)
        .single()
      
      if (tvError || !tvData) {
        setError('Display não encontrado ou inativo')
        return
      }
      setTvConfig(tvData)

      // Ping para registrar que a TV está online
      await supabase
        .from('tv_displays')
        .update({ last_ping_at: new Date().toISOString() })
        .eq('id', tvData.id)

      // Buscar categorias
      const { data: catData } = await supabase
        .from('categories')
        .select('id, name')
        .eq('store_id', storeData.id)
        .eq('is_active', true)
        .order('sort_order')
      
      setCategories(catData || [])

      // Buscar produtos
      let productsQuery = supabase
        .from('products')
        .select('id, name, description, price, image_url, category_id')
        .eq('store_id', storeData.id)
        .eq('is_active', true)
        .order('sort_order')
      
      // Filtrar por categorias se configurado
      if (tvData.category_ids && tvData.category_ids.length > 0) {
        productsQuery = productsQuery.in('category_id', tvData.category_ids)
      }
      
      const { data: productsData } = await productsQuery
      setProducts(productsData || [])

      // Buscar promoções
      const { data: promosData } = await supabase
        .from('tv_promotions')
        .select('*')
        .eq('store_id', storeData.id)
        .eq('is_active', true)
        .order('sort_order')
      
      setPromotions(promosData || [])

    } catch (err) {
      console.error('Erro ao carregar dados:', err)
      setError('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-violet-500 mx-auto mb-4" />
          <p className="text-white text-xl">Carregando cardápio...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-2xl mb-4">{error}</p>
          <p className="text-gray-400">Verifique o código do display</p>
        </div>
      </div>
    )
  }

  const getFontSizeClass = () => {
    switch (tvConfig?.font_size) {
      case 'small': return 'text-sm'
      case 'large': return 'text-xl'
      default: return 'text-base'
    }
  }

  const getQrPositionClass = () => {
    switch (tvConfig?.qr_position) {
      case 'bottom-left': return 'bottom-4 left-4'
      case 'top-right': return 'top-4 right-4'
      case 'top-left': return 'top-4 left-4'
      default: return 'bottom-4 right-4'
    }
  }

  const menuUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/${slug}`

  return (
    <div 
      className="min-h-screen overflow-hidden relative"
      style={{ 
        backgroundColor: tvConfig?.background_color || '#1F2937',
        color: tvConfig?.text_color || '#FFFFFF'
      }}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          {store?.logo_url && (
            <Image 
              src={store.logo_url} 
              alt={store.name} 
              width={60} 
              height={60}
              className="rounded-lg"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold">{store?.name}</h1>
            <p className="text-white/60">Cardápio Digital</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          {/* Status de conexão */}
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="w-5 h-5 text-green-400" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-400" />
            )}
          </div>
          
          {/* Relógio */}
          <div className="text-4xl font-mono font-bold" style={{ color: tvConfig?.accent_color }}>
            {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </header>

      {/* Promoção em destaque */}
      {promotions.length > 0 && (
        <div 
          className="mx-6 mt-4 rounded-2xl overflow-hidden transition-all duration-500"
          style={{ 
            backgroundColor: promotions[currentPromoIndex]?.background_color || tvConfig?.accent_color,
            color: promotions[currentPromoIndex]?.text_color || '#FFFFFF'
          }}
        >
          <div className="flex items-center p-6">
            {promotions[currentPromoIndex]?.image_url && (
              <div className="w-32 h-32 rounded-xl overflow-hidden mr-6 flex-shrink-0">
                <Image 
                  src={promotions[currentPromoIndex].image_url!}
                  alt={promotions[currentPromoIndex].title}
                  width={128}
                  height={128}
                  className="object-cover w-full h-full"
                />
              </div>
            )}
            <div>
              <h2 className="text-4xl font-black mb-2">
                {promotions[currentPromoIndex]?.title}
              </h2>
              {promotions[currentPromoIndex]?.subtitle && (
                <p className="text-xl opacity-90">
                  {promotions[currentPromoIndex].subtitle}
                </p>
              )}
            </div>
          </div>
          
          {/* Indicadores de promoção */}
          {promotions.length > 1 && (
            <div className="flex justify-center gap-2 pb-4">
              {promotions.map((_, index) => (
                <div 
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentPromoIndex ? 'w-8 bg-white' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Grid de produtos */}
      <main className="p-6">
        <div 
          className={`grid gap-4 ${getFontSizeClass()}`}
          style={{ 
            gridTemplateColumns: `repeat(${tvConfig?.columns || 3}, 1fr)` 
          }}
        >
          {products.slice(0, (tvConfig?.columns || 3) * (tvConfig?.rows || 4)).map((product) => (
            <div 
              key={product.id}
              className="rounded-xl overflow-hidden bg-white/5 hover:bg-white/10 transition-colors"
            >
              {tvConfig?.show_images && product.image_url && (
                <div className="aspect-square relative">
                  <Image 
                    src={product.image_url}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="p-4">
                <h3 className="font-bold text-lg mb-1 line-clamp-2">{product.name}</h3>
                {tvConfig?.show_descriptions && product.description && (
                  <p className="text-white/60 text-sm line-clamp-2 mb-2">
                    {product.description}
                  </p>
                )}
                {tvConfig?.show_prices && (
                  <p 
                    className="text-2xl font-black"
                    style={{ color: tvConfig?.accent_color }}
                  >
                    {formatCurrency(product.price)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* QR Code */}
      {tvConfig?.show_qr_code && (
        <div className={`fixed ${getQrPositionClass()} bg-white p-3 rounded-2xl shadow-2xl`}>
          <QRCodeSVG 
            value={menuUrl}
            size={tvConfig?.qr_size || 150}
            level="M"
            includeMargin={false}
          />
          <p className="text-center text-gray-800 text-xs mt-2 font-medium">
            Escaneie para pedir
          </p>
        </div>
      )}

      {/* Footer com categorias */}
      <footer className="fixed bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm px-6 py-3">
        <div className="flex items-center justify-center gap-4 overflow-x-auto">
          {categories.slice(0, 8).map((category) => (
            <span 
              key={category.id}
              className="px-4 py-2 rounded-full bg-white/10 text-sm font-medium whitespace-nowrap"
            >
              {category.name}
            </span>
          ))}
        </div>
      </footer>
    </div>
  )
}
