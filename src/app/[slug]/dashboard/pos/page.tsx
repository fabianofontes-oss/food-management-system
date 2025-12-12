'use client'

import { useState } from 'react'
import { Search, ShoppingCart, Plus, Minus, Trash2, CreditCard, DollarSign, Smartphone, Loader2, AlertCircle, Maximize, Minimize, Printer, User, Tag, TrendingUp, Clock, Package, X, Scale, Truck, Home, Barcode, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { useProducts } from '@/hooks/useProducts'
import { supabase } from '@/lib/supabase'
import { useSettings } from '@/hooks/useSettings'
import { useSettingsHelper } from '@/lib/settingsHelper'
import { useLanguage } from '@/lib/LanguageContext'
import { useEffect } from 'react'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  weight?: number // Para produtos vendidos por peso
  isByWeight?: boolean
}

export default function POSPage() {
  const { t, formatCurrency: formatCurrencyI18n } = useLanguage()
  const { products, loading } = useProducts()
  const currentStoreId = products[0]?.store_id
  const { settings } = useSettings(currentStoreId)
  const helper = useSettingsHelper(settings)
  
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedPayment, setSelectedPayment] = useState<'cash' | 'card' | 'pix'>('cash')
  const [processingOrder, setProcessingOrder] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  
  // Cliente
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  
  // Desconto
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent')
  const [discountValue, setDiscountValue] = useState(0)
  
  // Troco
  const [cashReceived, setCashReceived] = useState(0)
  
  // Fullscreen
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  // Estatísticas
  const [todaySales, setTodaySales] = useState(0)
  const [todayOrders, setTodayOrders] = useState(0)
  const [recentOrders, setRecentOrders] = useState<any[]>([])

  // Balança
  const [showWeightModal, setShowWeightModal] = useState<string | null>(null)
  const [weightInput, setWeightInput] = useState('')

  // Delivery no PDV
  const [isDeliveryOrder, setIsDeliveryOrder] = useState(false)
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryFee, setDeliveryFee] = useState(0)

  // Atendente
  const [attendantName, setAttendantName] = useState('')
  const [showAttendantModal, setShowAttendantModal] = useState(true)

  // Comandas/Mesas
  const [orderType, setOrderType] = useState<'dine_in' | 'takeout' | 'delivery'>('dine_in')
  const [tableNumber, setTableNumber] = useState('')
  const [commandNumber, setCommandNumber] = useState('')

  // Código de Barras
  const [barcodeInput, setBarcodeInput] = useState('')

  // Carregar estatísticas do dia
  useEffect(() => {
    async function loadStats() {
      if (!currentStoreId) return
      const today = new Date().toDateString()
      
      const { data } = await supabase
        .from('orders')
        .select('total_amount, created_at')
        .eq('store_id', currentStoreId)
        .gte('created_at', new Date(today).toISOString())
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (data) {
        setRecentOrders(data)
        setTodayOrders(data.length)
        setTodaySales(data.reduce((sum, o) => sum + o.total_amount, 0))
      }
    }
    loadStats()
  }, [currentStoreId, processingOrder])

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault()
        toggleFullscreen()
      }
      if (e.key === 'Escape') {
        if (isFullscreen) toggleFullscreen()
        else if (cart.length > 0) clearCart()
      }
      if (e.key === 'Enter' && cart.length > 0) {
        e.preventDefault()
        handleCheckout()
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [cart, isFullscreen])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(e => console.log('Erro fullscreen:', e))
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(e => console.log('Erro exit fullscreen:', e))
      setIsFullscreen(false)
    }
  }

  const clearCart = () => {
    if (confirm('Limpar carrinho?')) {
      setCart([])
      setCustomerName('')
      setCustomerPhone('')
      setDiscountValue(0)
      setCashReceived(0)
    }
  }

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    return matchSearch && p.is_active
  })

  const addToCart = (product: any, weight?: number) => {
    // Verificar se produto é vendido por peso
    const isByWeight = product.name.toLowerCase().includes('kg') || product.description?.toLowerCase().includes('peso')
    
    if (isByWeight && !weight) {
      // Abrir modal de peso
      setShowWeightModal(product.id)
      return
    }

    const existing = cart.find(item => item.id === product.id && !item.isByWeight)
    if (existing && !isByWeight) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      const finalPrice = isByWeight && weight ? product.base_price * weight : product.base_price
      setCart([...cart, { 
        id: product.id, 
        name: product.name, 
        price: finalPrice, 
        quantity: 1,
        weight: weight,
        isByWeight: isByWeight
      }])
    }
  }

  const addProductByWeight = (productId: string) => {
    const product = products.find(p => p.id === productId)
    if (!product || !weightInput) return
    
    const weight = parseFloat(weightInput)
    if (weight <= 0) {
      alert('Peso inválido')
      return
    }

    addToCart(product, weight)
    setShowWeightModal(null)
    setWeightInput('')
  }

  const searchByBarcode = () => {
    if (!barcodeInput.trim()) return
    
    const product = products.find(p => 
      p.id === barcodeInput || 
      p.name.toLowerCase().includes(barcodeInput.toLowerCase())
    )
    
    if (product) {
      addToCart(product)
      setBarcodeInput('')
    } else {
      alert('Produto não encontrado')
    }
  }

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQuantity = item.quantity + delta
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item
      }
      return item
    }).filter(item => item.quantity > 0))
  }

  const removeItem = (id: string) => {
    setCart(cart.filter(item => item.id !== id))
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const discountAmount = discountType === 'percent' 
    ? (subtotal * discountValue) / 100 
    : discountValue
  const finalDeliveryFee = isDeliveryOrder ? deliveryFee : 0
  const total = Math.max(0, subtotal - discountAmount + finalDeliveryFee)
  const change = selectedPayment === 'cash' ? Math.max(0, cashReceived - total) : 0

  const printReceipt = (order: any) => {
    const printWindow = window.open('', '', 'width=300,height=600')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Cupom Fiscal</title>
            <style>
              body { font-family: monospace; font-size: 12px; margin: 10px; }
              h2 { text-align: center; margin: 5px 0; }
              .line { border-top: 1px dashed #000; margin: 5px 0; }
              .total { font-size: 16px; font-weight: bold; }
            </style>
          </head>
          <body>
            <h2>CUPOM FISCAL</h2>
            <div class="line"></div>
            <p><strong>Pedido:</strong> ${order.order_code}</p>
            <p><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
            ${customerName ? `<p><strong>Cliente:</strong> ${customerName}</p>` : ''}
            <div class="line"></div>
            <h3>ITENS:</h3>
            ${cart.map(item => `
              <p>${item.quantity}x ${item.name}<br>
              ${formatCurrencyI18n(item.price)} x ${item.quantity} = ${formatCurrencyI18n(item.price * item.quantity)}</p>
            `).join('')}
            <div class="line"></div>
            <p>Subtotal: ${formatCurrencyI18n(subtotal)}</p>
            ${discountAmount > 0 ? `<p>Desconto: -${formatCurrencyI18n(discountAmount)}</p>` : ''}
            <p class="total">TOTAL: ${formatCurrencyI18n(total)}</p>
            <p><strong>Pagamento:</strong> ${selectedPayment === 'cash' ? 'Dinheiro' : selectedPayment === 'card' ? 'Cartão' : 'PIX'}</p>
            ${selectedPayment === 'cash' && cashReceived > 0 ? `
              <p>Recebido: ${formatCurrencyI18n(cashReceived)}</p>
              <p>Troco: ${formatCurrencyI18n(change)}</p>
            ` : ''}
            <div class="line"></div>
            <p style="text-align: center; margin-top: 20px;">Obrigado pela preferência!</p>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const handleCheckout = async () => {
    if (cart.length === 0) return
    
    if (!helper.isOrderValueValid(total)) {
      setValidationError(`Pedido mínimo: ${formatCurrency(helper.minimumOrderValue)}`)
      return
    }

    if (selectedPayment === 'cash' && cashReceived < total) {
      setValidationError('Valor recebido insuficiente')
      return
    }
    
    setValidationError(null)
    setProcessingOrder(true)
    try {
      const paymentMethodMap = {
        cash: 'cash' as const,
        card: 'credit_card' as const,
        pix: 'pix' as const
      }

      const storeId = products[0]?.store_id || '00000000-0000-0000-0000-000000000000'
      
      const orderCode = commandNumber || tableNumber 
        ? `${commandNumber || 'MESA-' + tableNumber}` 
        : `PDV-${Date.now()}`

      const orderNotes = [
        `Pedido via PDV`,
        attendantName ? `Atendente: ${attendantName}` : '',
        discountAmount > 0 ? `Desconto: ${formatCurrencyI18n(discountAmount)}` : '',
        tableNumber ? `Mesa: ${tableNumber}` : '',
        commandNumber ? `Comanda: ${commandNumber}` : ''
      ].filter(Boolean).join(' | ')

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          store_id: storeId,
          order_code: orderCode,
          customer_name: customerName || 'Cliente PDV',
          customer_phone: customerPhone || '00000000000',
          customer_email: 'pdv@loja.com',
          delivery_address: isDeliveryOrder ? deliveryAddress : null,
          order_type: isDeliveryOrder ? 'delivery' : orderType,
          payment_method: paymentMethodMap[selectedPayment],
          subtotal: subtotal,
          delivery_fee: finalDeliveryFee,
          discount: discountAmount,
          total_amount: total,
          status: 'confirmed',
          notes: orderNotes
        })
        .select('id')
        .single()

      if (orderError) throw orderError

      for (const item of cart) {
        await supabase.from('order_items').insert({
          order_id: order.id,
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity
        })
      }

      // Imprimir cupom
      printReceipt(order)
      
      alert(`✅ Pedido finalizado com sucesso!\nTotal: ${formatCurrencyI18n(total)}\nPagamento: ${selectedPayment === 'cash' ? 'Dinheiro' : selectedPayment === 'card' ? 'Cartão' : 'PIX'}${change > 0 ? `\nTroco: ${formatCurrencyI18n(change)}` : ''}`)
      
      // Limpar tudo
      setCart([])
      setCustomerName('')
      setCustomerPhone('')
      setDiscountValue(0)
      setCashReceived(0)
    } catch (error) {
      console.error('Erro ao criar pedido:', error)
      alert('❌ Erro ao finalizar pedido. Tente novamente.')
    } finally {
      setProcessingOrder(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Carregando produtos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header com Estatísticas e Controles */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-3">
                <ShoppingCart className="w-8 h-8 md:w-10 md:h-10 text-blue-600" />
                PDV - Point of Sale
              </h1>
              <p className="text-gray-600 mt-1">Atendente: <strong>{attendantName || 'Não identificado'}</strong></p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={clearCart}
                disabled={cart.length === 0}
                className="p-3 rounded-xl bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Limpar Carrinho (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
              <button
                onClick={toggleFullscreen}
                className="p-3 rounded-xl bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                title="Modo Fullscreen (F)"
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Painel de Estatísticas */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 text-white shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-6 h-6" />
                <span className="text-sm font-medium opacity-90">Vendas Hoje</span>
              </div>
              <div className="text-3xl font-bold">{formatCurrencyI18n(todaySales)}</div>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <Package className="w-6 h-6" />
                <span className="text-sm font-medium opacity-90">Pedidos</span>
              </div>
              <div className="text-3xl font-bold">{todayOrders}</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-6 h-6" />
                <span className="text-sm font-medium opacity-90">Ticket Médio</span>
              </div>
              <div className="text-3xl font-bold">{todayOrders > 0 ? formatCurrencyI18n(todaySales / todayOrders) : '--'}</div>
            </div>
          </div>
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-lg"
              />
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="bg-white p-4 rounded-2xl shadow-md hover:shadow-xl transition-all transform hover:scale-105 text-left"
                >
                  <div className="text-sm text-gray-500 mb-1">Produto</div>
                  <div className="font-bold text-lg mb-2">{product.name}</div>
                  <div className="text-2xl font-bold text-blue-600">{formatCurrency(product.base_price)}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold">Carrinho</h2>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                  <p>Carrinho vazio</p>
                </div>
              ) : (
                <div className="space-y-3 mb-6">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="flex-1">
                        <div className="font-semibold">{item.name}</div>
                        <div className="text-sm text-gray-600">{formatCurrency(item.price)}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-1 rounded-full bg-white hover:bg-gray-200"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-bold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-1 rounded-full bg-white hover:bg-gray-200"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded-full ml-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Campos de Cliente */}
              {cart.length > 0 && (
                <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-gray-600" />
                    <h3 className="font-semibold text-sm">Cliente (Opcional)</h3>
                  </div>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Nome do cliente"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="tel"
                      placeholder="Telefone"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Campos de Desconto */}
              {cart.length > 0 && (
                <div className="mb-4 p-3 bg-yellow-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-4 h-4 text-yellow-600" />
                    <h3 className="font-semibold text-sm">Desconto</h3>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as 'percent' | 'fixed')}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    >
                      <option value="percent">%</option>
                      <option value="fixed">R$</option>
                    </select>
                    <input
                      type="number"
                      placeholder="0"
                      value={discountValue || ''}
                      onChange={(e) => setDiscountValue(Number(e.target.value))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      min="0"
                      max={discountType === 'percent' ? 100 : subtotal}
                    />
                  </div>
                  {discountAmount > 0 && (
                    <div className="mt-2 text-sm text-yellow-700">
                      Desconto: -{formatCurrencyI18n(discountAmount)}
                    </div>
                  )}
                </div>
              )}

              <div className="border-t-2 pt-4 mb-6">
                {cart.length > 0 && (
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-lg">
                      <span>Subtotal</span>
                      <span>{formatCurrencyI18n(subtotal)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-lg text-yellow-600">
                        <span>Desconto</span>
                        <span>-{formatCurrencyI18n(discountAmount)}</span>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex justify-between text-3xl font-bold">
                  <span>Total</span>
                  <span className="text-blue-600">{formatCurrencyI18n(total)}</span>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="font-semibold mb-3">Forma de Pagamento</h3>
                <div className="space-y-3">
                  {helper.isCashEnabled && (
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        id="cash"
                        name="payment"
                        value="cash"
                        checked={selectedPayment === 'cash'}
                        onChange={() => setSelectedPayment('cash')}
                        className="w-4 h-4"
                      />
                      <label htmlFor="cash" className="flex items-center gap-2 cursor-pointer">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        <span className="font-medium">Dinheiro</span>
                      </label>
                    </div>
                  )}
                  {(helper.isCreditCardEnabled || helper.isDebitCardEnabled) && (
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        id="card"
                        name="payment"
                        value="card"
                        checked={selectedPayment === 'card'}
                        onChange={() => setSelectedPayment('card')}
                        className="w-4 h-4"
                      />
                      <label htmlFor="card" className="flex items-center gap-2 cursor-pointer">
                        <CreditCard className="w-5 h-5 text-blue-600" />
                        <span className="font-medium">Cartão</span>
                      </label>
                    </div>
                  )}
                  {helper.isPixEnabled && (
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        id="pix"
                        name="payment"
                        value="pix"
                        checked={selectedPayment === 'pix'}
                        onChange={() => setSelectedPayment('pix')}
                        className="w-4 h-4"
                      />
                      <label htmlFor="pix" className="flex items-center gap-2 cursor-pointer">
                        <Smartphone className="w-5 h-5 text-teal-600" />
                        <span className="font-medium">PIX</span>
                      </label>
                    </div>
                  )}
                  {!helper.hasPaymentMethodsEnabled() && (
                    <div className="text-center py-4 text-gray-500">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                      <p>Nenhuma forma de pagamento habilitada</p>
                      <p className="text-sm">Configure em Configurações</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Campo de Troco (Dinheiro) */}
              {selectedPayment === 'cash' && cart.length > 0 && (
                <div className="mb-4 p-3 bg-green-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <h3 className="font-semibold text-sm">Valor Recebido</h3>
                  </div>
                  <input
                    type="number"
                    placeholder="0,00"
                    value={cashReceived || ''}
                    onChange={(e) => setCashReceived(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-lg font-bold focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    min="0"
                    step="0.01"
                  />
                  {cashReceived > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Total:</span>
                        <span className="font-bold">{formatCurrencyI18n(total)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Recebido:</span>
                        <span className="font-bold">{formatCurrencyI18n(cashReceived)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold text-green-700">
                        <span>Troco:</span>
                        <span>{formatCurrencyI18n(change)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {validationError && (
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700 mb-4">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">{validationError}</span>
                </div>
              )}
              
              <Button
                onClick={handleCheckout}
                disabled={cart.length === 0 || processingOrder || !helper.hasPaymentMethodsEnabled()}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-lg py-6"
              >
                {processingOrder ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Finalizar Pedido
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
