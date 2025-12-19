'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, ShoppingCart, User, Moon, Sun, Maximize, Minimize, Loader2, Users, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { useProducts } from '@/hooks/useProducts'
import { useDashboardStoreId } from '../DashboardClient'
import { usePDV, ProductGrid, CartPanel, CashRegister, ReceiptPrinter, AddonsModal, ScaleDisplay, LayoutType, ScaleLayout, ReceiptData, CashRegisterSession, CartAddon } from '@/modules/pos'

export default function PDVPage() {
  const storeId = useDashboardStoreId()
  const { products, loading } = useProducts(storeId || '')
  
  // Hook do PDV com toda lógica centralizada
  const pdv = usePDV({ storeId })

  // Estados de UI locais
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [barcodeInput, setBarcodeInput] = useState('')
  const [darkMode, setDarkMode] = useState(false)
  const [layoutType, setLayoutType] = useState<LayoutType>('photo-md')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showAttendantModal, setShowAttendantModal] = useState(true)
  const [showReceipt, setShowReceipt] = useState(false)
  const [showAddons, setShowAddons] = useState<any>(null)
  const [cashSession, setCashSession] = useState<CashRegisterSession | null>(null)
  
  // Estados da balança
  const [scaleWeight, setScaleWeight] = useState(0)
  const [scaleConnected, setScaleConnected] = useState(false)
  const [scaleLayout, setScaleLayout] = useState<ScaleLayout>('compact')
  const [weightProduct, setWeightProduct] = useState<any>(null)
  
  // Estado do input de atendente
  const [attendantInput, setAttendantInput] = useState('')

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') { e.preventDefault(); document.getElementById('search-input')?.focus() }
      if (e.key === 'F2') { e.preventDefault(); handleCheckout() }
      if (e.key === 'F11') { e.preventDefault(); toggleFullscreen() }
      if (e.key === 'Escape') { setSearch(''); setSelectedCategory(null) }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [pdv.cart])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const handleBarcodeSearch = () => {
    if (!barcodeInput.trim()) return
    const product = products?.find((p: any) => p.id === barcodeInput || p.sku === barcodeInput)
    if (product) {
      pdv.addToCart(product)
      setBarcodeInput('')
    }
  }

  const handleAddToCart = (product: any, weight?: number) => {
    // Se produto tem adicionais, mostrar modal
    if (product.has_addons) {
      setShowAddons(product)
    } else {
      pdv.addToCart(product)
    }
  }

  const handleWeightProduct = (product: any) => {
    setWeightProduct(product)
  }

  const confirmWeightProduct = () => {
    if (weightProduct && scaleWeight > 0) {
      // Adiciona produto com preço calculado pelo peso
      const priceByWeight = weightProduct.base_price * scaleWeight
      pdv.addToCart({
        ...weightProduct,
        base_price: priceByWeight,
        name: `${weightProduct.name} (${scaleWeight.toFixed(3)}kg)`
      })
      setWeightProduct(null)
    }
  }

  const handleAddWithAddons = (addons: CartAddon[]) => {
    if (showAddons) {
      pdv.addToCart(showAddons, addons)
      setShowAddons(null)
    }
  }

  const handleCheckout = async () => {
    try {
      await pdv.checkout()
      setShowReceipt(true)
    } catch (error) {
      alert('Erro ao finalizar venda')
    }
  }

  // Classes dinâmicas
  const bg = darkMode ? 'bg-gray-900' : 'bg-gray-100'
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white'
  const textColor = darkMode ? 'text-white' : 'text-gray-900'
  const mutedText = darkMode ? 'text-gray-400' : 'text-gray-500'
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-200'

  // Lista de atendentes comuns (pode vir do banco futuramente)
  const commonAttendants = ['João', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Julia']
  const filteredAttendants = commonAttendants.filter(a => 
    a.toLowerCase().includes(attendantInput.toLowerCase())
  )

  const selectAttendant = (name: string) => {
    pdv.setAttendant(name)
    setShowAttendantModal(false)
  }

  // Modal Atendente
  if (showAttendantModal && !pdv.attendant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700">
        <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Users className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Bem-vindo ao PDV</h2>
            <p className="text-gray-500 mt-1">Digite seu nome ou selecione abaixo</p>
          </div>
          
          <input
            type="text"
            placeholder="Seu nome..."
            value={attendantInput}
            onChange={(e) => setAttendantInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && attendantInput.trim()) {
                selectAttendant(attendantInput.trim())
              }
            }}
            className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none text-lg mb-4 transition-all"
            autoFocus
          />
          
          {/* Lista de atendentes sugeridos */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {(attendantInput ? filteredAttendants : commonAttendants).map(name => (
              <button
                key={name}
                onClick={() => selectAttendant(name)}
                className="w-full p-3 rounded-xl border-2 border-gray-100 hover:border-blue-500 hover:bg-blue-50 text-left flex items-center gap-3 transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-lg">
                  {name[0]}
                </div>
                <span className="font-medium text-gray-700 group-hover:text-blue-600">{name}</span>
              </button>
            ))}
          </div>
          
          {attendantInput.trim() && !filteredAttendants.includes(attendantInput.trim()) && (
            <button
              onClick={() => selectAttendant(attendantInput.trim())}
              className="w-full mt-4 p-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg"
            >
              Entrar como "{attendantInput.trim()}"
            </button>
          )}
        </div>
      </div>
    )
  }

  if (!storeId) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Loja não encontrada</p></div>
  if (loading) return <div className={`min-h-screen flex items-center justify-center ${bg}`}><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>

  return (
    <div className={`h-screen flex ${bg} transition-colors`}>
      {/* Painel de Produtos */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        {/* Header - Barra de Status */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Vendas Hoje */}
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl px-4 py-3 flex items-center gap-3 shadow-lg">
              <div className="p-2 bg-white/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-white/80 font-medium">Vendas Hoje</p>
                <p className="font-bold text-white text-lg">{formatCurrency(pdv.stats.todaySales)}</p>
              </div>
            </div>
            
            {/* Pedidos */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl px-4 py-3 flex items-center gap-3 shadow-lg">
              <div className="p-2 bg-white/20 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-white/80 font-medium">Pedidos</p>
                <p className="font-bold text-white text-lg">{pdv.stats.todayOrders}</p>
              </div>
            </div>
            
            {/* Atendente */}
            <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl px-4 py-3 flex items-center gap-3 shadow-lg">
              <div className="p-2 bg-white/20 rounded-lg">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-white/80 font-medium">Atendente</p>
                <p className="font-bold text-white text-lg">{pdv.attendant}</p>
              </div>
            </div>
            
            {/* Caixa */}
            {storeId && (
              <CashRegister
                storeId={storeId}
                attendant={pdv.attendant}
                session={cashSession}
                onSessionChange={setCashSession}
                darkMode={darkMode}
              />
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={() => setDarkMode(!darkMode)} className={`p-2.5 rounded-xl ${cardBg} border ${borderColor} hover:border-blue-400 transition-colors`}>
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-gray-400" />}
            </button>
            <button onClick={toggleFullscreen} className={`p-2.5 rounded-xl ${cardBg} border ${borderColor} hover:border-blue-400 transition-colors`}>
              {isFullscreen ? <Minimize className="w-5 h-5 text-gray-400" /> : <Maximize className="w-5 h-5 text-gray-400" />}
            </button>
          </div>
        </div>

        {/* Grid de Produtos */}
        <ProductGrid
          products={products || []}
          search={search}
          setSearch={setSearch}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          barcodeInput={barcodeInput}
          setBarcodeInput={setBarcodeInput}
          onBarcodeSearch={handleBarcodeSearch}
          onAddToCart={handleAddToCart}
          layoutType={layoutType}
          setLayoutType={setLayoutType}
          darkMode={darkMode}
          scaleWeight={scaleWeight}
          scaleConnected={scaleConnected}
          onWeightProduct={handleWeightProduct}
        />

        {/* Atalhos */}
        <div className={`mt-4 flex items-center gap-4 text-xs ${mutedText}`}>
          <span><kbd className="px-1.5 py-0.5 bg-gray-200 rounded">F1</kbd> Buscar</span>
          <span><kbd className="px-1.5 py-0.5 bg-gray-200 rounded">F2</kbd> Finalizar</span>
          <span><kbd className="px-1.5 py-0.5 bg-gray-200 rounded">F11</kbd> Tela cheia</span>
          <span><kbd className="px-1.5 py-0.5 bg-gray-200 rounded">ESC</kbd> Limpar</span>
        </div>
      </div>

      {/* Coluna do Carrinho */}
      <div className="w-96 flex flex-col h-full">
        {/* BALANÇA */}
        <ScaleDisplay
          weight={scaleWeight}
          connected={scaleConnected}
          layout={scaleLayout}
          onLayoutChange={setScaleLayout}
          darkMode={darkMode}
        />

        {/* Carrinho */}
        <CartPanel
        cart={pdv.cart}
        updateQuantity={pdv.updateQuantity}
        removeItem={pdv.removeItem}
        addObsToItem={pdv.addObsToItem}
        clearCart={pdv.clearCart}
        itemCount={pdv.itemCount}
        subtotal={pdv.subtotal}
        discountAmount={pdv.discountAmount}
        serviceFeeAmount={pdv.serviceFeeAmount}
        tipAmount={pdv.tipAmount}
        total={pdv.total}
        change={pdv.change}
        paymentMethod={pdv.paymentMethod}
        setPaymentMethod={pdv.setPaymentMethod}
        cashReceived={pdv.cashReceived}
        setCashReceived={pdv.setCashReceived}
        discountType={pdv.discountType}
        setDiscountType={pdv.setDiscountType}
        discountValue={pdv.discountValue}
        setDiscountValue={pdv.setDiscountValue}
        serviceFee={pdv.serviceFee}
        setServiceFee={pdv.setServiceFee}
        tipPercent={pdv.tipPercent}
        setTipPercent={pdv.setTipPercent}
        customerName={pdv.customerName}
        setCustomerName={pdv.setCustomerName}
        tableNumber={pdv.tableNumber}
        setTableNumber={pdv.setTableNumber}
        processing={pdv.processing}
        success={pdv.success}
        onCheckout={handleCheckout}
        darkMode={darkMode}
      />
      </div>

      {/* Modal Adicionais */}
      {showAddons && storeId && (
        <AddonsModal
          product={showAddons}
          storeId={storeId}
          onConfirm={handleAddWithAddons}
          onClose={() => setShowAddons(null)}
          darkMode={darkMode}
        />
      )}

      {/* Modal Cupom */}
      {showReceipt && pdv.lastOrderId && (
        <ReceiptPrinter
          data={{
            orderCode: `PDV-${pdv.lastOrderId.slice(0, 8)}`,
            storeName: 'Loja',
            attendant: pdv.attendant,
            customerName: pdv.customerName,
            tableNumber: pdv.tableNumber,
            items: pdv.cart,
            subtotal: pdv.subtotal,
            discount: pdv.discountAmount,
            serviceFee: pdv.serviceFeeAmount,
            tip: pdv.tipAmount,
            total: pdv.total,
            paymentMethod: pdv.paymentMethod,
            cashReceived: pdv.cashReceived,
            change: pdv.change,
            createdAt: new Date()
          }}
          onClose={() => setShowReceipt(false)}
        />
      )}

      {/* Modal Pesagem */}
      {weightProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${cardBg} rounded-2xl p-6 w-full max-w-sm shadow-2xl`}>
            <h2 className={`text-xl font-bold ${textColor} mb-4`}>Pesagem</h2>
            <p className={`${mutedText} mb-2`}>{weightProduct.name}</p>
            <p className={`text-sm ${mutedText} mb-4`}>Preço: {formatCurrency(weightProduct.base_price)}/kg</p>
            
            <div className={`p-6 rounded-xl border-2 ${scaleConnected ? 'border-green-500 bg-green-50' : `${borderColor}`} mb-4`}>
              <p className={`text-center font-mono text-4xl font-bold ${scaleConnected ? 'text-green-700' : textColor}`}>
                {scaleWeight.toFixed(3)} kg
              </p>
              <p className={`text-center text-2xl font-bold text-blue-600 mt-2`}>
                {formatCurrency(weightProduct.base_price * scaleWeight)}
              </p>
            </div>

            {!scaleConnected && (
              <div className="mb-4">
                <label className={`block text-sm ${mutedText} mb-2`}>Peso manual (kg)</label>
                <input
                  type="number"
                  step="0.001"
                  value={scaleWeight || ''}
                  onChange={(e) => setScaleWeight(parseFloat(e.target.value) || 0)}
                  className={`w-full p-3 rounded-xl border ${borderColor} ${cardBg} ${textColor}`}
                  placeholder="0.000"
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setWeightProduct(null)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmWeightProduct}
                disabled={scaleWeight <= 0}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
