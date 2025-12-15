import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { MenuRepository } from '../repository'
import { 
  toggleProductStatusAction, 
  deleteProductAction,
  deleteCategoryAction 
} from '../actions'
import type { MenuCatalog, ProductWithDetails, CategoryRow } from '../types'

export function useMenu(storeId?: string) {
  const params = useParams()
  const storeSlug = params.slug as string

  const [catalog, setCatalog] = useState<MenuCatalog>({ categories: [], products: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Carrega o catálogo completo
   */
  const refreshCatalog = useCallback(async () => {
    if (!storeId) return

    try {
      setLoading(true)
      setError(null)
      const data = await MenuRepository.getCatalog(storeId)
      setCatalog(data)
    } catch (err) {
      console.error('Erro ao carregar cardápio:', err)
      setError('Erro ao carregar cardápio')
      toast.error('Erro ao carregar cardápio')
    } finally {
      setLoading(false)
    }
  }, [storeId])

  // Carrega dados iniciais
  useEffect(() => {
    if (storeId) {
      refreshCatalog()
    }
  }, [storeId, refreshCatalog])

  /**
   * Toggle status do produto (Optimistic UI)
   */
  const toggleProduct = async (productId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus

    // Optimistic Update - Atualiza UI imediatamente
    setCatalog(prev => ({
      ...prev,
      products: prev.products.map(p => 
        p.id === productId ? { ...p, is_active: newStatus } : p
      )
    }))

    try {
      const result = await toggleProductStatusAction(storeSlug, productId, newStatus)
      
      if (!result.success) {
        throw new Error(result.error)
      }

      toast.success(newStatus ? 'Produto ativado' : 'Produto desativado')
    } catch (err) {
      // Rollback em caso de erro
      setCatalog(prev => ({
        ...prev,
        products: prev.products.map(p => 
          p.id === productId ? { ...p, is_active: currentStatus } : p
        )
      }))
      toast.error('Erro ao alterar status do produto')
    }
  }

  /**
   * Deleta um produto (Optimistic UI)
   */
  const deleteProduct = async (productId: string) => {
    // Guarda produto para possível rollback
    const deletedProduct = catalog.products.find(p => p.id === productId)
    
    // Optimistic Update
    setCatalog(prev => ({
      ...prev,
      products: prev.products.filter(p => p.id !== productId)
    }))

    try {
      const result = await deleteProductAction(storeSlug, productId)
      
      if (!result.success) {
        throw new Error(result.error)
      }

      toast.success('Produto removido')
    } catch (err) {
      // Rollback
      if (deletedProduct) {
        setCatalog(prev => ({
          ...prev,
          products: [...prev.products, deletedProduct]
        }))
      }
      toast.error('Erro ao remover produto')
    }
  }

  /**
   * Deleta uma categoria (Optimistic UI)
   */
  const deleteCategory = async (categoryId: string) => {
    // Verifica se tem produtos na categoria
    const productsInCategory = catalog.products.filter(p => p.category_id === categoryId)
    if (productsInCategory.length > 0) {
      toast.error('Remova os produtos da categoria antes de deletá-la')
      return
    }

    // Guarda categoria para rollback
    const deletedCategory = catalog.categories.find(c => c.id === categoryId)

    // Optimistic Update
    setCatalog(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c.id !== categoryId)
    }))

    try {
      const result = await deleteCategoryAction(storeSlug, categoryId)
      
      if (!result.success) {
        throw new Error(result.error)
      }

      toast.success('Categoria removida')
    } catch (err) {
      // Rollback
      if (deletedCategory) {
        setCatalog(prev => ({
          ...prev,
          categories: [...prev.categories, deletedCategory]
        }))
      }
      toast.error('Erro ao remover categoria')
    }
  }

  // Helpers computados
  const activeProducts = catalog.products.filter(p => p.is_active)
  const inactiveProducts = catalog.products.filter(p => !p.is_active)
  
  const getProductsByCategory = (categoryId: string) => 
    catalog.products.filter(p => p.category_id === categoryId)

  return {
    // Estado
    catalog,
    categories: catalog.categories,
    products: catalog.products,
    loading,
    error,

    // Computed
    activeProducts,
    inactiveProducts,
    getProductsByCategory,

    // Actions
    refreshCatalog,
    toggleProduct,
    deleteProduct,
    deleteCategory
  }
}
