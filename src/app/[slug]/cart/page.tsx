'use client'

import { useRouter } from 'next/navigation'
import { useCartStore } from '@/stores/cart-store'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Trash2, Plus, Minus, ArrowLeft } from 'lucide-react'
import Image from 'next/image'

export default function CartPage({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const { items, removeItem, updateQuantity, getSubtotal } = useCartStore()

  const subtotal = getSubtotal()
  const deliveryFee = 5.00
  const total = subtotal + deliveryFee

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block p-8 bg-gray-100 rounded-full mb-6">
            <svg className="w-24 h-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Carrinho vazio</h2>
          <p className="text-gray-600 mb-8 text-lg">Adicione produtos para continuar</p>
          <Button onClick={() => router.push(`/${params.slug}`)} className="h-12 px-8 text-lg bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800">
            Ver Cardápio
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <header className="bg-gradient-to-r from-green-600 to-green-700 text-white sticky top-0 z-10 shadow-lg">
        <div className="container mx-auto px-4 py-5 flex items-center gap-4">
          <button
            onClick={() => router.push(`/${params.slug}`)}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold">Meu Carrinho</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="space-y-4 mb-6">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl p-5 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex gap-4">
                {item.product_image && (
                  <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-green-50 to-green-100 shadow-sm">
                    <Image
                      src={item.product_image}
                      alt={item.product_name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-gray-900 mb-1">
                    {item.product_name}
                  </h3>
                  
                  {item.modifiers.length > 0 && (
                    <div className="text-sm text-gray-600 mb-2">
                      {item.modifiers.map((mod, idx) => (
                        <div key={idx}>• {mod.name}</div>
                      ))}
                    </div>
                  )}
                  
                  {item.notes && (
                    <p className="text-sm text-gray-500 italic mb-2">
                      Obs: {item.notes}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-2 rounded-full bg-gray-100 hover:bg-green-100 hover:text-green-600 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-10 text-center font-bold text-lg">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-2 rounded-full bg-gray-100 hover:bg-green-100 hover:text-green-600 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-xl text-green-600">
                        {formatCurrency(item.subtotal)}
                      </span>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg space-y-4 mb-6">
          <div className="flex justify-between text-gray-700 text-lg">
            <span>Subtotal</span>
            <span className="font-semibold">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-gray-700 text-lg">
            <span>Taxa de entrega</span>
            <span className="font-semibold">{formatCurrency(deliveryFee)}</span>
          </div>
          <div className="border-t-2 pt-4 flex justify-between font-bold text-2xl">
            <span>Total</span>
            <span className="text-green-600">{formatCurrency(total)}</span>
          </div>
        </div>

        <Button
          onClick={() => router.push(`/${params.slug}/checkout`)}
          className="w-full h-14 text-lg font-bold bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg"
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Finalizar Pedido
          </span>
        </Button>
      </main>
    </div>
  )
}
