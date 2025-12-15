/**
 * Tipos do módulo Cart (Carrinho de Compras)
 */

/**
 * Modificador selecionado para um item do carrinho
 */
export interface CartItemModifier {
  id: string
  name: string
  extraPrice: number
}

/**
 * Item do carrinho de compras
 */
export interface CartItem {
  /** ID único do item no carrinho (pode ser productId + hash dos modifiers) */
  id: string
  /** ID do produto */
  productId: string
  /** Nome do produto */
  name: string
  /** Preço unitário base */
  price: number
  /** Quantidade */
  quantity: number
  /** Modificadores selecionados */
  modifiers: CartItemModifier[]
  /** Subtotal calculado (price + modifiers) * quantity */
  subtotal: number
  /** URL da imagem do produto */
  imageUrl?: string | null
}

/**
 * Estado do carrinho
 */
export interface CartState {
  /** Itens no carrinho */
  items: CartItem[]
  /** ID da loja atual (para evitar mistura de lojas) */
  storeId: string | null
  /** Slug da loja (para redirecionamento) */
  storeSlug: string | null
  /** Nome da loja */
  storeName: string | null
  /** Se o drawer está aberto */
  isOpen: boolean
}

/**
 * Ações do carrinho
 */
export interface CartActions {
  /** Adiciona item ao carrinho (incrementa se já existir) */
  addItem: (item: Omit<CartItem, 'id' | 'subtotal'>) => void
  /** Remove item do carrinho */
  removeItem: (itemId: string) => void
  /** Atualiza quantidade de um item */
  updateQuantity: (itemId: string, quantity: number) => void
  /** Limpa o carrinho */
  clearCart: () => void
  /** Abre/fecha o drawer */
  toggleCart: () => void
  /** Define a loja atual */
  setStore: (storeId: string, storeSlug: string, storeName: string) => void
  /** Fecha o drawer */
  closeCart: () => void
  /** Abre o drawer */
  openCart: () => void
}

/**
 * Store completa do carrinho
 */
export type CartStore = CartState & CartActions & {
  /** Retorna total de itens */
  getTotalItems: () => number
  /** Retorna subtotal */
  getSubtotal: () => number
}
