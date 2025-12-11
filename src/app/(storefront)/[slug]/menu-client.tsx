'use client'

import { useState, useEffect } from 'react'
import { ProductCard } from '@/components/menu/ProductCard'
import { ProductModal } from '@/components/menu/ProductModal'
import { CartButton } from '@/components/menu/CartButton'
import { useCartStore } from '@/stores/cart-store'
import { Search, Grid3x3, List, Image as ImageIcon } from 'lucide-react'
import type { Store, Category, Product } from '@/types/menu'

type ViewMode = 'grid' | 'list' | 'visual'

interface MenuClientProps {
  store: Store
  categories: Category[]
  products: Product[]
}

export function MenuClient({ store, categories, products }: MenuClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const setStoreSlug = useCartStore((state) => state.setStoreSlug)

  useEffect(() => {
    setStoreSlug(store.slug)
  }, [store.slug, setStoreSlug])

  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].id)
    }
  }, [categories, selectedCategory])

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory ? p.category_id === selectedCategory : true
    const matchesSearch = searchQuery
      ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      : true
    return matchesCategory && matchesSearch
  })

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
        <div className="container mx-auto px-4 py-4 space-y-4">
          <div className="flex gap-3 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
              />
            </div>
            <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
                title="Grade"
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
                title="Lista"
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('visual')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'visual' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
                title="Visual"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-6 py-3 rounded-full whitespace-nowrap font-semibold transition-all transform hover:scale-105 ${
                selectedCategory === null
                  ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
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

        <div className={`${
          viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' :
          viewMode === 'list' ? 'space-y-4' :
          'grid grid-cols-1 md:grid-cols-2 gap-6'
        }`}>
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => handleProductClick(product.id)}
                viewMode={viewMode}
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
