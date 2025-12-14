'use client'

import { useState } from 'react'
import { Search, ShoppingCart, Plus, Minus, Trash2, CreditCard, DollarSign, Smartphone, Loader2, AlertCircle, Maximize, Minimize, Printer, User, Tag, TrendingUp, Clock, Package, X, Scale, Truck, Home, Barcode, Users, ArrowDownCircle, ArrowUpCircle, FileText, Lock } from 'lucide-react'
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
  const { t } = useLanguage()
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

  // Sangria/Suprimento
  const [showCashModal, setShowCashModal] = useState<'withdrawal' | 'supply' | null>(null)
  const [cashAmount, setCashAmount] = useState('')
  const [cashReason, setCashReason] = useState('')
  const [cashMovements, setCashMovements] = useState<any[]>([])

  // Fechamento de Caixa
  const [showClosingModal, setShowClosingModal] = useState(false)
  const [closingCash, setClosingCash] = useState(0)

  // Cancelamento
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelPassword, setCancelPassword] = useState('')
  const [itemToCancel, setItemToCancel] = useState<string | null>(null)

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

  const handleCashMovement = (type: 'withdrawal' | 'supply') => {
    const amount = parseFloat(cashAmount)
    if (!amount || amount <= 0 || !cashReason) {
      alert('Preencha o valor e motivo')
      return
    }

    const movement = {
      type,
      amount,
      reason: cashReason,
      attendant: attendantName,
      timestamp: new Date().toISOString()
    }

    setCashMovements([...cashMovements, movement])
    setCashAmount('')
    setCashReason('')
    setShowCashModal(null)
    alert(`${type === 'withdrawal' ? 'Sangria' : 'Suprimento'} registrado: ${formatCurrency(amount)}`)
  }

  const generateClosingReport = () => {
    const cashSales = todaySales // Simplificado - em produção, filtrar por forma de pagamento
    const withdrawals = cashMovements.filter(m => m.type === 'withdrawal').reduce((sum, m) => sum + m.amount, 0)
    const supplies = cashMovements.filter(m => m.type === 'supply').reduce((sum, m) => sum + m.amount, 0)
    const expectedCash = cashSales - withdrawals + supplies
    const difference = closingCash - expectedCash

    return {
      cashSales,
      withdrawals,
      supplies,
      expectedCash,
      closingCash,
      difference,
      orders: todayOrders
    }
  }

  const handleCancelItem = () => {
    if (cancelPassword !== '1234') { // Senha padrão - em produção, usar senha do gerente
      alert('Senha incorreta!')
      return
    }

    if (itemToCancel) {
      setCart(cart.filter(item => item.id !== itemToCancel))
      setShowCancelModal(false)
      setCancelPassword('')
      setItemToCancel(null)
      alert('Item cancelado com sucesso')
    }
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
              ${formatCurrency(item.price)} x ${item.quantity} = ${formatCurrency(item.price * item.quantity)}</p>
            `).join('')}
            <div class="line"></div>
            <p>Subtotal: ${formatCurrency(subtotal)}</p>
            ${discountAmount > 0 ? `<p>Desconto: -${formatCurrency(discountAmount)}</p>` : ''}
            <p class="total">TOTAL: ${formatCurrency(total)}</p>
            <p><strong>Pagamento:</strong> ${selectedPayment === 'cash' ? 'Dinheiro' : selectedPayment === 'card' ? 'Cartão' : 'PIX'}</p>
            ${selectedPayment === 'cash' && cashReceived > 0 ? `
              <p>Recebido: ${formatCurrency(cashReceived)}</p>
              <p>Troco: ${formatCurrency(change)}</p>
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
        discountAmount > 0 ? `Desconto: ${formatCurrency(discountAmount)}` : '',
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
      
      alert(`✅ Pedido finalizado com sucesso!\nTotal: ${formatCurrency(total)}\nPagamento: ${selectedPayment === 'cash' ? 'Dinheiro' : selectedPayment === 'card' ? 'Cartão' : 'PIX'}${change > 0 ? `\nTroco: ${formatCurrency(change)}` : ''}`)
      
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl shadow-slate-200/50">
          <Loader2 className="w-14 h-14 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 text-lg font-medium">Carregando produtos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header com Estatísticas e Controles */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/25">
                  <ShoppingCart className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>
                PDV - Point of Sale
              </h1>
              <p className="text-slate-500 mt-2 ml-14">Atendente: <span className="font-semibold text-slate-700">{attendantName || 'Não identificado'}</span></p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={clearCart}
                disabled={cart.length === 0}
                className="p-3 rounded-xl bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 shadow-sm hover:shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-sm"
                title="Limpar Carrinho (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
              <button
                onClick={toggleFullscreen}
                className="p-3 rounded-xl bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 shadow-sm hover:shadow-md transition-all"
                title="Modo Fullscreen (F)"
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Painel de Estatísticas */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-xl shadow-emerald-500/20 hover:shadow-2xl hover:shadow-emerald-500/30 transition-all duration-300 hover:-translate-y-0.5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-white/90">Vendas Hoje</span>
              </div>
              <div className="text-3xl font-bold tracking-tight">{formatCurrency(todaySales)}</div>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white shadow-xl shadow-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 hover:-translate-y-0.5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Package className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-white/90">Pedidos</span>
              </div>
              <div className="text-3xl font-bold tracking-tight">{todayOrders}</div>
            </div>
            <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-5 text-white shadow-xl shadow-violet-500/20 hover:shadow-2xl hover:shadow-violet-500/30 transition-all duration-300 hover:-translate-y-0.5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Clock className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-white/90">Ticket Médio</span>
              </div>
              <div className="text-3xl font-bold tracking-tight">{todayOrders > 0 ? formatCurrency(todaySales / todayOrders) : '--'}</div>
            </div>
          </div>
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {/* Código de Barras */}
            <div className="bg-white p-5 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Barcode className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Código de barras..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchByBarcode()}
                    className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all"
                  />
                </div>
                <Button onClick={searchByBarcode} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/25 px-6">
                  Buscar
                </Button>
              </div>
            </div>

            {/* Tipo de Pedido e Delivery */}
            <div className="bg-white p-5 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100">
              <div className="grid grid-cols-3 gap-2 mb-3">
                <button
                  onClick={() => { setOrderType('dine_in'); setIsDeliveryOrder(false); }}
                  className={`p-3.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                    orderType === 'dine_in' && !isDeliveryOrder 
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:shadow-md'
                  }`}
                >
                  <Home className="w-4 h-4" />
                  Mesa
                </button>
                <button
                  onClick={() => { setOrderType('takeout'); setIsDeliveryOrder(false); }}
                  className={`p-3.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                    orderType === 'takeout' && !isDeliveryOrder 
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:shadow-md'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  Viagem
                </button>
                <button
                  onClick={() => { setIsDeliveryOrder(true); setOrderType('delivery'); }}
                  className={`p-3.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                    isDeliveryOrder 
                      ? 'bg-gradient-to-r from-violet-600 to-purple-700 text-white shadow-lg shadow-violet-500/25' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:shadow-md'
                  }`}
                >
                  <Truck className="w-4 h-4" />
                  Delivery
                </button>
              </div>

              {/* Campos de Mesa/Comanda */}
              {orderType === 'dine_in' && !isDeliveryOrder && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Número da Mesa"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Comanda (opcional)"
                    value={commandNumber}
                    onChange={(e) => setCommandNumber(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              {/* Campos de Delivery */}
              {isDeliveryOrder && (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Endereço de entrega"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="Taxa de entrega (R$)"
                    value={deliveryFee || ''}
                    onChange={(e) => setDeliveryFee(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    min="0"
                    step="0.01"
                  />
                </div>
              )}
            </div>

            {/* Busca de Produtos */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none text-lg shadow-lg shadow-slate-200/50 transition-all"
              />
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredProducts.map(product => {
                const isByWeight = product.name.toLowerCase().includes('kg') || product.description?.toLowerCase().includes('peso')
                
                return (
                  <div key={product.id} className="bg-white p-5 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl hover:border-slate-200 hover:-translate-y-1 transition-all duration-300 relative group">
                    {/* Badge de Balança */}
                    {isByWeight && (
                      <div className="absolute -top-2 -right-2 bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-2 rounded-xl shadow-lg shadow-emerald-500/30">
                        <Scale className="w-4 h-4" />
                      </div>
                    )}
                    
                    <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">{isByWeight ? 'Por Peso (kg)' : 'Produto'}</div>
                    <div className="font-bold text-lg text-slate-800 mb-2 line-clamp-2">{product.name}</div>
                    <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                      {formatCurrency(product.base_price)}{isByWeight && '/kg'}
                    </div>
                    
                    {/* Botões */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => addToCart(product)}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-2.5 px-4 rounded-xl font-medium transition-all shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        {isByWeight ? 'Pesar' : 'Adicionar'}
                      </button>
                      {!isByWeight && (
                        <button
                          onClick={() => setShowWeightModal(product.id)}
                          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white p-2.5 rounded-xl transition-all shadow-md shadow-emerald-500/20 hover:shadow-lg"
                          title="Adicionar por peso"
                        >
                          <Scale className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/25">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Carrinho</h2>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
                    <ShoppingCart className="w-10 h-10 text-slate-300" />
                  </div>
                  <p className="font-medium">Carrinho vazio</p>
                  <p className="text-sm mt-1">Adicione produtos para começar</p>
                </div>
              ) : (
                <div className="space-y-3 mb-6">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-4 bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-xl border border-slate-200/50">
                      <div className="flex-1">
                        <div className="font-semibold flex items-center gap-2">
                          {item.isByWeight && <Scale className="w-4 h-4 text-green-600" />}
                          {item.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {item.isByWeight && item.weight ? (
                            <span className="text-green-600 font-medium">
                              {item.weight}kg × {formatCurrency(item.price / item.weight)}/kg = {formatCurrency(item.price)}
                            </span>
                          ) : (
                            formatCurrency(item.price)
                          )}
                        </div>
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
                <div className="mb-4 p-4 bg-gradient-to-r from-slate-50 to-blue-50/30 rounded-xl border border-slate-200/50">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-blue-100 rounded-lg">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-sm text-slate-700">Cliente (Opcional)</h3>
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
                <div className="mb-4 p-4 bg-gradient-to-r from-amber-50 to-yellow-50/50 rounded-xl border border-amber-200/50">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-amber-100 rounded-lg">
                      <Tag className="w-4 h-4 text-amber-600" />
                    </div>
                    <h3 className="font-semibold text-sm text-slate-700">Desconto</h3>
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
                      Desconto: -{formatCurrency(discountAmount)}
                    </div>
                  )}
                </div>
              )}

              <div className="border-t-2 border-slate-100 pt-5 mb-6">
                {cart.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-base text-slate-600">
                      <span>Subtotal</span>
                      <span className="font-medium">{formatCurrency(subtotal)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-base text-amber-600">
                        <span>Desconto</span>
                        <span className="font-medium">-{formatCurrency(discountAmount)}</span>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-slate-800">Total</span>
                  <span className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{formatCurrency(total)}</span>
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
                        <span className="font-bold">{formatCurrency(total)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Recebido:</span>
                        <span className="font-bold">{formatCurrency(cashReceived)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold text-green-700">
                        <span>Troco:</span>
                        <span>{formatCurrency(change)}</span>
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

      {/* Modal de Login de Atendente */}
      {showAttendantModal && !attendantName && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Identificação do Atendente
            </h3>
            <p className="text-gray-600 mb-4">Por favor, identifique-se para continuar</p>
            <input
              type="text"
              placeholder="Nome do atendente"
              value={attendantName}
              onChange={(e) => setAttendantName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && attendantName && setShowAttendantModal(false)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              autoFocus
            />
            <Button
              onClick={() => attendantName && setShowAttendantModal(false)}
              disabled={!attendantName}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Continuar
            </Button>
          </div>
        </div>
      )}

      {/* Modal de Peso (Balança) */}
      {showWeightModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowWeightModal(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Scale className="w-5 h-5 text-green-600" />
              Produto Vendido por Peso
            </h3>
            <p className="text-gray-600 mb-4">Digite o peso em quilogramas (kg)</p>
            <input
              type="number"
              placeholder="0.000"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && weightInput && addProductByWeight(showWeightModal)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg font-bold focus:ring-2 focus:ring-green-500 focus:border-transparent mb-4"
              min="0"
              step="0.001"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowWeightModal(null)}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => addProductByWeight(showWeightModal)}
                disabled={!weightInput || parseFloat(weightInput) <= 0}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
