'use client'

import { useState } from 'react'
import type { Category, Product } from '@/types/menu'

interface MenuLayoutTabsProps {
  categories: Category[]
  products: Product[]
  searchQuery: string
  renderProductCard: (product: Product) => React.ReactNode
}

export function MenuLayoutTabs({ categories, products, searchQuery, renderProductCard }: MenuLayoutTabsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory ? p.category_id === selectedCategory : true
    const matchesSearch = searchQuery
      ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      : true
    return matchesCategory && matchesSearch && p.is_active
  })

  return (
    <div>
      {/* Tabs de categorias - sticky */}
      <div className="sticky top-0 bg-white shadow-md z-20 border-b">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide py-4">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-6 py-3 rounded-full whitespace-nowrap font-semibold transition-all transform hover:scale-105 ${
                selectedCategory === null
                  ? 'text-white shadow-lg'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
              style={{
                backgroundColor: selectedCategory === null ? 'var(--theme-primary, #10B981)' : undefined,
              }}
            >
              Todos
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-6 py-3 rounded-full whitespace-nowrap font-semibold transition-all transform hover:scale-105 ${
                  selectedCategory === category.id
                    ? 'text-white shadow-lg'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
                style={{
                  backgroundColor: selectedCategory === category.id ? 'var(--theme-primary, #10B981)' : undefined,
                }}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Produtos */}
      <main className="container mx-auto px-4 py-8">
        {selectedCategory && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--theme-text, #111827)' }}>
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
            filteredProducts.map((product) => renderProductCard(product))
          ) : (
            <div className="col-span-full text-center py-16">
              <div className="inline-block p-6 bg-gray-100 rounded-full mb-4">
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-gray-500 text-lg">Nenhum produto disponível</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
