'use client'

import { ReactNode } from 'react'
import { CartDrawer } from './cart-drawer'

interface CartProviderProps {
  children: ReactNode
  primaryColor?: string
}

/**
 * Provider que inclui o CartDrawer globalmente
 * Deve ser usado no layout da loja pública
 */
export function CartProvider({ children, primaryColor }: CartProviderProps) {
  return (
    <>
      {children}
      <CartDrawer primaryColor={primaryColor} />
    </>
  )
}
