'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, ShoppingCart, User, Moon, Sun, Maximize, Minimize, Loader2, Users, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { useProducts } from '@/hooks/useProducts'
import { useDashboardStoreId } from '../DashboardClient'
import { usePDV, ProductGrid, CartPanel, CashRegister, ReceiptPrinter, AddonsModal, LayoutType, ReceiptData, CashRegisterSession, CartAddon } from '@/modules/pos'

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
  const [weightProduct, setWeightProduct] = useState<any>(null)

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

  // Modal Atendente
  if (showAttendantModal && !pdv.attendant) {
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
            onChange={(e) => pdv.setAttendant(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && pdv.attendant && setShowAttendantModal(false)}
            className={`w-full p-4 rounded-xl border ${borderColor} ${cardBg} ${textColor} mb-4`}
            autoFocus
          />
          <Button
            onClick={() => pdv.attendant && setShowAttendantModal(false)}
            disabled={!pdv.attendant}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700"
          >
            Entrar no PDV
          </Button>
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
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`${cardBg} rounded-xl px-4 py-2 flex items-center gap-3`}>
              <TrendingUp className="w-5 h-5 text-green-500" />
              <div>
                <p className={`text-xs ${mutedText}`}>Vendas Hoje</p>
                <p className={`font-bold ${textColor}`}>{formatCurrency(pdv.stats.todaySales)}</p>
              </div>
            </div>
            <div className={`${cardBg} rounded-xl px-4 py-2 flex items-center gap-3`}>
              <ShoppingCart className="w-5 h-5 text-blue-500" />
              <div>
                <p className={`text-xs ${mutedText}`}>Pedidos</p>
                <p className={`font-bold ${textColor}`}>{pdv.stats.todayOrders}</p>
              </div>
            </div>
            <div className={`${cardBg} rounded-xl px-4 py-2 flex items-center gap-3`}>
              <User className="w-5 h-5 text-purple-500" />
              <div>
                <p className={`text-xs ${mutedText}`}>Atendente</p>
                <p className={`font-bold ${textColor}`}>{pdv.attendant}</p>
              </div>
            </div>
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
            <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-lg ${cardBg} ${borderColor} border`}>
              {darkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className={`w-5 h-5 ${mutedText}`} />}
            </button>
            <button onClick={toggleFullscreen} className={`p-2 rounded-lg ${cardBg} ${borderColor} border`}>
              {isFullscreen ? <Minimize className={`w-5 h-5 ${mutedText}`} /> : <Maximize className={`w-5 h-5 ${mutedText}`} />}
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
        <div className={`flex-shrink-0 mb-3 mx-4 mt-4 rounded-xl overflow-hidden ${
          scaleConnected 
            ? 'bg-gradient-to-r from-emerald-500 to-green-600' 
            : 'bg-gradient-to-r from-gray-400 to-gray-500'
        }`}>
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white/20 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
              </div>
              <div>
                <p className="text-white font-semibold text-xs">
                  {scaleConnected ? 'ONLINE' : 'OFFLINE'}
                </p>
              </div>
            </div>
            <div className="text-right bg-black/20 px-4 py-2 rounded-lg">
              <p className="font-mono font-black text-3xl text-white leading-none">
                {scaleWeight.toFixed(3)}
              </p>
              <p className="text-white/70 text-xs">kg</p>
            </div>
          </div>
        </div>

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
