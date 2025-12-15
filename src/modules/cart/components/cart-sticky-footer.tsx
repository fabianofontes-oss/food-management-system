'use client'

import { ShoppingBag, ChevronRight } from 'lucide-react'
import { useCartStore } from '../store'

interface CartStickyFooterProps {
  primaryColor?: string
  onCheckout?: () => void
}

/**
 * Barra de carrinho fixa no rodapé mobile
 * Mostra: "X itens - R$ XX,XX" + Botão "Finalizar"
 */
export function CartStickyFooter({ 
  primaryColor = '#10B981', 
  onCheckout 
}: CartStickyFooterProps) {
  const { items, toggleCart, getTotalItems, getSubtotal } = useCartStore()
  const totalItems = getTotalItems()
  const subtotal = getSubtotal()

  // Não exibe se carrinho vazio
  if (totalItems === 0) return null

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 shadow-2xl shadow-black/20 safe-area-bottom"
      style={{ borderTopColor: primaryColor }}
    >
      <div className="flex items-center justify-between p-4 gap-4">
        {/* Resumo do Carrinho */}
        <button
          onClick={toggleCart}
          className="flex items-center gap-3 flex-1 min-w-0"
        >
          <div 
            className="relative p-3 rounded-xl"
            style={{ backgroundColor: `${primaryColor}20` }}
          >
            <ShoppingBag className="w-6 h-6" style={{ color: primaryColor }} />
            <span 
              className="absolute -top-1 -right-1 min-w-[22px] h-[22px] flex items-center justify-center text-xs font-bold rounded-full text-white"
              style={{ backgroundColor: primaryColor }}
            >
              {totalItems > 99 ? '99+' : totalItems}
            </span>
          </div>
          <div className="text-left min-w-0">
            <p className="text-sm text-slate-500 truncate">
              {totalItems} {totalItems === 1 ? 'item' : 'itens'} no carrinho
            </p>
            <p className="font-bold text-lg text-slate-800">
              {formatCurrency(subtotal)}
            </p>
          </div>
        </button>

        {/* Botão Finalizar */}
        <button
          onClick={onCheckout || toggleCart}
          className="flex items-center gap-2 px-6 py-4 rounded-xl text-white font-bold text-base shadow-lg transition-all active:scale-95"
          style={{ 
            backgroundColor: primaryColor,
            boxShadow: `0 10px 25px -5px ${primaryColor}40`
          }}
        >
          Finalizar
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
