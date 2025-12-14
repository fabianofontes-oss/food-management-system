'use client'

import { useMemo, useState, useEffect } from 'react'
import { Plus, Search, Filter, Loader2, Package, Tag } from 'lucide-react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ProductCard } from './components/ProductCard'
import { ProductForm } from './components/ProductForm'
import { useProductsComplete } from '@/hooks/useProductsComplete'
import { Product, ProductFormData } from '@/types/products'
import { createClient } from '@/lib/supabase/client'

export default function ProductsPage() {
  const params = useParams()
  const slug = params.slug as string
  const supabase = useMemo(() => createClient(), [])
  const [storeId, setStoreId] = useState<string | null>(null)
  const [loadingStore, setLoadingStore] = useState(true)
  const [storeError, setStoreError] = useState('')
  
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
        setStoreError('')
        const { data, error } = await supabase
          .from('stores')
          .select('id')
          .eq('slug', slug)
          .single()

        if (error || !data) {
          setStoreError('Loja não encontrada')
          return
        }
        setStoreId(data.id)
      } catch (err) {
        console.error('Erro ao buscar loja:', err)
        setStoreError('Erro ao carregar loja')
      } finally {
        setLoadingStore(false)
      }
    }

    if (slug) {
      fetchStore()
    }
  }, [slug, supabase])

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl shadow-slate-200/50">
          <Loader2 className="w-14 h-14 text-orange-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 text-lg font-medium">Carregando produtos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50/30 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl shadow-slate-200/50">
          <div className="p-4 bg-red-100 rounded-2xl w-fit mx-auto mb-4">
            <Package className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Erro ao carregar produtos</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <Button onClick={refreshData} className="bg-gradient-to-r from-blue-600 to-indigo-600">Tentar Novamente</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-lg shadow-orange-500/25">
                <Package className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
              Produtos
            </h1>
            <p className="text-slate-500 mt-2 ml-14">
              {products.length} produto{products.length !== 1 ? 's' : ''} cadastrado{products.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowCategoryForm(!showCategoryForm)}
              variant="outline"
              className="flex items-center gap-2 border-slate-200 hover:bg-slate-100 hover:shadow-md transition-all"
            >
              <Tag className="w-4 h-4" />
              Nova Categoria
            </Button>
            <Button
              onClick={() => {
                setEditingProduct(undefined)
                setShowForm(true)
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-lg shadow-orange-500/25"
            >
              <Plus className="w-5 h-5" />
              Novo Produto
            </Button>
          </div>
        </div>

        {showCategoryForm && (
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-orange-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <div className="p-1.5 bg-orange-100 rounded-lg">
                <Tag className="w-4 h-4 text-orange-600" />
              </div>
              Nova Categoria
            </h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Nome da categoria"
                className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all"
                onKeyPress={(e) => e.key === 'Enter' && handleCreateCategory()}
              />
              <Button onClick={handleCreateCategory} disabled={!newCategoryName.trim()} className="bg-gradient-to-r from-orange-500 to-amber-600">
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

        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all appearance-none bg-white"
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

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-slate-500">Total de Produtos</div>
              <div className="p-2 bg-slate-100 rounded-xl">
                <Package className="w-5 h-5 text-slate-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-800">{products.length}</div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-slate-500">Categorias</div>
              <div className="p-2 bg-blue-100 rounded-xl">
                <Tag className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-blue-600">{categories.length}</div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-slate-500">Produtos Ativos</div>
              <div className="p-2 bg-emerald-100 rounded-xl">
                <Package className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-emerald-600">
              {products.filter(p => p.is_active).length}
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-slate-500">Estoque Baixo</div>
              <div className="p-2 bg-red-100 rounded-xl">
                <Package className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-red-600">
              {products.filter(p => p.stock_quantity <= p.min_stock && p.min_stock > 0).length}
            </div>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-16 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
              <Package className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              {searchTerm || selectedCategory ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
            </h3>
            <p className="text-slate-500 mb-6">
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
                className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-lg shadow-orange-500/25"
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