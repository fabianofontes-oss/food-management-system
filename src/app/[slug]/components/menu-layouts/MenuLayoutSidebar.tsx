'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import type { Category, Product } from '@/types/menu'

interface MenuLayoutSidebarProps {
  categories: Category[]
  products: Product[]
  searchQuery: string
  renderProductCard: (product: Product) => React.ReactNode
}

export function MenuLayoutSidebar({ categories, products, searchQuery, renderProductCard }: MenuLayoutSidebarProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory ? p.category_id === selectedCategory : true
    const matchesSearch = searchQuery
      ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      : true
    return matchesCategory && matchesSearch && p.is_active
  })

  const CategoryList = () => (
    <nav className="space-y-2">
      <button
        onClick={() => {
          setSelectedCategory(null)
          setDrawerOpen(false)
        }}
        className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
          selectedCategory === null
            ? 'text-white shadow-md'
            : 'bg-gray-100 hover:bg-gray-200'
        }`}
        style={{
          backgroundColor: selectedCategory === null ? 'var(--theme-primary, #10B981)' : undefined,
        }}
      >
        Todos os Produtos
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => {
            setSelectedCategory(category.id)
            setDrawerOpen(false)
          }}
          className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
            selectedCategory === category.id
              ? 'text-white shadow-md'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
          style={{
            backgroundColor: selectedCategory === category.id ? 'var(--theme-primary, #10B981)' : undefined,
          }}
        >
          <div>{category.name}</div>
          {category.description && (
            <div className="text-xs opacity-80 mt-1">{category.description}</div>
          )}
        </button>
      ))}
    </nav>
  )

  return (
    <div className="flex">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:block w-64 flex-shrink-0 p-6 border-r bg-gray-50">
        <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--theme-text, #111827)' }}>
          Categorias
        </h2>
        <CategoryList />
      </aside>

      {/* Botão Mobile Menu */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="lg:hidden fixed bottom-6 left-6 z-30 p-4 rounded-full shadow-lg text-white"
        style={{ backgroundColor: 'var(--theme-primary, #10B981)' }}
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Drawer Mobile */}
      {drawerOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="lg:hidden fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white z-50 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: 'var(--theme-text, #111827)' }}>
                Categorias
              </h2>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <CategoryList />
          </div>
        </>
      )}

      {/* Conteúdo Principal */}
      <main className="flex-1 p-6">
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

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
