'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PDVSettings, DEFAULT_PDV_SETTINGS } from '@/types/settings'
import { formatCurrency } from '@/lib/utils'
import { useProducts, Product } from '@/hooks/useProducts'
import {
  ShoppingCart, Plus, Minus, Trash2, CreditCard, DollarSign, Smartphone,
  Loader2, Search, Settings, X, Package, User, Percent, Calculator,
  Clock, TrendingUp, Receipt, Printer, Grid3x3, List, LayoutGrid
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  subtotal: number
}

export default function POSNewPage() {
  const params = useParams()
  const slug = params.slug as string
  const supabase = useMemo(() => createClient(), [])

  // Estados principais
  const { products, loading: productsLoading } = useProducts()
  const [storeId, setStoreId] = useState<string | null>(null)
  const [pdvConfig, setPdvConfig] = useState<PDVSettings>(DEFAULT_PDV_SETTINGS)
  const [configLoading, setConfigLoading] = useState(true)

  // Estados do carrinho
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Estados de pagamento
  const [selectedPayment, setSelectedPayment] = useState<'money' | 'debit' | 'credit' | 'pix'>('money')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [discount, setDiscount] = useState(0)
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent')

  // Estados de cliente
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')

  // Estados de UI
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [processingOrder, setProcessingOrder] = useState(false)

  // Carregar configurações da loja
  useEffect(() => {
    async function loadConfig() {
      const { data: store } = await supabase
        .from('stores')
        .select('id, settings')
        .eq('slug', slug)
        .single()

      if (store) {
        setStoreId(store.id)
        const config = store.settings?.sales?.pdv || store.settings?.pdv || {}
        setPdvConfig({ ...DEFAULT_PDV_SETTINGS, ...config })
        setSelectedPayment(config.defaultPayment || 'money')
      }
      setConfigLoading(false)
    }
    loadConfig()
  }, [slug, supabase])

  // Usar todos os produtos (mesmo padrão do PDV antigo)
  const storeProducts = products
  const categories = useMemo(() => {
    const cats = new Set(storeProducts.map(p => p.category_id).filter(Boolean))
    return ['all', ...Array.from(cats)]
  }, [storeProducts])

  const filteredProducts = storeProducts.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchCategory = selectedCategory === 'all' || p.category_id === selectedCategory
    return matchSearch && matchCategory
  })

  // Funções do carrinho
  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.id === product.id)
    if (existing) {
      updateQuantity(product.id, existing.quantity + 1)
    } else {
      const newItem: CartItem = {
        id: product.id,
        name: product.name,
        price: product.base_price,
        quantity: 1,
        subtotal: product.base_price
      }
      setCart([...cart, newItem])
    }
  }

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(id)
      return
    }
    setCart(cart.map(item =>
      item.id === id
        ? { ...item, quantity: newQuantity, subtotal: item.price * newQuantity }
        : item
    ))
  }

  const removeItem = (id: string) => {
    setCart(cart.filter(item => item.id !== id))
  }

  const clearCart = () => {
    setCart([])
    setDiscount(0)
    setCustomerName('')
    setCustomerPhone('')
    setPaymentAmount('')
  }

  // Cálculos
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0)
  const discountAmount = discountType === 'percent'
    ? (subtotal * discount) / 100
    : discount
  const total = Math.max(0, subtotal - discountAmount)
  const change = paymentAmount ? Math.max(0, parseFloat(paymentAmount) - total) : 0

  // Finalizar pedido
  const handleCheckout = async () => {
    if (cart.length === 0) return
    if (pdvConfig.requireCustomer && !customerName) {
      alert('Nome do cliente é obrigatório')
      return
    }

    setProcessingOrder(true)
    try {
      const { error } = await supabase.from('orders').insert({
        store_id: storeId,
        customer_name: customerName || 'Cliente',
        customer_phone: customerPhone,
        items: cart,
        subtotal,
        discount: discountAmount,
        total,
        payment_method: selectedPayment,
        status: 'completed',
        type: 'pos'
      })

      if (error) throw error

      if (pdvConfig.autoPrint) {
        console.log('Imprimindo cupom...')
      }

      alert('Pedido finalizado com sucesso!')
      clearCart()
      setShowPaymentModal(false)
    } catch (err) {
      console.error('Erro ao finalizar pedido:', err)
      alert('Erro ao finalizar pedido')
    } finally {
      setProcessingOrder(false)
    }
  }

  // Loading
  if (productsLoading || configLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${pdvConfig.theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: pdvConfig.primaryColor }} />
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${pdvConfig.theme === 'dark' ? 'bg-slate-900' : 'bg-gradient-to-br from-slate-50 via-white to-blue-50/30'}`}>
      {/* Header */}
      <div className={`sticky top-0 z-20 px-4 py-3 border-b ${pdvConfig.theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} shadow-sm`}>
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl shadow-lg" style={{ backgroundColor: pdvConfig.primaryColor }}>
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${pdvConfig.theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                PDV - Ponto de Venda
              </h1>
              <p className={`text-sm ${pdvConfig.theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                {storeProducts.length} produtos disponíveis • {cart.length} no carrinho
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Estatísticas rápidas */}
            <div className={`hidden lg:flex items-center gap-4 px-4 py-2 rounded-lg ${pdvConfig.theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'}`}>
              <div className="flex items-center gap-2">
                <Clock className={`w-4 h-4 ${pdvConfig.theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} />
                <span className={`text-sm font-medium ${pdvConfig.theme === 'dark' ? 'text-white' : 'text-slate-700'}`}>
                  {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            <Link href={`/${slug}/dashboard/settings/pdv`}>
              <button className={`p-2.5 rounded-lg transition-all ${pdvConfig.theme === 'dark' ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                <Settings className="w-5 h-5" />
              </button>
            </Link>

            <button
              onClick={clearCart}
              disabled={cart.length === 0}
              className={`p-2.5 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed ${pdvConfig.theme === 'dark' ? 'bg-red-900/50 text-red-400 hover:bg-red-900/70' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto p-4">
        <div className="grid lg:grid-cols-[1fr_420px] gap-6">
          {/* Coluna de Produtos */}
          <div className="space-y-4">
            {/* Busca e Filtros */}
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${pdvConfig.theme === 'dark' ? 'text-slate-400' : 'text-slate-400'}`} />
                <input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border ${pdvConfig.theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200 placeholder-slate-400'} focus:outline-none focus:ring-2`}
                  style={{ '--tw-ring-color': pdvConfig.primaryColor } as any}
                />
              </div>

              {/* Seletor de Layout */}
              <div className={`flex items-center gap-1 p-1 rounded-lg ${pdvConfig.theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`}>
                <button
                  onClick={() => setPdvConfig({ ...pdvConfig, layout: 'grid' })}
                  className={`p-2 rounded ${pdvConfig.layout === 'grid' ? 'bg-white shadow' : ''}`}
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPdvConfig({ ...pdvConfig, layout: 'list' })}
                  className={`p-2 rounded ${pdvConfig.layout === 'list' ? 'bg-white shadow' : ''}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Grid de Produtos */}
            {filteredProducts.length === 0 ? (
              <div className={`text-center py-20 ${pdvConfig.theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                <Package className="w-20 h-20 mx-auto mb-4 opacity-30" />
                <p className="text-xl font-medium mb-2">Nenhum produto encontrado</p>
                <p className="text-sm mb-4">
                  {storeProducts.length === 0
                    ? 'Adicione produtos para começar a vender'
                    : 'Tente buscar por outro termo'}
                </p>
                {storeProducts.length === 0 && (
                  <Link href={`/${slug}/dashboard/products`}>
                    <Button style={{ backgroundColor: pdvConfig.primaryColor }}>
                      Adicionar Produtos
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className={`grid gap-3 ${
                pdvConfig.layout === 'list' ? 'grid-cols-1' :
                pdvConfig.layout === 'compact' ? 'grid-cols-4' :
                'grid-cols-3'
              }`}>
                {filteredProducts.map(product => (
                  <div
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className={`cursor-pointer rounded-xl border overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] ${
                      pdvConfig.theme === 'dark' ? 'bg-slate-800 border-slate-700 hover:border-slate-500' : 'bg-white border-slate-200 hover:border-blue-300'
                    } ${pdvConfig.layout === 'list' ? 'flex items-center p-3' : 'p-4'}`}
                    style={{
                      minHeight: pdvConfig.productSize === 'small' ? 80 : pdvConfig.productSize === 'large' ? 140 : 110
                    }}
                  >
                    {pdvConfig.showImages && product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className={`object-cover rounded-lg ${pdvConfig.layout === 'list' ? 'w-16 h-16 mr-3' : 'w-full h-20 mb-2'}`}
                      />
                    )}
                    <div className={pdvConfig.layout === 'list' ? 'flex-1' : ''}>
                      <p className={`font-medium ${pdvConfig.theme === 'dark' ? 'text-white' : 'text-slate-800'} ${
                        pdvConfig.fontSize === 'small' ? 'text-sm' : pdvConfig.fontSize === 'large' ? 'text-lg' : ''
                      }`}>
                        {product.name}
                      </p>
                      <p className="font-bold text-lg" style={{ color: pdvConfig.primaryColor }}>
                        {formatCurrency(product.base_price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Coluna do Carrinho */}
          <div className="space-y-4">
            {/* Card do Carrinho */}
            <div className={`rounded-xl border ${pdvConfig.theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} shadow-lg`}>
              <div className={`px-4 py-3 border-b ${pdvConfig.theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <h2 className={`font-bold text-lg ${pdvConfig.theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                    Carrinho
                  </h2>
                  <span className={`text-sm ${pdvConfig.theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    {cart.length} {cart.length === 1 ? 'item' : 'itens'}
                  </span>
                </div>
              </div>

              {/* Itens do Carrinho */}
              <div className="p-4">
                {cart.length === 0 ? (
                  <div className={`text-center py-8 ${pdvConfig.theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Carrinho vazio</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {cart.map(item => (
                      <div
                        key={item.id}
                        className={`flex items-center gap-3 p-3 rounded-lg ${pdvConfig.theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-50'}`}
                      >
                        <div className="flex-1">
                          <p className={`font-medium ${pdvConfig.theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                            {item.name}
                          </p>
                          <p className="text-sm" style={{ color: pdvConfig.primaryColor }}>
                            {formatCurrency(item.price)} × {item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className={`p-1.5 rounded ${pdvConfig.theme === 'dark' ? 'bg-slate-600 hover:bg-slate-500' : 'bg-white hover:bg-slate-100'}`}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className={`w-8 text-center font-medium ${pdvConfig.theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className={`p-1.5 rounded ${pdvConfig.theme === 'dark' ? 'bg-slate-600 hover:bg-slate-500' : 'bg-white hover:bg-slate-100'}`}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className={`font-bold ${pdvConfig.theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                          {formatCurrency(item.subtotal)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Cliente */}
                {cart.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <input
                      type="text"
                      placeholder="Nome do cliente"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border ${pdvConfig.theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200'}`}
                    />
                    <input
                      type="tel"
                      placeholder="Telefone (opcional)"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border ${pdvConfig.theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200'}`}
                    />
                  </div>
                )}

                {/* Desconto */}
                {cart.length > 0 && pdvConfig.discountEnabled && (
                  <div className="mt-4 space-y-2">
                    <label className={`text-sm font-medium ${pdvConfig.theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                      Desconto
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={discount}
                        onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                        max={discountType === 'percent' ? pdvConfig.maxDiscount : subtotal}
                        className={`flex-1 px-3 py-2 rounded-lg border ${pdvConfig.theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200'}`}
                      />
                      <select
                        value={discountType}
                        onChange={e => setDiscountType(e.target.value as 'percent' | 'fixed')}
                        className={`px-3 py-2 rounded-lg border ${pdvConfig.theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200'}`}
                      >
                        <option value="percent">%</option>
                        <option value="fixed">R$</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Totais */}
                {cart.length > 0 && (
                  <div className={`mt-4 pt-4 border-t space-y-2 ${pdvConfig.theme === 'dark' ? 'border-slate-600' : 'border-slate-200'}`}>
                    <div className="flex justify-between text-sm">
                      <span className={pdvConfig.theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>Subtotal</span>
                      <span className={pdvConfig.theme === 'dark' ? 'text-white' : 'text-slate-800'}>{formatCurrency(subtotal)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-red-500">Desconto</span>
                        <span className="text-red-500">-{formatCurrency(discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xl font-bold pt-2">
                      <span className={pdvConfig.theme === 'dark' ? 'text-white' : 'text-slate-800'}>Total</span>
                      <span style={{ color: pdvConfig.primaryColor }}>{formatCurrency(total)}</span>
                    </div>
                  </div>
                )}

                {/* Formas de Pagamento */}
                {cart.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <label className={`text-sm font-medium ${pdvConfig.theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                      Forma de Pagamento
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'money', label: 'Dinheiro', icon: '💵' },
                        { id: 'debit', label: 'Débito', icon: '💳' },
                        { id: 'credit', label: 'Crédito', icon: '💳' },
                        { id: 'pix', label: 'PIX', icon: '📱' },
                      ].map(pm => (
                        <button
                          key={pm.id}
                          onClick={() => setSelectedPayment(pm.id as any)}
                          className={`p-3 rounded-lg text-center transition-all ${
                            selectedPayment === pm.id
                              ? 'text-white shadow-lg'
                              : pdvConfig.theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
                          }`}
                          style={selectedPayment === pm.id ? { backgroundColor: pdvConfig.primaryColor } : {}}
                        >
                          <div className="text-2xl mb-1">{pm.icon}</div>
                          <div className="text-xs font-medium">{pm.label}</div>
                        </button>
                      ))}
                    </div>

                    {/* Valor Recebido e Troco */}
                    {selectedPayment === 'money' && pdvConfig.calculateChange && (
                      <div className="space-y-2">
                        <input
                          type="number"
                          placeholder="Valor recebido"
                          value={paymentAmount}
                          onChange={e => setPaymentAmount(e.target.value)}
                          className={`w-full px-3 py-2 rounded-lg border ${pdvConfig.theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200'}`}
                        />
                        {change > 0 && (
                          <div className={`p-3 rounded-lg ${pdvConfig.theme === 'dark' ? 'bg-green-900/30' : 'bg-green-50'}`}>
                            <div className="flex justify-between items-center">
                              <span className={`text-sm font-medium ${pdvConfig.theme === 'dark' ? 'text-green-400' : 'text-green-700'}`}>
                                Troco
                              </span>
                              <span className={`text-lg font-bold ${pdvConfig.theme === 'dark' ? 'text-green-400' : 'text-green-700'}`}>
                                {formatCurrency(change)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Botão Finalizar */}
                {cart.length > 0 && (
                  <Button
                    onClick={handleCheckout}
                    disabled={processingOrder}
                    className="w-full mt-4 py-6 text-lg font-bold"
                    style={{ backgroundColor: pdvConfig.primaryColor }}
                  >
                    {processingOrder ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Receipt className="w-5 h-5 mr-2" />
                        Finalizar Pedido
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
