'use client'

import { useState } from 'react'
import { Search, ShoppingCart, Plus, Minus, Trash2, CreditCard, DollarSign, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
}

export default function POSPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [selectedPayment, setSelectedPayment] = useState<'cash' | 'card' | 'pix'>('cash')

  const products = [
    { id: '1', name: 'Açaí 300ml', price: 12.00, category: 'Açaí' },
    { id: '2', name: 'Açaí 500ml', price: 18.00, category: 'Açaí' },
    { id: '3', name: 'Açaí 700ml', price: 24.00, category: 'Açaí' },
    { id: '4', name: 'Suco Natural 300ml', price: 8.00, category: 'Bebidas' },
    { id: '5', name: 'Suco Natural 500ml', price: 12.00, category: 'Bebidas' },
    { id: '6', name: 'Água Mineral', price: 3.00, category: 'Bebidas' },
  ]

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const addToCart = (product: typeof products[0]) => {
    const existing = cart.find(item => item.id === product.id)
    if (existing) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, { ...product, quantity: 1 }])
    }
  }

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQuantity = item.quantity + delta
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item
      }
      return item
    }).filter(item => item.quantity > 0))
  }

  const removeItem = (id: string) => {
    setCart(cart.filter(item => item.id !== id))
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const total = subtotal

  const handleCheckout = () => {
    alert(`Pedido finalizado!\nTotal: ${formatCurrency(total)}\nPagamento: ${selectedPayment === 'cash' ? 'Dinheiro' : selectedPayment === 'card' ? 'Cartão' : 'PIX'}`)
    setCart([])
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 shadow-lg">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold">PDV - Point of Sale</h1>
          <p className="text-blue-100 mt-1">Sistema de Vendas</p>
        </div>
      </header>

      <div className="container mx-auto p-4">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Produtos */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-lg"
              />
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="bg-white p-4 rounded-2xl shadow-md hover:shadow-xl transition-all transform hover:scale-105 text-left"
                >
                  <div className="text-sm text-gray-500 mb-1">{product.category}</div>
                  <div className="font-bold text-lg mb-2">{product.name}</div>
                  <div className="text-2xl font-bold text-blue-600">{formatCurrency(product.price)}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Carrinho e Pagamento */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold">Carrinho</h2>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                  <p>Carrinho vazio</p>
                </div>
              ) : (
                <div className="space-y-3 mb-6">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="flex-1">
                        <div className="font-semibold">{item.name}</div>
                        <div className="text-sm text-gray-600">{formatCurrency(item.price)}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-1 rounded-full bg-white hover:bg-gray-200"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-bold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-1 rounded-full bg-white hover:bg-gray-200"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded-full ml-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t-2 pt-4 mb-6">
                <div className="flex justify-between text-3xl font-bold">
                  <span>Total</span>
                  <span className="text-blue-600">{formatCurrency(total)}</span>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="font-semibold mb-2">Forma de Pagamento</div>
                <button
                  onClick={() => setSelectedPayment('cash')}
                  className={`w-full p-4 rounded-xl border-2 transition-all ${
                    selectedPayment === 'cash'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-6 h-6" />
                    <span className="font-semibold">Dinheiro</span>
                  </div>
                </button>
                <button
                  onClick={() => setSelectedPayment('card')}
                  className={`w-full p-4 rounded-xl border-2 transition-all ${
                    selectedPayment === 'card'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-6 h-6" />
                    <span className="font-semibold">Cartão</span>
                  </div>
                </button>
                <button
                  onClick={() => setSelectedPayment('pix')}
                  className={`w-full p-4 rounded-xl border-2 transition-all ${
                    selectedPayment === 'pix'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-6 h-6" />
                    <span className="font-semibold">PIX</span>
                  </div>
                </button>
              </div>

              <Button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="w-full h-14 text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                Finalizar Venda
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
