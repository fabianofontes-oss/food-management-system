'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft, Search, Minus, Plus, Trash2, X, Check,
  CreditCard, Banknote, Smartphone, Receipt, Loader2,
  ChefHat, Bike, Store, ShoppingBag, Settings
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useProducts } from '@/hooks/useProducts'
import { useSettings } from '@/hooks/useSettings'
import { supabase } from '@/lib/supabase'

interface CartItem {
  id: string
  productId: string
  name: string
  price: number
  quantity: number
  image?: string
}

interface Props {
  slug: string
  storeId: string
}

type OrderType = 'counter' | 'takeaway' | 'delivery'
type PaymentMethod = 'cash' | 'card' | 'pix'

export default function PDVModerno({ slug, storeId }: Props) {
  // Estados
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [orderType, setOrderType] = useState<OrderType>('counter')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [cashReceived, setCashReceived] = useState(0)
  const [processing, setProcessing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Dados
  const { products, loading } = useProducts(storeId)
  const { settings } = useSettings(storeId)
  const [categories, setCategories] = useState<any[]>([])

  // Carregar categorias
  useEffect(() => {
    async function loadCategories() {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('sort_order')
      setCategories(data || [])
    }
    if (storeId) loadCategories()
  }, [storeId])

  // Filtrar produtos
  const filteredProducts = useMemo(() => {
    let filtered = products || []
    
    if (selectedCategory) {
      filtered = filtered.filter((p: any) => p.category_id === selectedCategory)
    }
    
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter((p: any) => 
        p.name.toLowerCase().includes(searchLower)
      )
    }
    
    return filtered.filter((p: any) => p.is_active)
  }, [products, selectedCategory, search])

  // Cálculos do carrinho
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const total = subtotal
  const change = cashReceived > total ? cashReceived - total : 0

  // Funções do carrinho
  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id)
      if (existing) {
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, {
        id: `${product.id}-${Date.now()}`,
        productId: product.id,
        name: product.name,
        price: product.base_price,
        quantity: 1,
        image: product.image_url
      }]
    })
  }

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta
        return newQty > 0 ? { ...item, quantity: newQty } : item
      }
      return item
    }).filter(item => item.quantity > 0))
  }

  const removeItem = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id))
  }

  const clearCart = () => setCart([])

  // Finalizar pedido
  const checkout = async () => {
    if (cart.length === 0) return
    
    setProcessing(true)
    try {
      const orderCode = `PDV${Date.now().toString(36).toUpperCase()}`
      
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          store_id: storeId,
          code: orderCode,
          channel: orderType === 'counter' ? 'COUNTER' : orderType === 'takeaway' ? 'TAKEAWAY' : 'DELIVERY',
          status: 'PENDING',
          subtotal_amount: subtotal,
          total_amount: total,
          payment_method: paymentMethod === 'cash' ? 'CASH' : paymentMethod === 'card' ? 'CARD' : 'PIX'
        })
        .select()
        .single()

      if (orderError) throw orderError

      const orderItems = cart.map(item => ({
        order_id: order.id,
        product_id: item.productId,
        title_snapshot: item.name,
        unit_price: item.price,
        quantity: item.quantity,
        unit_type: 'unit',
        subtotal: item.price * item.quantity
      }))

      await supabase.from('order_items').insert(orderItems)

      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        clearCart()
        setCashReceived(0)
      }, 2000)

    } catch (error) {
      console.error('Erro ao criar pedido:', error)
      alert('Erro ao criar pedido')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="h-screen flex bg-slate-100 overflow-hidden">
      {/* Coluna Esquerda - Produtos */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/${slug}/dashboard`} className="p-2 hover:bg-slate-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div>
              <h1 className="font-bold text-lg text-slate-800">PDV</h1>
              <p className="text-xs text-slate-500">Ponto de Venda</p>
            </div>
          </div>
          <Link href={`/${slug}/dashboard/settings/pdv`} className="p-2 hover:bg-slate-100 rounded-lg">
            <Settings className="w-5 h-5 text-slate-600" />
          </Link>
        </div>

        {/* Tipo de Pedido */}
        <div className="bg-white border-b px-4 py-2">
          <div className="flex gap-2">
            {[
              { type: 'counter' as OrderType, label: 'Balcão', icon: Store },
              { type: 'takeaway' as OrderType, label: 'Retirada', icon: ChefHat },
              { type: 'delivery' as OrderType, label: 'Delivery', icon: Bike },
            ].map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                onClick={() => setOrderType(type)}
                className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                  orderType === type
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Busca */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar produto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Categorias */}
        <div className="px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                !selectedCategory
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              Todos
            </button>
            {(categories || []).map((cat: any) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de Produtos */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredProducts.map((product: any) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-white rounded-xl p-3 text-left hover:shadow-lg hover:scale-[1.02] transition-all border border-slate-100 group"
              >
                {product.image_url ? (
                  <div className="aspect-square rounded-lg overflow-hidden mb-2 bg-slate-100">
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      width={200}
                      height={200}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                ) : (
                  <div className="aspect-square rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 mb-2 flex items-center justify-center">
                    <ShoppingBag className="w-8 h-8 text-slate-400" />
                  </div>
                )}
                <h3 className="font-medium text-slate-800 text-sm line-clamp-2 mb-1">
                  {product.name}
                </h3>
                <p className="text-blue-600 font-bold">
                  {formatCurrency(product.base_price)}
                </p>
              </button>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>Nenhum produto encontrado</p>
            </div>
          )}
        </div>
      </div>

      {/* Coluna Direita - Carrinho */}
      <div className="w-96 bg-white border-l flex flex-col">
        {/* Header do Carrinho */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-slate-800">Carrinho</span>
            {cart.length > 0 && (
              <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-red-500 hover:text-red-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Itens do Carrinho */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <ShoppingBag className="w-16 h-16 mb-3 text-slate-200" />
              <p className="font-medium">Carrinho vazio</p>
              <p className="text-sm">Adicione produtos</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.id} className="bg-slate-50 rounded-xl p-3">
                  <div className="flex gap-3">
                    <div className="w-14 h-14 rounded-lg bg-slate-200 overflow-hidden flex-shrink-0">
                      {item.image ? (
                        <Image src={item.image} alt={item.name} width={56} height={56} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-6 h-6 text-slate-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-slate-800 text-sm truncate">{item.name}</h4>
                      <p className="text-blue-600 font-bold text-sm">{formatCurrency(item.price)}</p>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-8 h-8 rounded-lg bg-white border flex items-center justify-center hover:bg-slate-100"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-8 h-8 rounded-lg bg-white border flex items-center justify-center hover:bg-slate-100"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="font-bold text-slate-800">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagamento e Total */}
        {cart.length > 0 && (
          <div className="border-t p-4 space-y-4">
            {/* Forma de Pagamento */}
            <div>
              <p className="text-xs text-slate-500 mb-2 font-medium">PAGAMENTO</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { method: 'cash' as PaymentMethod, label: 'Dinheiro', icon: Banknote, color: 'green' },
                  { method: 'card' as PaymentMethod, label: 'Cartão', icon: CreditCard, color: 'blue' },
                  { method: 'pix' as PaymentMethod, label: 'PIX', icon: Smartphone, color: 'purple' },
                ].map(({ method, label, icon: Icon, color }) => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`py-2 px-3 rounded-lg text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                      paymentMethod === method
                        ? `bg-${color}-100 text-${color}-700 ring-2 ring-${color}-500`
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Troco (apenas dinheiro) */}
            {paymentMethod === 'cash' && (
              <div>
                <p className="text-xs text-slate-500 mb-2 font-medium">VALOR RECEBIDO</p>
                <input
                  type="number"
                  value={cashReceived || ''}
                  onChange={(e) => setCashReceived(Number(e.target.value))}
                  placeholder="0,00"
                  className="w-full px-3 py-2 border rounded-lg text-lg font-bold focus:ring-2 focus:ring-green-500"
                />
                {change > 0 && (
                  <p className="text-green-600 font-bold mt-1">
                    Troco: {formatCurrency(change)}
                  </p>
                )}
              </div>
            )}

            {/* Total */}
            <div className="flex justify-between items-center py-3 border-t">
              <span className="text-slate-600 font-medium">Total</span>
              <span className="text-2xl font-bold text-slate-800">
                {formatCurrency(total)}
              </span>
            </div>

            {/* Botão Finalizar */}
            <button
              onClick={checkout}
              disabled={processing || cart.length === 0}
              className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-green-600/25"
            >
              {processing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Receipt className="w-5 h-5" />
                  Finalizar Pedido
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Modal de Sucesso */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 text-center animate-in zoom-in-95">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Pedido Criado!</h2>
            <p className="text-slate-600">O pedido foi enviado para a cozinha</p>
          </div>
        </div>
      )}
    </div>
  )
}
