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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Carrinho vazio</h2>
          <p className="text-gray-600 mb-6">Adicione produtos para continuar</p>
          <Button onClick={() => router.push(`/${params.slug}`)}>
            Ver Cardápio
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push(`/${params.slug}`)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Carrinho</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="space-y-4 mb-6">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex gap-4">
                {item.product_image && (
                  <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src={item.product_image}
                      alt={item.product_name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 mb-1">
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
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-green-600">
                        {formatCurrency(item.subtotal)}
                      </span>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm space-y-3 mb-6">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Taxa de entrega</span>
            <span>{formatCurrency(deliveryFee)}</span>
          </div>
          <div className="border-t pt-3 flex justify-between font-bold text-lg">
            <span>Total</span>
            <span className="text-green-600">{formatCurrency(total)}</span>
          </div>
        </div>

        <Button
          onClick={() => router.push(`/${params.slug}/checkout`)}
          className="w-full h-12 text-lg"
        >
          Finalizar Pedido
        </Button>
      </main>
    </div>
  )
}
