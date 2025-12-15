'use client'

import { useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { Package, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useMenu } from '../hooks/use-menu'
import { CategoryList } from './category-list'
import { ProductCard } from './product-card'
import { ProductDialog, EditProductButton } from './product-dialog'
import type { ProductWithDetails } from '../types'

interface MenuManagerProps {
  storeId: string
}

export function MenuManager({ storeId }: MenuManagerProps) {
  const params = useParams()
  const storeSlug = params.slug as string

  const { 
    catalog, 
    loading, 
    toggleProduct, 
    deleteProduct,
    activeProducts,
    inactiveProducts,
    refreshCatalog
  } = useMenu(storeId)

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showInactive, setShowInactive] = useState(false)

  // Filtrar produtos
  const filteredProducts = useMemo(() => {
    let products = showInactive ? catalog.products : activeProducts

    // Filtro por categoria
    if (selectedCategory) {
      products = products.filter(p => p.category_id === selectedCategory)
    }

    // Filtro por busca
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      products = products.filter(p => 
        p.name.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term)
      )
    }

    return products
  }, [catalog.products, activeProducts, selectedCategory, searchTerm, showInactive])

  const handleDelete = async (productId: string) => {
    if (!confirm('Tem certeza que deseja remover este produto?')) return
    await deleteProduct(productId)
  }

  if (loading) {
    return <MenuManagerSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header com Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-orange-500 to-pink-600 rounded-xl shadow-lg shadow-orange-500/25">
              <Package className="w-6 h-6 md:w-7 md:h-7 text-white" />
            </div>
            Cardápio
          </h1>
          <div className="flex items-center gap-3 mt-2 ml-14">
            <Badge variant="secondary">{activeProducts.length} ativos</Badge>
            <Badge variant="outline">{inactiveProducts.length} inativos</Badge>
            <Badge variant="outline">{catalog.categories.length} categorias</Badge>
          </div>
        </div>

        <ProductDialog
          storeId={storeId}
          storeSlug={storeSlug}
          categories={catalog.categories}
          onSuccess={refreshCatalog}
        />
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow-sm border p-4 space-y-4">
        {/* Busca e Filtro de Inativos */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant={showInactive ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowInactive(!showInactive)}
            className="whitespace-nowrap"
          >
            <Filter className="w-4 h-4 mr-2" />
            {showInactive ? 'Mostrando Inativos' : 'Mostrar Inativos'}
          </Button>
        </div>

        {/* Categorias */}
        <CategoryList
          categories={catalog.categories}
          selectedId={selectedCategory}
          onSelect={setSelectedCategory}
        />
      </div>

      {/* Lista de Produtos */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border">
          <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
            <Package className="w-10 h-10 text-slate-300" />
          </div>
          <p className="text-slate-500 font-medium text-lg">Nenhum produto encontrado</p>
          <p className="text-slate-400 text-sm mt-1">
            {searchTerm ? 'Tente outro termo de busca' : 'Adicione seu primeiro produto'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onToggle={toggleProduct}
              onDelete={handleDelete}
              storeId={storeId}
              storeSlug={storeSlug}
              categories={catalog.categories}
              onEditSuccess={refreshCatalog}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Skeleton para loading
function MenuManagerSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32 mt-2" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      {/* Filtros Skeleton */}
      <div className="bg-white rounded-2xl border p-4 space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>
      </div>

      {/* Cards Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg border p-4 flex gap-4">
            <Skeleton className="w-24 h-24 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
