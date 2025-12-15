import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CartItem, CartState, CartActions, CartStore } from './types'

/**
 * Gera um ID único para o item baseado no productId e modifiers
 */
function generateItemId(productId: string, modifiers: CartItem['modifiers']): string {
  if (modifiers.length === 0) {
    return productId
  }
  const modifierIds = modifiers.map(m => m.id).sort().join('-')
  return `${productId}__${modifierIds}`
}

/**
 * Calcula o subtotal de um item
 */
function calculateSubtotal(price: number, quantity: number, modifiers: CartItem['modifiers']): number {
  const modifiersTotal = modifiers.reduce((sum, m) => sum + m.extraPrice, 0)
  return (price + modifiersTotal) * quantity
}

/**
 * Estado inicial do carrinho
 */
const initialState: CartState = {
  items: [],
  storeId: null,
  storeSlug: null,
  storeName: null,
  isOpen: false
}

/**
 * Store do Carrinho de Compras
 * 
 * Usa Zustand com persistência no localStorage
 * O carrinho sobrevive ao F5 e navegação entre páginas
 */
export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      // Estado inicial
      ...initialState,

      // Ações
      addItem: (item) => {
        const state = get()
        const itemId = generateItemId(item.productId, item.modifiers)
        
        // Verifica se mudou de loja (limpa carrinho se mudou)
        if (state.storeId && state.storeId !== item.productId.split('_')[0]) {
          // Mantém a loja se for o mesmo storeId
        }

        const existingIndex = state.items.findIndex(i => i.id === itemId)

        if (existingIndex >= 0) {
          // Item já existe - incrementa quantidade
          const updatedItems = [...state.items]
          const existing = updatedItems[existingIndex]
          const newQuantity = existing.quantity + item.quantity
          updatedItems[existingIndex] = {
            ...existing,
            quantity: newQuantity,
            subtotal: calculateSubtotal(existing.price, newQuantity, existing.modifiers)
          }
          set({ items: updatedItems })
        } else {
          // Item novo
          const newItem: CartItem = {
            ...item,
            id: itemId,
            subtotal: calculateSubtotal(item.price, item.quantity, item.modifiers)
          }
          set({ items: [...state.items, newItem] })
        }
      },

      removeItem: (itemId) => {
        set((state) => ({
          items: state.items.filter(item => item.id !== itemId)
        }))
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId)
          return
        }

        set((state) => ({
          items: state.items.map(item => {
            if (item.id !== itemId) return item
            return {
              ...item,
              quantity,
              subtotal: calculateSubtotal(item.price, quantity, item.modifiers)
            }
          })
        }))
      },

      clearCart: () => {
        set({ items: [], storeId: null, storeSlug: null, storeName: null })
      },

      toggleCart: () => {
        set((state) => ({ isOpen: !state.isOpen }))
      },

      openCart: () => {
        set({ isOpen: true })
      },

      closeCart: () => {
        set({ isOpen: false })
      },

      setStore: (storeId, storeSlug, storeName) => {
        const state = get()
        // Se mudou de loja, limpa o carrinho
        if (state.storeId && state.storeId !== storeId) {
          set({ 
            items: [], 
            storeId, 
            storeSlug, 
            storeName 
          })
        } else {
          set({ storeId, storeSlug, storeName })
        }
      },

      // Getters (computed values)
      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0)
      },

      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.subtotal, 0)
      }
    }),
    {
      name: 'food-cart-storage',
      storage: createJSONStorage(() => localStorage),
      // Não persiste isOpen (drawer sempre fechado ao recarregar)
      partialize: (state) => ({
        items: state.items,
        storeId: state.storeId,
        storeSlug: state.storeSlug,
        storeName: state.storeName
      })
    }
  )
)

/**
 * Hook para obter apenas os itens do carrinho (para evitar re-renders desnecessários)
 */
export const useCartItems = () => useCartStore((state) => state.items)

/**
 * Hook para obter o estado do drawer
 */
export const useCartDrawer = () => useCartStore((state) => ({
  isOpen: state.isOpen,
  toggleCart: state.toggleCart,
  closeCart: state.closeCart,
  openCart: state.openCart
}))

/**
 * Hook para ações do carrinho
 */
export const useCartActions = () => useCartStore((state) => ({
  addItem: state.addItem,
  removeItem: state.removeItem,
  updateQuantity: state.updateQuantity,
  clearCart: state.clearCart,
  setStore: state.setStore
}))
