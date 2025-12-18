'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { 
  ShoppingCart, Search, Plus, Minus, Trash2, 
  CreditCard, Banknote, Smartphone, X, Check,
  Loader2, Package, User, Hash, MessageSquare,
  Percent, DollarSign, TrendingUp, Clock, Users,
  Maximize, Minimize, Moon, Sun, LayoutGrid, List,
  Barcode, Heart, Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { useProducts } from '@/hooks/useProducts'
import { useDashboardStoreId } from '../DashboardClient'
import { supabase } from '@/lib/supabase'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  obs?: string
}

type PaymentMethod = 'cash' | 'card' | 'pix'
type DiscountType = 'percent' | 'fixed'
type LayoutType = 'grid' | 'compact'

export default function PDVPage() {
  const params = useParams()
  const slug = params.slug as string
  const storeId = useDashboardStoreId()

  // Estados principais
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [cashReceived, setCashReceived] = useState<number>(0)
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)

  // Estados de funcionalidades extras
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [tableNumber, setTableNumber] = useState('')
  const [commandNumber, setCommandNumber] = useState('')
  const [discountType, setDiscountType] = useState<DiscountType>('percent')
  const [discountValue, setDiscountValue] = useState(0)
  const [serviceFee, setServiceFee] = useState(false)
  const [tipPercent, setTipPercent] = useState(0)
  const [attendant, setAttendant] = useState('')
  const [showAttendantModal, setShowAttendantModal] = useState(true)
  const [editingItemObs, setEditingItemObs] = useState<string | null>(null)
  const [tempObs, setTempObs] = useState('')
  const [barcodeInput, setBarcodeInput] = useState('')

  // Estados de UI
  const [darkMode, setDarkMode] = useState(false)
  const [layoutType, setLayoutType] = useState<LayoutType>('grid')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showPaymentSplit, setShowPaymentSplit] = useState(false)
  const [splitPayments, setSplitPayments] = useState<{method: PaymentMethod, amount: number}[]>([])

  // Estatísticas do dia
  const [todaySales, setTodaySales] = useState(0)
  const [todayOrders, setTodayOrders] = useState(0)

  // Dados
  const { products, loading } = useProducts(storeId || '')

  // Carregar estatísticas do dia
  useEffect(() => {
    if (!storeId) return
    const loadStats = async () => {
      const today = new Date().toISOString().split('T')[0]
      const { data } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('store_id', storeId)
        .gte('created_at', `${today}T00:00:00`)
      if (data) {
        setTodayOrders(data.length)
        setTodaySales(data.reduce((sum, o) => sum + Number(o.total_amount || 0), 0))
      }
    }
    loadStats()
  }, [storeId, success])

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') { e.preventDefault(); document.getElementById('search-input')?.focus() }
      if (e.key === 'F2') { e.preventDefault(); if (cart.length > 0) handleCheckout() }
      if (e.key === 'F11') { e.preventDefault(); toggleFullscreen() }
      if (e.key === 'Escape') { setSearch(''); setSelectedCategory(null) }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [cart])

  // Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Categorias únicas
  const categories = useMemo(() => {
    if (!products) return []
    const cats = [...new Set(products.map((p: any) => p.category?.name).filter(Boolean))]
    return cats as string[]
  }, [products])

  // Produtos filtrados
  const filteredProducts = useMemo(() => {
    if (!products) return []
    return products.filter((p: any) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
      const matchCategory = !selectedCategory || p.category?.name === selectedCategory
      return p.is_active && matchSearch && matchCategory
    })
  }, [products, search, selectedCategory])

  // Cálculos do carrinho
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const discountAmount = discountType === 'percent' ? (subtotal * discountValue / 100) : discountValue
  const serviceFeeAmount = serviceFee ? subtotal * 0.10 : 0
  const tipAmount = subtotal * (tipPercent / 100)
  const total = Math.max(0, subtotal - discountAmount + serviceFeeAmount + tipAmount)
  const change = paymentMethod === 'cash' ? Math.max(0, cashReceived - total) : 0

  // Funções do carrinho
  const addToCart = (product: any) => {
    const existing = cart.find(item => item.id === product.id && !item.obs)
    if (existing) {
      setCart(cart.map(item => 
        item.id === product.id && !item.obs
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, {
        id: product.id,
        name: product.name,
        price: product.base_price,
        quantity: 1
      }])
    }
  }

  // Busca por código de barras
  const handleBarcodeSearch = () => {
    if (!barcodeInput.trim()) return
    const product = products?.find((p: any) => 
      p.id === barcodeInput || p.sku === barcodeInput || p.barcode === barcodeInput
    )
    if (product) {
      addToCart(product)
      setBarcodeInput('')
    }
  }

  const updateQuantity = (id: string, delta: number, obs?: string) => {
    setCart(cart.map(item => {
      if (item.id === id && item.obs === obs) {
        const newQty = item.quantity + delta
        return newQty > 0 ? { ...item, quantity: newQty } : item
      }
      return item
    }).filter(item => item.quantity > 0))
  }

  const removeItem = (id: string, obs?: string) => {
    setCart(cart.filter(item => !(item.id === id && item.obs === obs)))
  }

  const addObsToItem = (id: string) => {
    if (!tempObs.trim()) { setEditingItemObs(null); return }
    const item = cart.find(i => i.id === id && !i.obs)
    if (item) {
      setCart([...cart.filter(i => !(i.id === id && !i.obs)), { ...item, obs: tempObs }])
    }
    setTempObs('')
    setEditingItemObs(null)
  }

  const clearCart = () => {
    setCart([])
    setCashReceived(0)
    setDiscountValue(0)
    setServiceFee(false)
    setTipPercent(0)
    setCustomerName('')
    setCustomerPhone('')
    setTableNumber('')
    setCommandNumber('')
    setSplitPayments([])
  }

  // Finalizar venda
  const handleCheckout = async () => {
    if (cart.length === 0 || !storeId) return

    setProcessing(true)
    try {
      const orderCode = tableNumber ? `MESA-${tableNumber}` : commandNumber ? `CMD-${commandNumber}` : `PDV-${Date.now()}`
      
      const notes = [
        attendant && `Atendente: ${attendant}`,
        tableNumber && `Mesa: ${tableNumber}`,
        commandNumber && `Comanda: ${commandNumber}`,
        discountAmount > 0 && `Desconto: ${formatCurrency(discountAmount)}`,
        serviceFee && `Taxa serviço: ${formatCurrency(serviceFeeAmount)}`,
        tipPercent > 0 && `Gorjeta ${tipPercent}%: ${formatCurrency(tipAmount)}`,
      ].filter(Boolean).join(' | ')

      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          store_id: storeId,
          order_code: orderCode,
          customer_name: customerName || 'Cliente PDV',
          customer_phone: customerPhone || '',
          order_type: tableNumber ? 'dine_in' : 'counter',
          payment_method: paymentMethod === 'card' ? 'credit_card' : paymentMethod,
          subtotal: subtotal,
          discount: discountAmount,
          total_amount: total,
          status: 'confirmed',
          notes: notes || 'Venda via PDV'
        })
        .select('id')
        .single()

      if (error) throw error

      for (const item of cart) {
        await supabase.from('order_items').insert({
          order_id: order.id,
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
          notes: item.obs || null
        })
      }

      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        clearCart()
      }, 2000)

    } catch (error) {
      console.error('Erro ao criar pedido:', error)
      alert('Erro ao finalizar venda')
    } finally {
      setProcessing(false)
    }
  }

  // Classes dinâmicas para tema
  const bg = darkMode ? 'bg-gray-900' : 'bg-gray-100'
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white'
  const textColor = darkMode ? 'text-white' : 'text-gray-900'
  const mutedText = darkMode ? 'text-gray-400' : 'text-gray-500'
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-200'

  // Modal de Atendente
  if (showAttendantModal && !attendant) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${bg}`}>
        <div className={`${cardBg} rounded-2xl p-8 w-full max-w-md shadow-2xl`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${textColor}`}>Identificação</h2>
              <p className={mutedText}>Quem está no caixa?</p>
            </div>
          </div>
          <input
            type="text"
            placeholder="Seu nome"
            value={attendant}
            onChange={(e) => setAttendant(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && attendant && setShowAttendantModal(false)}
            className={`w-full p-4 rounded-xl border ${borderColor} ${cardBg} ${textColor} mb-4`}
            autoFocus
          />
          <Button
            onClick={() => attendant && setShowAttendantModal(false)}
            disabled={!attendant}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700"
          >
            Entrar no PDV
          </Button>
        </div>
      </div>
    )
  }

  if (!storeId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loja não encontrada</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${bg}`}>
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className={`h-screen flex ${bg} transition-colors`}>
      {/* Painel de Produtos */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        {/* Header com estatísticas */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Estatísticas */}
            <div className={`${cardBg} rounded-xl px-4 py-2 flex items-center gap-3`}>
              <TrendingUp className="w-5 h-5 text-green-500" />
              <div>
                <p className={`text-xs ${mutedText}`}>Vendas Hoje</p>
                <p className={`font-bold ${textColor}`}>{formatCurrency(todaySales)}</p>
              </div>
            </div>
            <div className={`${cardBg} rounded-xl px-4 py-2 flex items-center gap-3`}>
              <ShoppingCart className="w-5 h-5 text-blue-500" />
              <div>
                <p className={`text-xs ${mutedText}`}>Pedidos</p>
                <p className={`font-bold ${textColor}`}>{todayOrders}</p>
              </div>
            </div>
            <div className={`${cardBg} rounded-xl px-4 py-2 flex items-center gap-3`}>
              <User className="w-5 h-5 text-purple-500" />
              <div>
                <p className={`text-xs ${mutedText}`}>Atendente</p>
                <p className={`font-bold ${textColor}`}>{attendant}</p>
              </div>
            </div>
          </div>

          {/* Controles */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLayoutType(layoutType === 'grid' ? 'compact' : 'grid')}
              className={`p-2 rounded-lg ${cardBg} ${borderColor} border`}
              title="Alternar layout"
            >
              {layoutType === 'grid' ? <List className={`w-5 h-5 ${mutedText}`} /> : <LayoutGrid className={`w-5 h-5 ${mutedText}`} />}
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg ${cardBg} ${borderColor} border`}
              title="Alternar tema"
            >
              {darkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className={`w-5 h-5 ${mutedText}`} />}
            </button>
            <button
              onClick={toggleFullscreen}
              className={`p-2 rounded-lg ${cardBg} ${borderColor} border`}
              title="Tela cheia (F11)"
            >
              {isFullscreen ? <Minimize className={`w-5 h-5 ${mutedText}`} /> : <Maximize className={`w-5 h-5 ${mutedText}`} />}
            </button>
          </div>
        </div>

        {/* Busca e código de barras */}
        <div className="mb-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="search-input"
              type="text"
              placeholder="Buscar produto... (F1)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 ${cardBg} rounded-xl border ${borderColor} focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none ${textColor}`}
            />
          </div>
          <div className="relative w-48">
            <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Código..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleBarcodeSearch()}
              className={`w-full pl-10 pr-4 py-3 ${cardBg} rounded-xl border ${borderColor} focus:border-blue-500 outline-none ${textColor}`}
            />
          </div>
        </div>

        {/* Categorias */}
        {categories.length > 0 && (
          <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                !selectedCategory 
                  ? 'bg-blue-600 text-white' 
                  : `${cardBg} ${textColor} border ${borderColor}`
              }`}
            >
              Todos
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                  selectedCategory === cat 
                    ? 'bg-blue-600 text-white' 
                    : `${cardBg} ${textColor} border ${borderColor}`
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Grid de Produtos */}
        <div className="flex-1 overflow-y-auto">
          <div className={`grid gap-3 ${
            layoutType === 'compact' 
              ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8' 
              : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
          }`}>
            {filteredProducts.map((product: any) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className={`${cardBg} p-3 rounded-xl border ${borderColor} hover:border-blue-500 hover:shadow-md transition-all text-left group`}
              >
                {layoutType === 'grid' && (
                  <div className={`w-full aspect-square ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg mb-2 flex items-center justify-center overflow-hidden`}>
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className={`w-8 h-8 ${mutedText}`} />
                    )}
                  </div>
                )}
                <p className={`font-medium ${textColor} text-sm truncate`}>{product.name}</p>
                <p className="text-blue-500 font-bold text-sm">{formatCurrency(product.base_price)}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Atalhos */}
        <div className={`mt-4 flex items-center gap-4 text-xs ${mutedText}`}>
          <span><kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">F1</kbd> Buscar</span>
          <span><kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">F2</kbd> Finalizar</span>
          <span><kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">F11</kbd> Tela cheia</span>
          <span><kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">ESC</kbd> Limpar busca</span>
        </div>
      </div>

      {/* Painel do Carrinho */}
      <div className={`w-[420px] ${cardBg} border-l ${borderColor} flex flex-col`}>
        {/* Header */}
        <div className={`p-4 border-b ${borderColor}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              <h2 className={`font-bold text-lg ${textColor}`}>Carrinho</h2>
              <span className={`px-2 py-0.5 rounded-full text-xs ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} ${textColor}`}>
                {cart.reduce((sum, i) => sum + i.quantity, 0)} itens
              </span>
            </div>
            {cart.length > 0 && (
              <button onClick={clearCart} className="text-gray-400 hover:text-red-500 p-1">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Cliente e Mesa */}
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <User className={`absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 ${mutedText}`} />
              <input
                type="text"
                placeholder="Cliente"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className={`w-full pl-8 pr-2 py-2 text-sm rounded-lg border ${borderColor} ${cardBg} ${textColor}`}
              />
            </div>
            <div className="relative">
              <Hash className={`absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 ${mutedText}`} />
              <input
                type="text"
                placeholder="Mesa/Comanda"
                value={tableNumber || commandNumber}
                onChange={(e) => {
                  const val = e.target.value
                  if (val.match(/^\d*$/)) setTableNumber(val)
                  else setCommandNumber(val)
                }}
                className={`w-full pl-8 pr-2 py-2 text-sm rounded-lg border ${borderColor} ${cardBg} ${textColor}`}
              />
            </div>
          </div>
        </div>

        {/* Itens */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className={`h-full flex flex-col items-center justify-center ${mutedText}`}>
              <ShoppingCart className="w-12 h-12 mb-2" />
              <p>Carrinho vazio</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item, idx) => (
                <div key={`${item.id}-${idx}`} className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-3`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className={`font-medium text-sm ${textColor}`}>{item.name}</p>
                      {item.obs && <p className="text-xs text-orange-500">📝 {item.obs}</p>}
                    </div>
                    <div className="flex gap-1">
                      {!item.obs && (
                        <button
                          onClick={() => { setEditingItemObs(item.id); setTempObs('') }}
                          className={`p-1 ${mutedText} hover:text-orange-500`}
                          title="Adicionar observação"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => removeItem(item.id, item.obs)} className="text-gray-400 hover:text-red-500 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {editingItemObs === item.id && (
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Ex: Sem cebola"
                        value={tempObs}
                        onChange={(e) => setTempObs(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addObsToItem(item.id)}
                        className={`flex-1 px-2 py-1 text-sm rounded border ${borderColor} ${cardBg} ${textColor}`}
                        autoFocus
                      />
                      <button onClick={() => addObsToItem(item.id)} className="px-2 py-1 bg-orange-500 text-white rounded text-sm">OK</button>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, -1, item.obs)}
                        className={`w-7 h-7 rounded-full ${darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'} flex items-center justify-center`}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className={`w-8 text-center font-medium ${textColor}`}>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1, item.obs)}
                        className="w-7 h-7 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 flex items-center justify-center"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="font-bold text-blue-500">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Pagamento */}
        {cart.length > 0 && (
          <div className={`border-t ${borderColor} p-4 space-y-3`}>
            {/* Desconto */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDiscountType(discountType === 'percent' ? 'fixed' : 'percent')}
                className={`px-3 py-2 rounded-lg border ${borderColor} ${cardBg} ${textColor} text-sm`}
              >
                {discountType === 'percent' ? <Percent className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
              </button>
              <input
                type="number"
                placeholder="Desconto"
                value={discountValue || ''}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
                className={`flex-1 px-3 py-2 rounded-lg border ${borderColor} ${cardBg} ${textColor} text-sm`}
              />
              <button
                onClick={() => setServiceFee(!serviceFee)}
                className={`px-3 py-2 rounded-lg border text-sm ${serviceFee ? 'bg-purple-100 border-purple-500 text-purple-700' : `${borderColor} ${cardBg} ${textColor}`}`}
              >
                10%
              </button>
            </div>

            {/* Gorjeta */}
            <div className="flex items-center gap-2">
              <Heart className={`w-4 h-4 ${mutedText}`} />
              <span className={`text-sm ${mutedText}`}>Gorjeta:</span>
              {[0, 5, 10, 15].map(p => (
                <button
                  key={p}
                  onClick={() => setTipPercent(p)}
                  className={`px-2 py-1 rounded text-xs ${tipPercent === p ? 'bg-pink-100 text-pink-700 border-pink-500' : `${cardBg} ${textColor}`} border ${borderColor}`}
                >
                  {p}%
                </button>
              ))}
            </div>

            {/* Resumo */}
            <div className={`space-y-1 text-sm ${textColor}`}>
              <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
              {discountAmount > 0 && <div className="flex justify-between text-green-500"><span>Desconto</span><span>-{formatCurrency(discountAmount)}</span></div>}
              {serviceFee && <div className="flex justify-between text-purple-500"><span>Taxa 10%</span><span>+{formatCurrency(serviceFeeAmount)}</span></div>}
              {tipPercent > 0 && <div className="flex justify-between text-pink-500"><span>Gorjeta {tipPercent}%</span><span>+{formatCurrency(tipAmount)}</span></div>}
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-dashed">
                <span>Total</span><span className="text-blue-600">{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Forma de Pagamento */}
            <div className="grid grid-cols-3 gap-2">
              {(['cash', 'card', 'pix'] as PaymentMethod[]).map(method => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition-all ${
                    paymentMethod === method 
                      ? method === 'cash' ? 'border-green-500 bg-green-50 text-green-700'
                        : method === 'card' ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-teal-500 bg-teal-50 text-teal-700'
                      : `border-gray-200 ${darkMode ? 'hover:border-gray-600' : 'hover:border-gray-300'} ${textColor}`
                  }`}
                >
                  {method === 'cash' ? <Banknote className="w-5 h-5" /> : method === 'card' ? <CreditCard className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                  <span className="text-xs font-medium">{method === 'cash' ? 'Dinheiro' : method === 'card' ? 'Cartão' : 'PIX'}</span>
                </button>
              ))}
            </div>

            {/* Troco */}
            {paymentMethod === 'cash' && (
              <div className="space-y-2">
                <input
                  type="number"
                  value={cashReceived || ''}
                  onChange={(e) => setCashReceived(Number(e.target.value))}
                  placeholder="Valor recebido"
                  className={`w-full p-3 border ${borderColor} rounded-lg ${cardBg} ${textColor}`}
                />
                {cashReceived >= total && (
                  <div className="flex justify-between text-green-600 font-bold text-lg">
                    <span>Troco</span><span>{formatCurrency(change)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Botão Finalizar */}
            <Button
              onClick={handleCheckout}
              disabled={processing || (paymentMethod === 'cash' && cashReceived < total)}
              className={`w-full h-14 text-lg transition-all ${
                success 
                  ? 'bg-green-500 hover:bg-green-500' 
                  : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
              }`}
            >
              {processing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : success ? (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                  Venda Concluída!
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  Finalizar Venda (F2)
                </span>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
