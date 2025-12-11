'use client'

import { ShoppingCart } from 'lucide-react'
import { useCartStore } from '@/stores/cart-store'
import { formatCurrency } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface CartButtonProps {
  storeSlug: string
}

export function CartButton({ storeSlug }: CartButtonProps) {
  const router = useRouter()
  const itemCount = useCartStore((state) => state.getItemCount())
  const subtotal = useCartStore((state) => state.getSubtotal())

  if (itemCount === 0) return null

  return (
    <button
      onClick={() => router.push(`/${storeSlug}/cart`)}
      className="fixed bottom-6 right-6 bg-green-600 text-white px-6 py-4 rounded-full shadow-lg hover:bg-green-700 transition-colors flex items-center gap-3 z-40"
    >
      <div className="relative">
        <ShoppingCart className="w-6 h-6" />
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
          {itemCount}
        </span>
      </div>
      <div className="text-left">
        <div className="text-xs opacity-90">Ver carrinho</div>
        <div className="font-bold">{formatCurrency(subtotal)}</div>
      </div>
    </button>
  )
}
