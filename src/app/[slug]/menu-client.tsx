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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <header className="bg-gradient-to-r from-green-600 to-green-700 text-white sticky top-0 z-30 shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold drop-shadow-md">{store.name}</h1>
          {store.address && (
            <p className="text-green-50 mt-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {store.address}
            </p>
          )}
        </div>
      </header>

      <div className="sticky top-[97px] bg-white shadow-md z-20">
        <div className="container mx-auto px-4">
          <div className="flex gap-3 overflow-x-auto py-4 scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-6 py-3 rounded-full whitespace-nowrap font-semibold transition-all transform hover:scale-105 ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        {selectedCategory && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {categories.find((c) => c.id === selectedCategory)?.name}
            </h2>
            {categories.find((c) => c.id === selectedCategory)?.description && (
              <p className="text-gray-600">
                {categories.find((c) => c.id === selectedCategory)?.description}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => handleProductClick(product.id)}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-16">
              <div className="inline-block p-6 bg-gray-100 rounded-full mb-4">
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-gray-500 text-lg">Nenhum produto disponível nesta categoria</p>
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
