'use client'

import { useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { 
  ShoppingCart, Search, Plus, Minus, Trash2, 
  CreditCard, Banknote, Smartphone, X, Check,
  Loader2, Package
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { useProducts } from '@/hooks/useProducts'
import { useDashboardStoreId } from '../DashboardClient'
import { supabase } from '@/lib/supabase'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
}

type PaymentMethod = 'cash' | 'card' | 'pix'

export default function PDVPage() {
  const params = useParams()
  const slug = params.slug as string
  const storeId = useDashboardStoreId()

  // Estados
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [cashReceived, setCashReceived] = useState<number>(0)
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)

  // Dados
  const { products, loading } = useProducts(storeId || '')

  // Produtos filtrados
  const filteredProducts = useMemo(() => {
    if (!products) return []
    return products.filter(p => 
      p.is_active && 
      p.name.toLowerCase().includes(search.toLowerCase())
    )
  }, [products, search])

  // Cálculos do carrinho
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const total = subtotal
  const change = paymentMethod === 'cash' ? Math.max(0, cashReceived - total) : 0

  // Funções do carrinho
  const addToCart = (product: any) => {
    const existing = cart.find(item => item.id === product.id)
    if (existing) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, {
        id: product.id,
        name: product.name,
        price: product.base_price,
        quantity: 1
      }])
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

  const removeItem = (id: string) => {
    setCart(cart.filter(item => item.id !== id))
  }

  const clearCart = () => {
    setCart([])
    setCashReceived(0)
  }

  // Finalizar venda
  const handleCheckout = async () => {
    if (cart.length === 0 || !storeId) return

    setProcessing(true)
    try {
      const orderCode = `PDV-${Date.now()}`
      
      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          store_id: storeId,
          order_code: orderCode,
          customer_name: 'Cliente PDV',
          customer_phone: '',
          order_type: 'dine_in',
          payment_method: paymentMethod === 'card' ? 'credit_card' : paymentMethod,
          subtotal: subtotal,
          total_amount: total,
          status: 'confirmed',
          notes: 'Venda via PDV'
        })
        .select('id')
        .single()

      if (error) throw error

      // Inserir itens
      for (const item of cart) {
        await supabase.from('order_items').insert({
          order_id: order.id,
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity
        })
      }

      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        clearCart()
      }, 2000)

    } catch (error) {
      console.error('Erro ao criar pedido:', error)
      alert('Erro ao finalizar venda')
    } finally {
      setProcessing(false)
    }
  }

  if (!storeId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loja não encontrada</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Painel de Produtos */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        {/* Busca */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar produto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
            />
          </div>
        </div>

        {/* Grid de Produtos */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredProducts.map((product: any) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-white p-4 rounded-xl border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all text-left group"
              >
                <div className="w-full aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Package className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <p className="font-medium text-gray-900 text-sm truncate">{product.name}</p>
                <p className="text-blue-600 font-bold">{formatCurrency(product.base_price)}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Painel do Carrinho */}
      <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-lg">Carrinho</h2>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-gray-400 hover:text-red-500 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Itens */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <ShoppingCart className="w-12 h-12 mb-2" />
              <p>Carrinho vazio</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-medium text-sm flex-1">{item.name}</p>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-gray-400 hover:text-red-500 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-7 h-7 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 flex items-center justify-center"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="font-bold text-blue-600">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Pagamento */}
        {cart.length > 0 && (
          <div className="border-t border-gray-200 p-4 space-y-4">
            {/* Total */}
            <div className="flex justify-between items-center text-lg">
              <span className="font-medium">Total</span>
              <span className="font-bold text-blue-600">{formatCurrency(total)}</span>
            </div>

            {/* Forma de Pagamento */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition-all ${
                  paymentMethod === 'cash' 
                    ? 'border-green-500 bg-green-50 text-green-700' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Banknote className="w-5 h-5" />
                <span className="text-xs font-medium">Dinheiro</span>
              </button>
              <button
                onClick={() => setPaymentMethod('card')}
                className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition-all ${
                  paymentMethod === 'card' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span className="text-xs font-medium">Cartão</span>
              </button>
              <button
                onClick={() => setPaymentMethod('pix')}
                className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition-all ${
                  paymentMethod === 'pix' 
                    ? 'border-teal-500 bg-teal-50 text-teal-700' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Smartphone className="w-5 h-5" />
                <span className="text-xs font-medium">PIX</span>
              </button>
            </div>

            {/* Troco (apenas dinheiro) */}
            {paymentMethod === 'cash' && (
              <div className="space-y-2">
                <label className="text-sm text-gray-600">Valor recebido</label>
                <input
                  type="number"
                  value={cashReceived || ''}
                  onChange={(e) => setCashReceived(Number(e.target.value))}
                  placeholder="0,00"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none"
                />
                {cashReceived >= total && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Troco</span>
                    <span>{formatCurrency(change)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Botão Finalizar */}
            <Button
              onClick={handleCheckout}
              disabled={processing || (paymentMethod === 'cash' && cashReceived < total)}
              className="w-full h-14 text-lg bg-green-600 hover:bg-green-700"
            >
              {processing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : success ? (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Venda Concluída!
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Finalizar Venda
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
