'use client'

import { useState, useEffect } from 'react'
import { ProductCard } from '@/components/menu/ProductCard'
import { ProductModal } from '@/components/menu/ProductModal'
import { CartButton } from '@/components/menu/CartButton'
import { useCartStore } from '@/stores/cart-store'
import type { Store, Category, Product } from '@/types/menu'

interface MenuClientProps {
  store: Store
  categories: Category[]
  products: Product[]
}

export function MenuClient({ store, categories, products }: MenuClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const setStoreSlug = useCartStore((state) => state.setStoreSlug)

  useEffect(() => {
    setStoreSlug(store.slug)
  }, [store.slug, setStoreSlug])

  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].id)
    }
  }, [categories, selectedCategory])

  const filteredProducts = selectedCategory
    ? products.filter((p) => p.category_id === selectedCategory)
    : products

  function handleProductClick(productId: string) {
    setSelectedProductId(productId)
    setIsModalOpen(true)
  }

  function handleCloseModal() {
    setIsModalOpen(false)
    setSelectedProductId(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">{store.name}</h1>
          {store.address && (
            <p className="text-sm text-gray-600 mt-1">{store.address}</p>
          )}
        </div>
      </header>

      <div className="sticky top-[73px] bg-white border-b z-20">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto py-3 scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6">
        {selectedCategory && (
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {categories.find((c) => c.id === selectedCategory)?.name}
            </h2>
            {categories.find((c) => c.id === selectedCategory)?.description && (
              <p className="text-gray-600 mt-1">
                {categories.find((c) => c.id === selectedCategory)?.description}
              </p>
            )}
          </div>
        )}

        <div className="grid gap-4">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => handleProductClick(product.id)}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Nenhum produto disponível nesta categoria</p>
            </div>
          )}
        </div>
      </main>

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
