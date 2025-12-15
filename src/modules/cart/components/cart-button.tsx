'use client'

import { ShoppingCart } from 'lucide-react'
import { useCartStore } from '../store'

interface CartButtonProps {
  primaryColor?: string
  className?: string
}

/**
 * Botão de carrinho com badge mostrando quantidade de itens
 * Deve ser usado no header da loja pública
 */
export function CartButton({ primaryColor = '#ea1d2c', className = '' }: CartButtonProps) {
  const { toggleCart, getTotalItems } = useCartStore()
  const totalItems = getTotalItems()

  return (
    <button
      onClick={toggleCart}
      className={`relative p-2 rounded-full transition-all hover:scale-105 ${className}`}
      style={{ 
        backgroundColor: primaryColor,
        color: '#ffffff'
      }}
      aria-label={`Carrinho com ${totalItems} itens`}
    >
      <ShoppingCart className="w-5 h-5" />
      
      {/* Badge */}
      {totalItems > 0 && (
        <span 
          className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center text-xs font-bold rounded-full px-1"
          style={{ 
            backgroundColor: '#ffffff',
            color: primaryColor
          }}
        >
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </button>
  )
}
