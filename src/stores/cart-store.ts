import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, SelectedModifier, CartItemFlavor } from '@/types/menu'

interface CartStore {
  storeSlug: string | null
  items: CartItem[]
  couponCode: string | null
  couponDiscount: number
  setStoreSlug: (slug: string) => void
  addItem: (
    productId: string,
    productName: string,
    productImage: string | null,
    unitPrice: number,
    modifiers: SelectedModifier[],
    notes?: string,
    flavors?: CartItemFlavor[],
    isHalfHalf?: boolean
  ) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  applyCoupon: (code: string, discount: number) => void
  removeCoupon: () => void
  clearCart: () => void
  getSubtotal: () => number
  getDiscount: () => number
  getTotal: () => number
  getItemCount: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      storeSlug: null,
      items: [],
      couponCode: null,
      couponDiscount: 0,

      setStoreSlug: (slug) => {
        const currentSlug = get().storeSlug
        // Se mudar de loja, limpar o carrinho para evitar itens de lojas diferentes
        if (currentSlug && currentSlug !== slug) {
          set({ items: [], couponCode: null, couponDiscount: 0, storeSlug: slug })
        } else {
          set({ storeSlug: slug })
        }
      },

      addItem: (productId, productName, productImage, unitPrice, modifiers, notes, flavors, isHalfHalf) => {
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
          flavors,
          is_half_half: isHalfHalf,
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

      applyCoupon: (code, discount) => {
        set({ couponCode: code, couponDiscount: discount })
      },

      removeCoupon: () => {
        set({ couponCode: null, couponDiscount: 0 })
      },

      clearCart: () => set({ items: [], storeSlug: null, couponCode: null, couponDiscount: 0 }),

      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.subtotal, 0)
      },

      getDiscount: () => {
        return get().couponDiscount
      },

      getTotal: () => {
        const subtotal = get().getSubtotal()
        const discount = get().getDiscount()
        return Math.max(0, subtotal - discount)
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
