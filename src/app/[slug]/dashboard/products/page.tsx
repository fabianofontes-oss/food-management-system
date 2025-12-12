'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Loader2, Package, Tag } from 'lucide-react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ProductCard } from './components/ProductCard'
import { ProductForm } from './components/ProductForm'
import { useProductsComplete } from '@/hooks/useProductsComplete'
import { Product, ProductFormData } from '@/types/products'
import { supabase } from '@/lib/supabase'

export default function ProductsPage() {
  const params = useParams()
  const slug = params.slug as string
  const [storeId, setStoreId] = useState<string | null>(null)
  const [loadingStore, setLoadingStore] = useState(true)
  
  const { products, categories, units, loading, error, createProduct, updateProduct, deleteProduct, createCategory, refreshData } = useProductsComplete(storeId)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | undefined>()
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')

  useEffect(() => {
    async function fetchStore() {
      try {
        const { data, error } = await supabase
          .from('stores')
          .select('id')
          .eq('slug', slug)
          .single()

        if (error) throw error
        setStoreId(data.id)
      } catch (err) {
        console.error('Erro ao buscar loja:', err)
      } finally {
        setLoadingStore(false)
      }
    }

    if (slug) {
      fetchStore()
    }
  }, [slug])

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || product.category_id === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleCreateProduct = async (data: ProductFormData) => {
    await createProduct(data)
    setShowForm(false)
  }

  const handleUpdateProduct = async (data: ProductFormData) => {
    if (editingProduct) {
      await updateProduct(editingProduct.id, data)
      setShowForm(false)
      setEditingProduct(undefined)
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingProduct(undefined)
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return
    
    try {
      await createCategory({
        name: newCategoryName,
        sort_order: categories.length,
        is_active: true
      })
      setNewCategoryName('')
      setShowCategoryForm(false)
    } catch (err) {
      console.error('Erro ao criar categoria:', err)
      alert('Erro ao criar categoria')
    }
  }

  if (loadingStore || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Carregando produtos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erro ao carregar produtos</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={refreshData}>Tentar Novamente</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
              <Package className="w-10 h-10 text-blue-600" />
              Produtos
            </h1>
            <p className="text-gray-600 mt-1">
              {products.length} produto{products.length !== 1 ? 's' : ''} cadastrado{products.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowCategoryForm(!showCategoryForm)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Tag className="w-4 h-4" />
              Nova Categoria
            </Button>
            <Button
              onClick={() => {
                setEditingProduct(undefined)
                setShowForm(true)
              }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              Novo Produto
            </Button>
          </div>
        </div>

        {showCategoryForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Nova Categoria</h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Nome da categoria"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleCreateCategory()}
              />
              <Button onClick={handleCreateCategory} disabled={!newCategoryName.trim()}>
                Criar
              </Button>
              <Button variant="outline" onClick={() => {
                setShowCategoryForm(false)
                setNewCategoryName('')
              }}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="">Todas as categorias</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({products.filter(p => p.category_id === cat.id).length})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-gray-600 mb-1">Total de Produtos</div>
            <div className="text-3xl font-bold text-gray-900">{products.length}</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-gray-600 mb-1">Categorias</div>
            <div className="text-3xl font-bold text-blue-600">{categories.length}</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-gray-600 mb-1">Produtos Ativos</div>
            <div className="text-3xl font-bold text-green-600">
              {products.filter(p => p.is_active).length}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-gray-600 mb-1">Estoque Baixo</div>
            <div className="text-3xl font-bold text-red-600">
              {products.filter(p => p.stock_quantity <= p.min_stock && p.min_stock > 0).length}
            </div>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {searchTerm || selectedCategory ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || selectedCategory 
                ? 'Tente ajustar os filtros de busca'
                : 'Comece cadastrando seu primeiro produto'}
            </p>
            {!searchTerm && !selectedCategory && (
              <Button
                onClick={() => {
                  setEditingProduct(undefined)
                  setShowForm(true)
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-5 h-5 mr-2" />
                Criar Primeiro Produto
              </Button>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={handleEdit}
                onDelete={deleteProduct}
              />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <ProductForm
          product={editingProduct}
          categories={categories}
          units={units}
          allProducts={products}
          onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}
          onClose={handleCloseForm}
        />
      )}
    </div>
  )
}