'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { 
  Calendar, Package, Clock, CheckCircle, Truck, Phone,
  Plus, Minus, ShoppingBag, MapPin, User, MessageSquare,
  ChevronLeft, ChevronRight, Loader2, AlertCircle, Send
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Product {
  id: string
  name: string
  description: string | null
  base_price: number
  image_url: string | null
  sale_type: string
  min_order_quantity: number
  advance_days: number
  category?: { name: string }
}

interface Kit {
  id: string
  name: string
  description: string | null
  base_quantity: number
  min_varieties: number
  max_varieties: number
  min_per_variety: number
  base_price: number
  image_url: string | null
  advance_days: number
  items?: KitItem[]
}

interface KitItem {
  id: string
  product_id: string
  default_quantity: number
  max_quantity: number
  product?: Product
}

interface CartItem {
  type: 'product' | 'kit'
  id: string
  name: string
  quantity: number
  unitPrice: number
  totalPrice: number
  customizations?: Record<string, string>
  kitDetails?: { productId: string; name: string; quantity: number }[]
}

export default function EncomendaPage() {
  const params = useParams()
  const slug = params.slug as string
  const supabase = useMemo(() => createClient(), [])

  const [loading, setLoading] = useState(true)
  const [storeId, setStoreId] = useState<string | null>(null)
  const [storeName, setStoreName] = useState('')
  const [storePhone, setStorePhone] = useState('')
  
  const [products, setProducts] = useState<Product[]>([])
  const [kits, setKits] = useState<Kit[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  
  const [step, setStep] = useState(1) // 1: produtos, 2: data, 3: dados, 4: confirmar
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup')
  const [customerData, setCustomerData] = useState({
    name: '',
    phone: '',
    address: '',
    notes: ''
  })
  
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [orderNumber, setOrderNumber] = useState<number | null>(null)

  // Kit builder state
  const [buildingKit, setBuildingKit] = useState<Kit | null>(null)
  const [kitSelections, setKitSelections] = useState<Record<string, number>>({})

  useEffect(() => {
    async function loadStore() {
      const { data } = await supabase
        .from('stores')
        .select('id, name, phone')
        .eq('slug', slug)
        .single()
      
      if (data) {
        setStoreId(data.id)
        setStoreName(data.name)
        setStorePhone(data.phone || '')
      }
      setLoading(false)
    }
    loadStore()
  }, [slug, supabase])

  useEffect(() => {
    if (storeId) {
      loadProducts()
      loadKits()
    }
  }, [storeId])

  async function loadProducts() {
    const { data } = await supabase
      .from('products')
      .select('*, category:categories(name)')
      .eq('store_id', storeId)
      .eq('is_active', true)
      .in('sale_type', ['order', 'both'])
      .order('name')
    setProducts(data || [])
  }

  async function loadKits() {
    const { data } = await supabase
      .from('product_kits')
      .select('*, items:product_kit_items(*, product:products(*))')
      .eq('store_id', storeId)
      .eq('is_active', true)
      .order('name')
    setKits(data || [])
  }

  function addProductToCart(product: Product) {
    const existing = cart.find(c => c.type === 'product' && c.id === product.id)
    if (existing) {
      setCart(cart.map(c => 
        c.type === 'product' && c.id === product.id
          ? { ...c, quantity: c.quantity + (product.min_order_quantity || 1), totalPrice: (c.quantity + (product.min_order_quantity || 1)) * c.unitPrice }
          : c
      ))
    } else {
      setCart([...cart, {
        type: 'product',
        id: product.id,
        name: product.name,
        quantity: product.min_order_quantity || 1,
        unitPrice: product.base_price,
        totalPrice: (product.min_order_quantity || 1) * product.base_price
      }])
    }
  }

  function startKitBuilder(kit: Kit) {
    setBuildingKit(kit)
    const initial: Record<string, number> = {}
    kit.items?.forEach(item => {
      initial[item.product_id] = item.default_quantity || 0
    })
    setKitSelections(initial)
  }

  function addKitToCart() {
    if (!buildingKit) return
    
    const kitDetails = Object.entries(kitSelections)
      .filter(([_, qty]) => qty > 0)
      .map(([productId, quantity]) => {
        const item = buildingKit.items?.find(i => i.product_id === productId)
        return {
          productId,
          name: item?.product?.name || '',
          quantity
        }
      })
    
    setCart([...cart, {
      type: 'kit',
      id: buildingKit.id,
      name: buildingKit.name,
      quantity: 1,
      unitPrice: buildingKit.base_price,
      totalPrice: buildingKit.base_price,
      kitDetails
    }])
    
    setBuildingKit(null)
    setKitSelections({})
  }

  function updateCartQuantity(index: number, delta: number) {
    setCart(cart.map((item, i) => {
      if (i !== index) return item
      const newQty = Math.max(1, item.quantity + delta)
      return { ...item, quantity: newQty, totalPrice: newQty * item.unitPrice }
    }))
  }

  function removeFromCart(index: number) {
    setCart(cart.filter((_, i) => i !== index))
  }

  const cartTotal = cart.reduce((acc, item) => acc + item.totalPrice, 0)
  const kitTotal = Object.values(kitSelections).reduce((a, b) => a + b, 0)

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    return { firstDay, daysInMonth }
  }

  const isDateAvailable = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Mínimo 2 dias de antecedência
    const minDate = new Date(today)
    minDate.setDate(minDate.getDate() + 2)
    
    return date >= minDate
  }

  async function handleSubmit() {
    if (!storeId) return
    
    setSubmitting(true)
    
    const { data, error } = await supabase
      .from('custom_orders')
      .insert({
        store_id: storeId,
        customer_name: customerData.name,
        customer_phone: customerData.phone,
        delivery_date: selectedDate,
        delivery_time: selectedTime || null,
        delivery_type: deliveryType,
        delivery_address: deliveryType === 'delivery' ? customerData.address : null,
        subtotal: cartTotal,
        total: cartTotal,
        notes: customerData.notes,
        status: 'pending'
      })
      .select('order_number')
      .single()

    if (data) {
      // Inserir itens
      const items = cart.map(item => ({
        order_id: data.order_number ? undefined : data,
        name: item.name,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.totalPrice,
        kit_details: item.kitDetails ? JSON.stringify(item.kitDetails) : null
      }))
      
      // Buscar o ID do pedido
      const { data: orderData } = await supabase
        .from('custom_orders')
        .select('id, order_number')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (orderData) {
        await supabase.from('custom_order_items').insert(
          cart.map(item => ({
            order_id: orderData.id,
            product_id: item.type === 'product' ? item.id : null,
            kit_id: item.type === 'kit' ? item.id : null,
            name: item.name,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            total_price: item.totalPrice,
            kit_details: item.kitDetails || null
          }))
        )
        setOrderNumber(orderData.order_number)
      }
      
      setSubmitted(true)
    }
    
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Pedido Enviado!</h1>
          <p className="text-slate-600 mb-4">
            Seu pedido #{orderNumber} foi recebido com sucesso!
          </p>
          <p className="text-sm text-slate-500 mb-6">
            Entraremos em contato pelo WhatsApp para confirmar e combinar os detalhes.
          </p>
          
          {storePhone && (
            <a
              href={`https://wa.me/55${storePhone.replace(/\D/g, '')}?text=Olá! Acabei de fazer o pedido #${orderNumber}`}
              target="_blank"
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors"
            >
              <MessageSquare className="w-5 h-5" />
              Falar no WhatsApp
            </a>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold">{storeName}</h1>
          <p className="opacity-90">Faça sua encomenda</p>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between text-sm">
            {[
              { num: 1, label: 'Produtos' },
              { num: 2, label: 'Data' },
              { num: 3, label: 'Dados' },
              { num: 4, label: 'Confirmar' }
            ].map((s, i) => (
              <div key={s.num} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  step >= s.num ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  {s.num}
                </div>
                <span className={`ml-2 hidden sm:inline ${step >= s.num ? 'text-amber-600' : 'text-slate-400'}`}>
                  {s.label}
                </span>
                {i < 3 && <div className={`w-8 sm:w-16 h-1 mx-2 ${step > s.num ? 'bg-amber-500' : 'bg-slate-200'}`} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 pb-32">
        {/* Step 1: Produtos */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Kits */}
            {kits.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <Package className="w-5 h-5 text-amber-600" />
                  Kits / Combos
                </h2>
                <div className="grid gap-4">
                  {kits.map(kit => (
                    <div key={kit.id} className="bg-white rounded-2xl shadow-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-slate-800">{kit.name}</h3>
                          <p className="text-sm text-slate-500">{kit.description}</p>
                          <p className="text-sm text-amber-600 mt-1">
                            {kit.base_quantity} unidades • Escolha até {kit.max_varieties} tipos
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-green-600">{formatCurrency(kit.base_price)}</p>
                          <Button size="sm" onClick={() => startKitBuilder(kit)} className="mt-2">
                            Montar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Produtos */}
            <div>
              <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-600" />
                Produtos
              </h2>
              <div className="grid gap-4">
                {products.map(product => (
                  <div key={product.id} className="bg-white rounded-2xl shadow-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-slate-800">{product.name}</h3>
                        {product.description && (
                          <p className="text-sm text-slate-500">{product.description}</p>
                        )}
                        {product.min_order_quantity > 1 && (
                          <p className="text-xs text-amber-600 mt-1">
                            Mínimo: {product.min_order_quantity} un
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-green-600">{formatCurrency(product.base_price)}</p>
                        <Button size="sm" onClick={() => addProductToCart(product)} className="mt-2">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {products.length === 0 && kits.length === 0 && (
              <div className="bg-white rounded-2xl p-8 text-center">
                <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Nenhum produto disponível para encomenda</p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Data */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-600" />
              Quando você precisa?
            </h2>
            
            {/* Calendário */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className="p-2 hover:bg-slate-100 rounded-lg">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="font-medium">
                  {currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className="p-2 hover:bg-slate-100 rounded-lg">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-7 gap-1 text-center text-sm">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                  <div key={i} className="py-2 text-slate-500 font-medium">{d}</div>
                ))}
                
                {(() => {
                  const { firstDay, daysInMonth } = getDaysInMonth(currentMonth)
                  const days = []
                  
                  for (let i = 0; i < firstDay; i++) {
                    days.push(<div key={`empty-${i}`} />)
                  }
                  
                  for (let day = 1; day <= daysInMonth; day++) {
                    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                    const available = isDateAvailable(day)
                    const selected = selectedDate === dateStr
                    
                    days.push(
                      <button
                        key={day}
                        onClick={() => available && setSelectedDate(dateStr)}
                        disabled={!available}
                        className={`py-2 rounded-lg transition-all ${
                          selected ? 'bg-amber-500 text-white font-bold' :
                          available ? 'hover:bg-amber-100 text-slate-700' :
                          'text-slate-300 cursor-not-allowed'
                        }`}
                      >
                        {day}
                      </button>
                    )
                  }
                  
                  return days
                })()}
              </div>
            </div>

            {/* Horário */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Horário preferencial</label>
              <select
                value={selectedTime}
                onChange={e => setSelectedTime(e.target.value)}
                className="w-full px-4 py-3 border-2 rounded-xl"
              >
                <option value="">Qualquer horário</option>
                <option value="08:00">08:00</option>
                <option value="09:00">09:00</option>
                <option value="10:00">10:00</option>
                <option value="11:00">11:00</option>
                <option value="12:00">12:00</option>
                <option value="14:00">14:00</option>
                <option value="15:00">15:00</option>
                <option value="16:00">16:00</option>
                <option value="17:00">17:00</option>
                <option value="18:00">18:00</option>
              </select>
            </div>

            <p className="text-xs text-amber-600 mt-4 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              Pedidos com no mínimo 2 dias de antecedência
            </p>
          </div>
        )}

        {/* Step 3: Dados */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-amber-600" />
                Seus dados
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nome *</label>
                  <input
                    type="text"
                    value={customerData.name}
                    onChange={e => setCustomerData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border-2 rounded-xl"
                    placeholder="Seu nome completo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp *</label>
                  <input
                    type="tel"
                    value={customerData.phone}
                    onChange={e => setCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-3 border-2 rounded-xl"
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-600" />
                Entrega ou Retirada?
              </h2>
              
              <div className="flex gap-4 mb-4">
                <button
                  onClick={() => setDeliveryType('pickup')}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                    deliveryType === 'pickup' ? 'border-amber-500 bg-amber-50' : 'border-slate-200'
                  }`}
                >
                  <span className="text-2xl">🏠</span>
                  <p className="font-medium mt-1">Retiro no local</p>
                </button>
                <button
                  onClick={() => setDeliveryType('delivery')}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                    deliveryType === 'delivery' ? 'border-amber-500 bg-amber-50' : 'border-slate-200'
                  }`}
                >
                  <span className="text-2xl">🚚</span>
                  <p className="font-medium mt-1">Entrega</p>
                </button>
              </div>

              {deliveryType === 'delivery' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Endereço *</label>
                  <input
                    type="text"
                    value={customerData.address}
                    onChange={e => setCustomerData(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-4 py-3 border-2 rounded-xl"
                    placeholder="Rua, número, bairro..."
                  />
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <label className="block text-sm font-medium text-slate-700 mb-1">Observações (opcional)</label>
              <textarea
                value={customerData.notes}
                onChange={e => setCustomerData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-4 py-3 border-2 rounded-xl"
                rows={3}
                placeholder="Alguma observação especial?"
              />
            </div>
          </div>
        )}

        {/* Step 4: Confirmar */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4">📋 Resumo do Pedido</h2>
              
              <div className="divide-y">
                {cart.map((item, i) => (
                  <div key={i} className="py-3 flex justify-between">
                    <div>
                      <p className="font-medium">{item.quantity}x {item.name}</p>
                      {item.kitDetails && (
                        <p className="text-xs text-slate-500">
                          {item.kitDetails.map(d => `${d.quantity}x ${d.name}`).join(', ')}
                        </p>
                      )}
                    </div>
                    <p className="font-medium">{formatCurrency(item.totalPrice)}</p>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span className="text-green-600">{formatCurrency(cartTotal)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="font-bold text-slate-800 mb-3">📅 Data e Entrega</h3>
              <p>{new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
              {selectedTime && <p>Horário: {selectedTime}</p>}
              <p className="mt-2">{deliveryType === 'delivery' ? `🚚 Entrega: ${customerData.address}` : '🏠 Retirada no local'}</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="font-bold text-slate-800 mb-3">👤 Seus Dados</h3>
              <p>{customerData.name}</p>
              <p>{customerData.phone}</p>
              {customerData.notes && <p className="text-sm text-slate-500 mt-2">📝 {customerData.notes}</p>}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Voltar
            </Button>
          )}
          
          {cart.length > 0 && step === 1 && (
            <div className="flex-1 text-center">
              <span className="text-sm text-slate-500">{cart.length} item(ns)</span>
              <span className="font-bold text-green-600 ml-2">{formatCurrency(cartTotal)}</span>
            </div>
          )}
          
          <div className="flex-1" />
          
          {step === 1 && cart.length > 0 && (
            <Button onClick={() => setStep(2)} className="bg-amber-500 hover:bg-amber-600">
              Continuar
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
          
          {step === 2 && selectedDate && (
            <Button onClick={() => setStep(3)} className="bg-amber-500 hover:bg-amber-600">
              Continuar
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
          
          {step === 3 && customerData.name && customerData.phone && (
            <Button onClick={() => setStep(4)} className="bg-amber-500 hover:bg-amber-600">
              Revisar Pedido
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
          
          {step === 4 && (
            <Button 
              onClick={handleSubmit} 
              disabled={submitting}
              className="bg-green-500 hover:bg-green-600"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Enviar Pedido
            </Button>
          )}
        </div>
      </div>

      {/* Kit Builder Modal */}
      {buildingKit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b">
              <h3 className="text-lg font-bold">{buildingKit.name}</h3>
              <p className="text-sm text-slate-500">
                Escolha {buildingKit.base_quantity} unidades (mín. {buildingKit.min_per_variety} por tipo)
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {buildingKit.items?.map(item => (
                <div key={item.id} className="flex items-center justify-between">
                  <span className="font-medium">{item.product?.name}</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setKitSelections(prev => ({
                        ...prev,
                        [item.product_id]: Math.max(0, (prev[item.product_id] || 0) - buildingKit.min_per_variety)
                      }))}
                      className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-bold">{kitSelections[item.product_id] || 0}</span>
                    <button
                      onClick={() => setKitSelections(prev => ({
                        ...prev,
                        [item.product_id]: (prev[item.product_id] || 0) + buildingKit.min_per_variety
                      }))}
                      className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-6 border-t bg-slate-50">
              <div className="flex items-center justify-between mb-4">
                <span>Total selecionado:</span>
                <span className={`font-bold text-lg ${kitTotal === buildingKit.base_quantity ? 'text-green-600' : 'text-red-600'}`}>
                  {kitTotal} / {buildingKit.base_quantity}
                </span>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setBuildingKit(null)}>
                  Cancelar
                </Button>
                <Button 
                  className="flex-1" 
                  disabled={kitTotal !== buildingKit.base_quantity}
                  onClick={addKitToCart}
                >
                  Adicionar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
