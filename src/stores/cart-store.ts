import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, SelectedModifier } from '@/types/menu'

interface CartStore {
  storeSlug: string | null
  items: CartItem[]
  setStoreSlug: (slug: string) => void
  addItem: (
    productId: string,
    productName: string,
    productImage: string | null,
    unitPrice: number,
    modifiers: SelectedModifier[],
    notes?: string
  ) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  getSubtotal: () => number
  getItemCount: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      storeSlug: null,
      items: [],

      setStoreSlug: (slug) => set({ storeSlug: slug }),

      addItem: (productId, productName, productImage, unitPrice, modifiers, notes) => {
        const modifiersTotal = modifiers.reduce((sum, mod) => sum + mod.extra_price, 0)
        const itemPrice = unitPrice + modifiersTotal
        
        const newItem: CartItem = {
          id: `${productId}-${Date.now()}-${Math.random()}`,
          product_id: productId,
          product_name: productName,
          product_image: productImage,
          unit_price: unitPrice,
          quantity: 1,
          modifiers,
          notes,
          subtotal: itemPrice,
        }

        set((state) => ({
          items: [...state.items, newItem],
        }))
      },

      removeItem: (itemId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== itemId),
        }))
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId)
          return
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  quantity,
                  subtotal: (item.unit_price + item.modifiers.reduce((sum, mod) => sum + mod.extra_price, 0)) * quantity,
                }
              : item
          ),
        }))
      },

      clearCart: () => set({ items: [], storeSlug: null }),

      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.subtotal, 0)
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0)
      },
    }),
    {
      name: 'cart-storage',
    }
  )
)
