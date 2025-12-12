'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, Image as ImageIcon, Loader2, Package, TrendingUp, DollarSign, Grid, List, Filter, X, Eye, EyeOff } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useProducts } from '@/hooks/useProducts'
import { useLanguage } from '@/lib/LanguageContext'
import { Button } from '@/components/ui/button'

export default function ProductsPage() {
  const { t, formatCurrency: formatCurrencyI18n } = useLanguage()
  const { products, loading, error, createProduct, updateProduct, deleteProduct } = useProducts()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [priceFilter, setPriceFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [productToDelete, setProductToDelete] = useState<any>(null)
  
  const [totalProducts, setTotalProducts] = useState(0)
  const [activeProducts, setActiveProducts] = useState(0)
  const [avgPrice, setAvgPrice] = useState(0)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    base_price: '',
    category_id: '',
    store_id: '',
    image_url: '',
    is_active: true
  })

  useEffect(() => {
    setTotalProducts(products.length)
    setActiveProducts(products.filter(p => p.is_active).length)
    setAvgPrice(products.length > 0 ? products.reduce((sum, p) => sum + p.base_price, 0) / products.length : 0)
  }, [products])

  const filteredProducts = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && p.is_active) ||
      (statusFilter === 'inactive' && !p.is_active)
    
    let matchPrice = true
    if (priceFilter !== 'all') {
      if (priceFilter === 'low') matchPrice = p.base_price < 20
      else if (priceFilter === 'medium') matchPrice = p.base_price >= 20 && p.base_price < 50
      else if (priceFilter === 'high') matchPrice = p.base_price >= 50
    }
    
    return matchSearch && matchStatus && matchPrice
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, {
          name: formData.name,
          description: formData.description,
          base_price: parseFloat(formData.base_price),
          image_url: formData.image_url || null,
          is_active: formData.is_active
        })
        alert('✅ Produto atualizado!')
      } else {
        await createProduct({
          name: formData.name,
          description: formData.description,
          base_price: parseFloat(formData.base_price),
          category_id: formData.category_id,
          store_id: formData.store_id,
          image_url: formData.image_url || null,
          is_active: formData.is_active
        })
        alert('✅ Produto criado!')
      }
      setShowModal(false)
      setFormData({ name: '', description: '', base_price: '', category_id: '', store_id: '', image_url: '', is_active: true })
      setEditingProduct(null)
    } catch (err) {
      alert('❌ Erro: ' + (err instanceof Error ? err.message : 'Erro desconhecido'))
    }
  }

  async function handleDelete() {
    if (!productToDelete) return
    try {
      await deleteProduct(productToDelete.id)
      alert('✅ Produto deletado!')
      setShowDeleteModal(false)
      setProductToDelete(null)
    } catch (err) {
      alert('❌ Erro ao deletar')
    }
  }

  function openEditModal(product: any) {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description || '',
      base_price: product.base_price.toString(),
      category_id: product.category_id,
      store_id: product.store_id,
      image_url: product.image_url || '',
      is_active: product.is_active
    })
    setShowModal(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Carregando produtos do Supabase...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-8 max-w-md">
          <h2 className="text-2xl font-bold text-red-900 mb-4">❌ Erro</h2>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-3">
                <Package className="w-8 h-8 md:w-10 md:h-10 text-blue-600" />
                Produtos
              </h1>
              <p className="text-gray-600 mt-1">Gestão completa de produtos</p>
            </div>
            <button
              onClick={() => {
                setEditingProduct(null)
                setShowModal(true)
              }}
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Novo Produto
            </button>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <Package className="w-6 h-6" />
                <span className="text-sm font-medium opacity-90">Total de Produtos</span>
              </div>
              <div className="text-3xl font-bold">{totalProducts}</div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 text-white shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <Eye className="w-6 h-6" />
                <span className="text-sm font-medium opacity-90">Produtos Ativos</span>
              </div>
              <div className="text-3xl font-bold">{activeProducts}</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-6 h-6" />
                <span className="text-sm font-medium opacity-90">Preço Médio</span>
              </div>
              <div className="text-3xl font-bold">{formatCurrency(avgPrice)}</div>
            </div>
          </div>
        </div>

        {/* Busca e Filtros */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              <Filter className="w-5 h-5" />
              Filtros
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-3 rounded-xl transition-colors ${viewMode === 'grid' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
                title="Visualização em Cards"
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-3 rounded-xl transition-colors ${viewMode === 'list' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
                title="Visualização em Lista"
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filtros Expandidos */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todos</option>
                  <option value="active">Ativos</option>
                  <option value="inactive">Inativos</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Faixa de Preço</label>
                <select
                  value={priceFilter}
                  onChange={(e) => setPriceFilter(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todos</option>
                  <option value="low">Até R$ 20</option>
                  <option value="medium">R$ 20 - R$ 50</option>
                  <option value="high">Acima de R$ 50</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Imagem</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Nome</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Descrição</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Preço</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{product.name}</td>
                    <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{product.description}</td>
                    <td className="px-6 py-4 font-semibold text-green-600">{formatCurrency(product.base_price)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        product.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {product.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingProduct(product)
                            setShowModal(true)
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => {
                            setProductToDelete(product)
                            setShowDeleteModal(true)
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Nenhum produto encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Produto *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                  placeholder="Ex: Açaí 500ml"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                  rows={3}
                  placeholder="Descreva o produto..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preço (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.base_price}
                  onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">URL da Imagem</label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                  placeholder="https://exemplo.com/imagem.jpg"
                />
              </div>

              {!editingProduct && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ID da Categoria *</label>
                    <input
                      type="text"
                      required
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                      placeholder="UUID da categoria"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ID da Loja *</label>
                    <input
                      type="text"
                      required
                      value={formData.store_id}
                      onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                      placeholder="UUID da loja"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 text-green-600"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  Produto ativo
                </label>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold text-lg"
                >
                  {editingProduct ? 'Atualizar Produto' : 'Criar Produto'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingProduct(null)
                    setFormData({ name: '', description: '', base_price: '', category_id: '', store_id: '', image_url: '', is_active: true })
                  }}
                  className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && productToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Confirmar Exclusão</h3>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir o produto <strong>{productToDelete.name}</strong>? 
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setProductToDelete(null)
                }}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
