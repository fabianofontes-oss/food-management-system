'use client'

import { useRouter } from 'next/navigation'
import { X, ShoppingBag, Trash2 } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useCartStore } from '../store'
import { CartItemRow } from './cart-item-row'

interface CartDrawerProps {
  primaryColor?: string
}

export function CartDrawer({ primaryColor = '#ea1d2c' }: CartDrawerProps) {
  const router = useRouter()
  const { 
    items, 
    isOpen, 
    storeSlug,
    closeCart, 
    clearCart,
    getTotalItems,
    getSubtotal 
  } = useCartStore()

  const totalItems = getTotalItems()
  const subtotal = getSubtotal()

  const formatPrice = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  const handleCheckout = () => {
    closeCart()
    if (storeSlug) {
      router.push(`/${storeSlug}/checkout`)
    }
  }

  const handleClearCart = () => {
    if (confirm('Tem certeza que deseja limpar o carrinho?')) {
      clearCart()
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        {/* Header */}
        <SheetHeader className="px-4 py-4 border-b bg-white sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: primaryColor }}
              >
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <SheetTitle className="text-left">Seu Carrinho</SheetTitle>
                <p className="text-sm text-gray-500">
                  {totalItems} {totalItems === 1 ? 'item' : 'itens'}
                </p>
              </div>
            </div>
            <button
              onClick={closeCart}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </SheetHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center mb-4 opacity-20"
                style={{ backgroundColor: primaryColor }}
              >
                <ShoppingBag className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Carrinho vazio
              </h3>
              <p className="text-sm text-gray-500 max-w-[200px]">
                Adicione itens do cardápio para começar seu pedido
              </p>
              <Button 
                onClick={closeCart}
                className="mt-6"
                style={{ backgroundColor: primaryColor }}
              >
                Ver Cardápio
              </Button>
            </div>
          ) : (
            <div className="py-2">
              {items.map((item) => (
                <CartItemRow 
                  key={item.id} 
                  item={item} 
                  primaryColor={primaryColor}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t bg-white px-4 py-4 space-y-4 sticky bottom-0">
            {/* Limpar carrinho */}
            <button
              onClick={handleClearCart}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Limpar carrinho
            </button>

            {/* Subtotal */}
            <div className="flex items-center justify-between py-2 border-t">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-xl font-bold" style={{ color: primaryColor }}>
                {formatPrice(subtotal)}
              </span>
            </div>

            {/* Botão Finalizar */}
            <Button
              onClick={handleCheckout}
              className="w-full h-12 text-base font-semibold"
              style={{ backgroundColor: primaryColor }}
            >
              Finalizar Pedido
            </Button>

            <p className="text-xs text-center text-gray-400">
              Taxa de entrega calculada no checkout
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
