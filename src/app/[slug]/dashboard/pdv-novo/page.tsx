'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PDVSettings, DEFAULT_PDV_SETTINGS } from '@/types/settings'
import { formatCurrency } from '@/lib/utils'
import { useProducts, Product } from '@/hooks/useProducts'
import {
  ShoppingCart, Plus, Minus, Trash2, CreditCard, DollarSign, Smartphone,
  Loader2, Search, Settings, X, Package
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
}

export default function PDVNovoPage() {
  const params = useParams()
  const slug = params.slug as string
  const supabase = useMemo(() => createClient(), [])

  const { products, loading: productsLoading } = useProducts()
  const [storeId, setStoreId] = useState<string | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [selectedPayment, setSelectedPayment] = useState<'money' | 'debit' | 'credit' | 'pix'>('money')
  const [pdvConfig, setPdvConfig] = useState<PDVSettings>(DEFAULT_PDV_SETTINGS)
  const [configLoading, setConfigLoading] = useState(true)

  useEffect(() => {
    async function loadConfig() {
      const { data: store } = await supabase
        .from('stores')
        .select('id, settings')
        .eq('slug', slug)
        .single()

      if (store) {
        setStoreId(store.id)
        const config = store.settings?.sales?.pdv || store.settings?.pdv || {}
        setPdvConfig({ ...DEFAULT_PDV_SETTINGS, ...config })
      }
      setConfigLoading(false)
    }
    loadConfig()
  }, [slug, supabase])

  const storeProducts = storeId ? products.filter(p => p.store_id === storeId) : []

  // Debug logs
  useEffect(() => {
    console.log('🔍 PDV Debug:', {
      slug,
      storeId,
      totalProducts: products.length,
      storeProducts: storeProducts.length,
      products: products.map(p => ({ id: p.id, name: p.name, store_id: p.store_id })),
      pdvConfig
    })
  }, [slug, storeId, products, storeProducts, pdvConfig])

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.id === product.id)
    if (existing) {
      setCart(cart.map(item =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ))
    } else {
      setCart([...cart, { id: product.id, name: product.name, price: product.base_price, quantity: 1 }])
    }
  }

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta
        return newQty > 0 ? { ...item, quantity: newQty } : item
      }
      return item
    }).filter(item => item.quantity > 0))
  }

  const removeItem = (id: string) => setCart(cart.filter(item => item.id !== id))
  const clearCart = () => setCart([])

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const filteredProducts = storeProducts.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

  if (productsLoading || configLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${pdvConfig.theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${pdvConfig.theme === 'dark' ? 'bg-slate-900' : 'bg-gradient-to-br from-slate-50 via-white to-blue-50/30'}`}>
      {/* Header */}
      <div className={`sticky top-0 z-20 px-4 py-3 border-b ${pdvConfig.theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl shadow-lg" style={{ backgroundColor: pdvConfig.primaryColor }}>
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${pdvConfig.theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                PDV - Ponto de Venda
              </h1>
              <p className={`text-sm ${pdvConfig.theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                {storeProducts.length} produtos • {cart.length} no carrinho
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/${slug}/dashboard/pdv-config`}>
              <button className={`p-2 rounded-lg ${pdvConfig.theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                <Settings className="w-5 h-5" />
              </button>
            </Link>
            <button onClick={clearCart} disabled={cart.length === 0} className={`p-2 rounded-lg ${pdvConfig.theme === 'dark' ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-600'} disabled:opacity-40`}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Produtos */}
          <div className="lg:col-span-2">
            {/* Busca */}
            <div className={`mb-4 relative ${pdvConfig.theme === 'dark' ? 'text-white' : ''}`}>
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${pdvConfig.theme === 'dark' ? 'text-slate-400' : 'text-slate-400'}`} />
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-xl border ${pdvConfig.theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
              />
            </div>

            {/* Grid de Produtos */}
            {filteredProducts.length === 0 ? (
              <div className={`text-center py-16 ${pdvConfig.theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                <Package className="w-20 h-20 mx-auto mb-4 opacity-30" />
                <p className="text-xl font-medium mb-2">Nenhum produto encontrado</p>
                <p className="text-sm mb-4">
                  {storeProducts.length === 0 
                    ? 'Adicione produtos na página de Produtos' 
                    : 'Tente buscar por outro termo'}
                </p>
                {storeProducts.length === 0 && (
                  <Link href={`/${slug}/dashboard/products`}>
                    <Button style={{ backgroundColor: pdvConfig.primaryColor }}>
                      Adicionar Produtos
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className={`grid gap-3 ${pdvConfig.layout === 'list' ? 'grid-cols-1' : pdvConfig.layout === 'compact' ? 'grid-cols-4' : 'grid-cols-3'}`}>
                {filteredProducts.map(product => (
                <div
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className={`cursor-pointer rounded-xl border overflow-hidden transition-all hover:shadow-lg ${
                    pdvConfig.theme === 'dark' ? 'bg-slate-800 border-slate-700 hover:border-slate-500' : 'bg-white border-slate-200 hover:border-blue-300'
                  } ${pdvConfig.layout === 'list' ? 'flex items-center p-3' : 'p-4'}`}
                  style={{ minHeight: pdvConfig.productSize === 'small' ? 80 : pdvConfig.productSize === 'large' ? 140 : 110 }}
                >
                  {pdvConfig.showImages && product.image_url && (
                    <img src={product.image_url} alt={product.name} className={`object-cover rounded-lg ${pdvConfig.layout === 'list' ? 'w-16 h-16 mr-3' : 'w-full h-20 mb-2'}`} />
                  )}
                  <div className={pdvConfig.layout === 'list' ? 'flex-1' : ''}>
                    <p className={`font-medium ${pdvConfig.theme === 'dark' ? 'text-white' : 'text-slate-800'} ${pdvConfig.fontSize === 'small' ? 'text-sm' : pdvConfig.fontSize === 'large' ? 'text-lg' : ''}`}>
                      {product.name}
                    </p>
                    <p className="font-bold" style={{ color: pdvConfig.primaryColor }}>
                      {formatCurrency(product.base_price)}
                    </p>
                  </div>
                </div>
              ))}
              </div>
            )}
          </div>

          {/* Carrinho */}
          <div className={`rounded-xl border p-4 h-fit sticky top-20 ${pdvConfig.theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`font-bold text-lg ${pdvConfig.theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                Carrinho
              </h2>
              <span className={`text-sm ${pdvConfig.theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                {cart.length} itens
              </span>
            </div>

            {cart.length === 0 ? (
              <div className={`text-center py-8 ${pdvConfig.theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Carrinho vazio</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {cart.map(item => (
                  <div key={item.id} className={`flex items-center justify-between py-2 border-b ${pdvConfig.theme === 'dark' ? 'border-slate-700' : 'border-slate-100'}`}>
                    <div className="flex-1">
                      <p className={`font-medium ${pdvConfig.theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{item.name}</p>
                      <p style={{ color: pdvConfig.primaryColor }}>{formatCurrency(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(item.id, -1)} className={`p-1 rounded ${pdvConfig.theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'}`}>
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className={pdvConfig.theme === 'dark' ? 'text-white' : ''}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className={`p-1 rounded ${pdvConfig.theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'}`}>
                        <Plus className="w-4 h-4" />
                      </button>
                      <button onClick={() => removeItem(item.id)} className="p-1 text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Total */}
            <div className={`mt-4 pt-4 border-t ${pdvConfig.theme === 'dark' ? 'border-slate-600' : 'border-slate-200'}`}>
              <div className="flex justify-between mb-4">
                <span className={`text-lg font-bold ${pdvConfig.theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Total</span>
                <span className="text-2xl font-bold" style={{ color: pdvConfig.primaryColor }}>{formatCurrency(total)}</span>
              </div>

              {/* Pagamento */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[
                  { id: 'money', icon: DollarSign, label: '💵' },
                  { id: 'debit', icon: CreditCard, label: '💳' },
                  { id: 'credit', icon: CreditCard, label: '💳' },
                  { id: 'pix', icon: Smartphone, label: '📱' },
                ].map(pm => (
                  <button
                    key={pm.id}
                    onClick={() => setSelectedPayment(pm.id as any)}
                    className={`p-3 rounded-lg text-center transition-all ${
                      selectedPayment === pm.id
                        ? 'text-white shadow-lg'
                        : pdvConfig.theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
                    }`}
                    style={selectedPayment === pm.id ? { backgroundColor: pdvConfig.primaryColor } : {}}
                  >
                    {pm.label}
                  </button>
                ))}
              </div>

              <Button
                disabled={cart.length === 0}
                className="w-full py-6 text-lg font-bold"
                style={{ backgroundColor: pdvConfig.primaryColor }}
              >
                Finalizar Pedido
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
