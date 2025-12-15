'use client'

import { useState, useEffect } from 'react'
import { ProductModal } from '@/components/menu/ProductModal'
import { CartButton } from '@/components/menu/CartButton'
import { useCartStore } from '@/stores/cart-store'
import { Search } from 'lucide-react'
import type { Store, Category, Product, PublicProfile, MenuTheme } from '@/types/menu'
import { PublicHeader } from './components/PublicHeader'
import { PublicFooter } from './components/PublicFooter'
import { MenuLayoutTabs } from './components/menu-layouts/MenuLayoutTabs'
import { MenuLayoutSidebar } from './components/menu-layouts/MenuLayoutSidebar'
import { MenuLayoutSections } from './components/menu-layouts/MenuLayoutSections'
import { ProductCardCompact } from './components/product-cards/ProductCardCompact'
import { ProductCardGrid } from './components/product-cards/ProductCardGrid'
import { ProductCardList } from './components/product-cards/ProductCardList'

interface MenuClientProps {
  store: Store
  categories: Category[]
  products: Product[]
  publicProfile?: PublicProfile | null
  menuTheme?: MenuTheme | null
}

export function MenuClient({ store, categories, products, publicProfile, menuTheme }: MenuClientProps) {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const setStoreSlug = useCartStore((state) => state.setStoreSlug)

  useEffect(() => {
    setStoreSlug(store.slug)
  }, [store.slug, setStoreSlug])

  function handleProductClick(productId: string) {
    setSelectedProductId(productId)
    setIsModalOpen(true)
  }

  function handleCloseModal() {
    setIsModalOpen(false)
    setSelectedProductId(null)
  }

  const primaryColor = menuTheme?.colors?.primary || '#10B981'
  const accentColor = menuTheme?.colors?.accent || '#F59E0B'
  const bgColor = menuTheme?.colors?.bg || '#F9FAFB'
  const textColor = menuTheme?.colors?.text || '#111827'
  const preset = menuTheme?.preset || 'menuA'
  const cardVariant = menuTheme?.cardVariant || 'cardA'
  const showSearch = menuTheme?.layout?.showSearch !== false

  const renderProductCard = (product: Product) => {
    const props = {
      product,
      onClick: () => handleProductClick(product.id),
    }

    switch (cardVariant) {
      case 'cardB':
        return <ProductCardGrid key={product.id} {...props} />
      case 'cardC':
        return <ProductCardList key={product.id} {...props} />
      case 'cardA':
      default:
        return <ProductCardCompact key={product.id} {...props} />
    }
  }

  const renderLayout = () => {
    const layoutProps = {
      categories,
      products,
      searchQuery,
      renderProductCard,
    }

    switch (preset) {
      case 'menuB':
        return <MenuLayoutSidebar {...layoutProps} />
      case 'menuC':
        return <MenuLayoutSections {...layoutProps} />
      case 'menuA':
      default:
        return <MenuLayoutTabs {...layoutProps} />
    }
  }

  return (
    <div 
      className="min-h-screen"
      style={{
        '--theme-primary': primaryColor,
        '--theme-accent': accentColor,
        '--theme-bg': bgColor,
        '--theme-text': textColor,
        backgroundColor: bgColor,
      } as React.CSSProperties}
    >
      <PublicHeader store={store} publicProfile={publicProfile} />

      {showSearch && (
        <div className="sticky top-[88px] bg-white shadow-md z-20 border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none"
                style={{ borderColor: searchQuery ? 'var(--theme-primary, #10B981)' : undefined }}
              />
            </div>
          </div>
        </div>
      )}

      {renderLayout()}

      <PublicFooter publicProfile={publicProfile} />

      {selectedProductId && (
        <ProductModal
          productId={selectedProductId}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}

      <CartButton storeSlug={store.slug} />
    </div>
  )
}
