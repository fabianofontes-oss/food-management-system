'use client'

import { useState, useEffect, useRef } from 'react'
import type { Category, Product } from '@/types/menu'

interface MenuLayoutSectionsProps {
  categories: Category[]
  products: Product[]
  searchQuery: string
  renderProductCard: (product: Product) => React.ReactNode
}

export function MenuLayoutSections({ categories, products, searchQuery, renderProductCard }: MenuLayoutSectionsProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({})

  const filteredProducts = products.filter((p) => {
    const matchesSearch = searchQuery
      ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      : true
    return matchesSearch && p.is_active
  })

  const productsByCategory = categories.map((category) => ({
    category,
    products: filteredProducts.filter((p) => p.category_id === category.id),
  })).filter((group) => group.products.length > 0)

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200

      for (const { category } of productsByCategory) {
        const section = sectionRefs.current[category.id]
        if (section) {
          const { offsetTop, offsetHeight } = section
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(category.id)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [productsByCategory])

  const scrollToSection = (categoryId: string) => {
    const section = sectionRefs.current[categoryId]
    if (section) {
      const yOffset = -120
      const y = section.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  return (
    <div>
      {/* Pills de navegação - sticky */}
      <div className="sticky top-0 bg-white shadow-md z-20 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex gap-3 overflow-x-auto scrollbar-hide">
            {productsByCategory.map(({ category }) => (
              <button
                key={category.id}
                onClick={() => scrollToSection(category.id)}
                className={`px-5 py-2 rounded-full whitespace-nowrap font-medium transition-all ${
                  activeSection === category.id
                    ? 'text-white shadow-md'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
                style={{
                  backgroundColor: activeSection === category.id ? 'var(--theme-primary, #10B981)' : undefined,
                }}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Seções de produtos */}
      <main className="container mx-auto px-4 py-8">
        {productsByCategory.length > 0 ? (
          productsByCategory.map(({ category, products: categoryProducts }) => (
            <section
              key={category.id}
              ref={(el) => {
                sectionRefs.current[category.id] = el
              }}
              className="mb-12 scroll-mt-32"
            >
              <div className="mb-6">
                <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--theme-text, #111827)' }}>
                  {category.name}
                </h2>
                {category.description && (
                  <p className="text-gray-600 text-lg">{category.description}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryProducts.map((product) => renderProductCard(product))}
              </div>
            </section>
          ))
        ) : (
          <div className="text-center py-16">
            <div className="inline-block p-6 bg-gray-100 rounded-full mb-4">
              <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-gray-500 text-lg">Nenhum produto disponível</p>
          </div>
        )}
      </main>
    </div>
  )
}
