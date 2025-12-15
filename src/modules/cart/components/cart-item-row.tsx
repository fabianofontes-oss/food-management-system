'use client'

import { Plus, Minus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CartItem } from '../types'
import { useCartStore } from '../store'

interface CartItemRowProps {
  item: CartItem
  primaryColor?: string
}

export function CartItemRow({ item, primaryColor = '#ea1d2c' }: CartItemRowProps) {
  const { updateQuantity, removeItem } = useCartStore()

  const handleIncrement = () => {
    updateQuantity(item.id, item.quantity + 1)
  }

  const handleDecrement = () => {
    if (item.quantity > 1) {
      updateQuantity(item.id, item.quantity - 1)
    } else {
      removeItem(item.id)
    }
  }

  const handleRemove = () => {
    removeItem(item.id)
  }

  const formatPrice = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  return (
    <div className="flex gap-3 py-3 border-b border-gray-100 last:border-0">
      {/* Imagem */}
      {item.imageUrl ? (
        <div 
          className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${item.imageUrl})` }}
        />
      ) : (
        <div 
          className="w-16 h-16 rounded-lg flex-shrink-0 flex items-center justify-center text-white font-bold text-lg"
          style={{ backgroundColor: primaryColor }}
        >
          {item.name.charAt(0).toUpperCase()}
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 text-sm line-clamp-1">
          {item.name}
        </h4>
        
        {/* Modificadores */}
        {item.modifiers.length > 0 && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
            {item.modifiers.map(m => m.name).join(', ')}
          </p>
        )}

        {/* Preço unitário */}
        <p className="text-xs text-gray-400 mt-1">
          {formatPrice(item.price + item.modifiers.reduce((s, m) => s + m.extraPrice, 0))} cada
        </p>

        {/* Controles de quantidade */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDecrement}
              className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            
            <span className="text-sm font-medium w-6 text-center">
              {item.quantity}
            </span>
            
            <button
              onClick={handleIncrement}
              className="w-7 h-7 rounded-full flex items-center justify-center text-white transition-colors hover:opacity-90"
              style={{ backgroundColor: primaryColor }}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Subtotal */}
          <span 
            className="font-semibold text-sm"
            style={{ color: primaryColor }}
          >
            {formatPrice(item.subtotal)}
          </span>
        </div>
      </div>

      {/* Botão remover */}
      <button
        onClick={handleRemove}
        className="self-start p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        title="Remover item"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}
