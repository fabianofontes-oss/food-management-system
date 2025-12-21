'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { 
  User, UtensilsCrossed, ShoppingBag, Plus, Minus, 
  Send, X, Check, Clock, ChefHat, Loader2,
  Search, ArrowLeft, Bell, Home, Receipt, CreditCard,
  Banknote, QrCode, History, RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Product {
  id: string
  name: string
  base_price: number
  category_id: string
  image_url: string | null
  prep_time: number
}

interface Category {
  id: string
  name: string
  icon: string | null
}

interface CartItem {
  product: Product
  quantity: number
  notes: string
}

interface Table {
  id: string
  number: number
  status: string
}

interface Order {
  id: string
  order_number: string
  status: string
  total_amount: number
  created_at: string
  items?: OrderItem[]
}

interface OrderItem {
  id: string
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
  status: string
  notes: string | null
}

export default function WaiterAppPage() {
  const params = useParams()
  const slug = params.slug as string
  const supabase = useMemo(() => createClient(), [])

  const [storeId, setStoreId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [waiterName, setWaiterName] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  
  const [tables, setTables] = useState<Table[]>([])
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sending, setSending] = useState(false)
  const [view, setView] = useState<'tables' | 'menu' | 'cart' | 'orders' | 'payment' | 'history'>('tables')
  const [tableOrders, setTableOrders] = useState<Order[]>([])
  const [selectedPayment, setSelectedPayment] = useState<'cash' | 'card' | 'pix'>('cash')
  const [waiterHistory, setWaiterHistory] = useState<Order[]>([])
  const [readyOrders, setReadyOrders] = useState<Order[]>([])

  useEffect(() => {
    async function loadStore() {
      const { data } = await supabase
        .from('stores')
        .select('id')
        .eq('slug', slug)
        .single()
      if (data) {
        setStoreId(data.id)
        loadData(data.id)
      }
      setLoading(false)
    }
    loadStore()
  }, [slug, supabase])

  async function loadData(storeId: string) {
    const [tablesRes, categoriesRes, productsRes] = await Promise.all([
      supabase.from('tables').select('*').eq('store_id', storeId).order('number'),
      supabase.from('product_categories').select('*').eq('store_id', storeId).eq('is_active', true),
      supabase.from('products').select('*').eq('store_id', storeId).eq('is_active', true)
    ])
    
    setTables(tablesRes.data || [])
    setCategories(categoriesRes.data || [])
    setProducts(productsRes.data || [])
    
    // Carregar pedidos prontos
    const { data: ready } = await supabase
      .from('orders')
      .select('*')
      .eq('store_id', storeId)
      .eq('status', 'ready')
      .order('created_at', { ascending: false })
    setReadyOrders(ready || [])
  }

  async function loadTableOrders(tableId: string) {
    if (!storeId) return
    const { data } = await supabase
      .from('orders')
      .select('*, items:order_items(*)')
      .eq('store_id', storeId)
      .eq('table_id', tableId)
      .in('status', ['pending', 'preparing', 'ready'])
      .order('created_at', { ascending: false })
    setTableOrders(data || [])
  }

  async function loadWaiterHistory() {
    if (!storeId) return
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const { data } = await supabase
      .from('orders')
      .select('*, items:order_items(*)')
      .eq('store_id', storeId)
      .eq('waiter_name', waiterName)
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false })
    setWaiterHistory(data || [])
  }

  function handleLogin() {
    if (waiterName.trim()) {
      setIsLoggedIn(true)
      localStorage.setItem('waiter_name', waiterName)
    }
  }

  function selectTable(table: Table) {
    setSelectedTable(table)
    if (table.status === 'occupied') {
      loadTableOrders(table.id)
      setView('orders')
    } else {
      setView('menu')
    }
    setCart([])
  }

  function addToCart(product: Product) {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id)
      if (existing) {
        return prev.map(i => 
          i.product.id === product.id 
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }
      return [...prev, { product, quantity: 1, notes: '' }]
    })
  }

  function updateQuantity(productId: string, delta: number) {
    setCart(prev => {
      const updated = prev.map(i => 
        i.product.id === productId 
          ? { ...i, quantity: Math.max(0, i.quantity + delta) }
          : i
      ).filter(i => i.quantity > 0)
      return updated
    })
  }

  function updateNotes(productId: string, notes: string) {
    setCart(prev => prev.map(i => 
      i.product.id === productId ? { ...i, notes } : i
    ))
  }

  async function sendOrder() {
    if (!storeId || !selectedTable || cart.length === 0) return
    
    setSending(true)
    
    const total = cart.reduce((sum, i) => sum + (i.product.base_price * i.quantity), 0)
    
    // Criar pedido
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        store_id: storeId,
        table_id: selectedTable.id,
        table_number: selectedTable.number,
        waiter_name: waiterName,
        status: 'pending',
        total_amount: total,
        order_type: 'dine_in'
      })
      .select('id')
      .single()

    if (order) {
      // Criar itens do pedido
      const items = cart.map(i => ({
        order_id: order.id,
        product_id: i.product.id,
        product_name: i.product.name,
        quantity: i.quantity,
        unit_price: i.product.base_price,
        total_price: i.product.base_price * i.quantity,
        notes: i.notes || null,
        status: 'pending'
      }))
      
      await supabase.from('order_items').insert(items)
      
      // Atualizar status da mesa
      await supabase
        .from('tables')
        .update({ status: 'occupied' })
        .eq('id', selectedTable.id)
    }

    setSending(false)
    setCart([])
    setView('tables')
    setSelectedTable(null)
    loadData(storeId)
  }

  const filteredProducts = products.filter(p => {
    const matchesCategory = !selectedCategory || p.category_id === selectedCategory
    const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const cartTotal = cart.reduce((sum, i) => sum + (i.product.base_price * i.quantity), 0)
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    )
  }

  // Tela de Login
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <UtensilsCrossed className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">App do Garçom</h1>
            <p className="text-slate-500">Digite seu nome para começar</p>
          </div>
          
          <div className="space-y-4">
            <input
              type="text"
              value={waiterName}
              onChange={e => setWaiterName(e.target.value)}
              placeholder="Seu nome"
              className="w-full px-4 py-4 text-lg border-2 rounded-xl focus:border-blue-500 focus:outline-none"
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
            <Button 
              onClick={handleLogin} 
              disabled={!waiterName.trim()}
              className="w-full py-6 text-lg bg-gradient-to-r from-blue-500 to-indigo-600"
            >
              <User className="w-5 h-5 mr-2" />
              Entrar
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Tela de Mesas
  if (view === 'tables') {
    return (
      <div className="min-h-screen bg-slate-100">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Olá, {waiterName}</p>
              <h1 className="text-xl font-bold">Selecione a Mesa</h1>
            </div>
            <div className="flex gap-2">
              {readyOrders.length > 0 && (
                <span className="px-2 py-1 bg-green-400 text-green-900 rounded-full text-xs font-bold animate-pulse">
                  {readyOrders.length} pronto(s)
                </span>
              )}
              <button onClick={() => { loadWaiterHistory(); setView('history') }} className="p-2 bg-white/20 rounded-xl">
                <History className="w-6 h-6" />
              </button>
              <button className="p-2 bg-white/20 rounded-xl relative">
                <Bell className="w-6 h-6" />
                {readyOrders.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center">
                    {readyOrders.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 grid grid-cols-3 gap-3">
          {tables.map(table => (
            <button
              key={table.id}
              onClick={() => selectTable(table)}
              className={`aspect-square rounded-2xl flex flex-col items-center justify-center shadow-lg transition-all active:scale-95 ${
                table.status === 'available' 
                  ? 'bg-white border-2 border-green-300' 
                  : table.status === 'occupied'
                  ? 'bg-orange-50 border-2 border-orange-300'
                  : 'bg-red-50 border-2 border-red-300'
              }`}
            >
              <span className="text-3xl font-bold text-slate-800">{table.number}</span>
              <span className={`text-xs mt-1 px-2 py-0.5 rounded-full ${
                table.status === 'available' 
                  ? 'bg-green-100 text-green-700' 
                  : table.status === 'occupied'
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {table.status === 'available' ? 'Livre' : table.status === 'occupied' ? 'Ocupada' : 'Reservada'}
              </span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Tela de Menu
  if (view === 'menu') {
    return (
      <div className="min-h-screen bg-slate-100 pb-24">
        {/* Header */}
        <div className="bg-white shadow-sm sticky top-0 z-10">
          <div className="p-4 flex items-center gap-3">
            <button onClick={() => setView('tables')} className="p-2 hover:bg-slate-100 rounded-xl">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex-1">
              <p className="text-sm text-slate-500">Mesa</p>
              <p className="text-xl font-bold">{selectedTable?.number}</p>
            </div>
            {cartCount > 0 && (
              <button 
                onClick={() => setView('cart')}
                className="relative p-3 bg-blue-500 text-white rounded-xl"
              >
                <ShoppingBag className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                  {cartCount}
                </span>
              </button>
            )}
          </div>

          {/* Busca */}
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar produto..."
                className="w-full pl-10 pr-4 py-3 bg-slate-100 rounded-xl"
              />
            </div>
          </div>

          {/* Categorias */}
          <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${
                !selectedCategory ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Todos
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${
                  selectedCategory === cat.id ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Produtos */}
        <div className="p-4 space-y-3">
          {filteredProducts.map(product => {
            const inCart = cart.find(i => i.product.id === product.id)
            
            return (
              <div 
                key={product.id}
                className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4"
              >
                <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center">
                  {product.image_url ? (
                    <img src={product.image_url} alt="" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <UtensilsCrossed className="w-6 h-6 text-slate-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 truncate">{product.name}</p>
                  <p className="text-lg font-bold text-blue-600">{formatCurrency(product.base_price)}</p>
                </div>
                
                {inCart ? (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => updateQuantity(product.id, -1)}
                      className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="w-8 text-center font-bold text-lg">{inCart.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(product.id, 1)}
                      className="w-10 h-10 bg-blue-500 text-white rounded-xl flex items-center justify-center"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => addToCart(product)}
                    className="w-12 h-12 bg-blue-500 text-white rounded-xl flex items-center justify-center"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer com total */}
        {cartCount > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
            <button 
              onClick={() => setView('cart')}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-5 h-5" />
              Ver Pedido • {formatCurrency(cartTotal)}
            </button>
          </div>
        )}
      </div>
    )
  }

  // Tela de Carrinho
  return (
    <div className="min-h-screen bg-slate-100 pb-32">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10 p-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setView('menu')} className="p-2 hover:bg-slate-100 rounded-xl">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <p className="text-sm text-slate-500">Mesa {selectedTable?.number}</p>
            <h1 className="text-xl font-bold">Resumo do Pedido</h1>
          </div>
        </div>
      </div>

      {/* Itens */}
      <div className="p-4 space-y-3">
        {cart.map(item => (
          <div key={item.product.id} className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="font-medium text-slate-800">{item.product.name}</p>
                <p className="text-blue-600 font-bold">{formatCurrency(item.product.base_price)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => updateQuantity(item.product.id, -1)}
                  className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-6 text-center font-bold">{item.quantity}</span>
                <button 
                  onClick={() => updateQuantity(item.product.id, 1)}
                  className="w-8 h-8 bg-blue-500 text-white rounded-lg flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <p className="font-bold text-slate-800 w-20 text-right">
                {formatCurrency(item.product.base_price * item.quantity)}
              </p>
            </div>
            <input
              type="text"
              value={item.notes}
              onChange={e => updateNotes(item.product.id, e.target.value)}
              placeholder="Observações (ex: sem cebola)"
              className="mt-3 w-full px-3 py-2 bg-slate-50 rounded-lg text-sm"
            />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <span className="text-slate-600">Total</span>
          <span className="text-2xl font-bold text-slate-800">{formatCurrency(cartTotal)}</span>
        </div>
        <button 
          onClick={sendOrder}
          disabled={sending || cart.length === 0}
          className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {sending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Send className="w-5 h-5" />
              Enviar para Cozinha
            </>
          )}
        </button>
      </div>
    </div>
  )

  // Tela de Pedidos da Mesa
  if (view === 'orders') {
    const totalMesa = tableOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
    
    return (
      <div className="min-h-screen bg-slate-100 pb-32">
        <div className="bg-white shadow-sm sticky top-0 z-10 p-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setView('tables')} className="p-2 hover:bg-slate-100 rounded-xl">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex-1">
              <p className="text-sm text-slate-500">Mesa {selectedTable?.number}</p>
              <h1 className="text-xl font-bold">Pedidos da Mesa</h1>
            </div>
            <button 
              onClick={() => { if(selectedTable) loadTableOrders(selectedTable.id) }}
              className="p-2 hover:bg-slate-100 rounded-xl"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {tableOrders.length === 0 ? (
          <div className="p-8 text-center">
            <Receipt className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500">Nenhum pedido ativo</p>
            <button 
              onClick={() => setView('menu')}
              className="mt-4 px-6 py-3 bg-blue-500 text-white rounded-xl font-medium"
            >
              Fazer Pedido
            </button>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {tableOrders.map(order => (
              <div key={order.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b flex items-center justify-between">
                  <div>
                    <p className="font-bold">Pedido #{order.order_number || order.id.slice(0,6)}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    order.status === 'ready' ? 'bg-green-100 text-green-700' :
                    order.status === 'preparing' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {order.status === 'ready' ? '✅ Pronto' :
                     order.status === 'preparing' ? '👨‍🍳 Preparando' : '⏳ Pendente'}
                  </span>
                </div>
                <div className="p-4 space-y-2">
                  {order.items?.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.product_name}</span>
                      <span className="font-medium">{formatCurrency(item.total_price)}</span>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-slate-50 flex justify-between items-center">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-bold">{formatCurrency(order.total_amount)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-lg font-medium">Total da Mesa</span>
            <span className="text-2xl font-bold text-slate-800">{formatCurrency(totalMesa)}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => setView('menu')}
              className="py-3 bg-blue-500 text-white rounded-xl font-medium flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Adicionar
            </button>
            <button 
              onClick={() => setView('payment')}
              className="py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium flex items-center justify-center gap-2"
            >
              <CreditCard className="w-5 h-5" />
              Fechar Conta
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Tela de Pagamento
  if (view === 'payment') {
    const totalMesa = tableOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0)

    async function closeTable() {
      if (!selectedTable || !storeId) return
      setSending(true)

      // Buscar caixa aberto
      const { data: openRegister } = await supabase
        .from('cash_registers')
        .select('id')
        .eq('store_id', storeId)
        .eq('status', 'open')
        .single()

      // Atualizar status dos pedidos para completed (batch)
      const orderIds = tableOrders.map(o => o.id)
      await supabase.from('orders').update({ 
        status: 'completed',
        payment_method: selectedPayment,
        payment_status: 'paid'
      }).in('id', orderIds)

      // Registrar no caixa (cash_movements) - batch insert
      const cashMovements = tableOrders.map(order => ({
        store_id: storeId,
        register_id: openRegister?.id || null,
        type: 'sale',
        amount: order.total_amount,
        description: `Mesa ${selectedTable.number} - Pedido #${order.order_number || order.id.slice(0,6)}`,
        payment_method: selectedPayment,
        order_id: order.id,
        created_by_name: waiterName
      }))
      
      if (cashMovements.length > 0) {
        await supabase.from('cash_movements').insert(cashMovements)
      }

      // Liberar mesa
      await supabase.from('tables').update({ status: 'available' }).eq('id', selectedTable.id)

      setSending(false)
      setView('tables')
      setSelectedTable(null)
      loadData(storeId)
    }

    return (
      <div className="min-h-screen bg-slate-100 pb-32">
        <div className="bg-white shadow-sm sticky top-0 z-10 p-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setView('orders')} className="p-2 hover:bg-slate-100 rounded-xl">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <p className="text-sm text-slate-500">Mesa {selectedTable?.number}</p>
              <h1 className="text-xl font-bold">Fechar Conta</h1>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Resumo */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="font-bold mb-3">Resumo</h3>
            {tableOrders.map(order => (
              <div key={order.id} className="flex justify-between py-2 border-b last:border-0">
                <span className="text-slate-600">Pedido #{order.order_number || order.id.slice(0,6)}</span>
                <span className="font-medium">{formatCurrency(order.total_amount)}</span>
              </div>
            ))}
            <div className="flex justify-between pt-3 mt-2 border-t">
              <span className="font-bold">Total</span>
              <span className="text-xl font-bold text-green-600">{formatCurrency(totalMesa)}</span>
            </div>
          </div>

          {/* Forma de Pagamento */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="font-bold mb-3">Forma de Pagamento</h3>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setSelectedPayment('cash')}
                className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all ${
                  selectedPayment === 'cash' 
                    ? 'bg-green-100 border-2 border-green-500' 
                    : 'bg-slate-50 border-2 border-transparent'
                }`}
              >
                <Banknote className={`w-8 h-8 ${selectedPayment === 'cash' ? 'text-green-600' : 'text-slate-400'}`} />
                <span className="text-sm font-medium">Dinheiro</span>
              </button>
              <button
                onClick={() => setSelectedPayment('card')}
                className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all ${
                  selectedPayment === 'card' 
                    ? 'bg-blue-100 border-2 border-blue-500' 
                    : 'bg-slate-50 border-2 border-transparent'
                }`}
              >
                <CreditCard className={`w-8 h-8 ${selectedPayment === 'card' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className="text-sm font-medium">Cartão</span>
              </button>
              <button
                onClick={() => setSelectedPayment('pix')}
                className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all ${
                  selectedPayment === 'pix' 
                    ? 'bg-purple-100 border-2 border-purple-500' 
                    : 'bg-slate-50 border-2 border-transparent'
                }`}
              >
                <QrCode className={`w-8 h-8 ${selectedPayment === 'pix' ? 'text-purple-600' : 'text-slate-400'}`} />
                <span className="text-sm font-medium">PIX</span>
              </button>
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
          <button 
            onClick={closeTable}
            disabled={sending}
            className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Check className="w-5 h-5" />
                Confirmar Pagamento
              </>
            )}
          </button>
        </div>
      </div>
    )
  }

  // Tela de Histórico
  if (view === 'history') {
    const totalHoje = waiterHistory.reduce((sum, o) => sum + (o.total_amount || 0), 0)
    
    return (
      <div className="min-h-screen bg-slate-100 pb-8">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setView('tables')} className="p-2 hover:bg-white/20 rounded-xl">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex-1">
              <p className="text-blue-100 text-sm">Meu Histórico</p>
              <h1 className="text-xl font-bold">Hoje</h1>
            </div>
            <button 
              onClick={loadWaiterHistory}
              className="p-2 hover:bg-white/20 rounded-xl"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Resumo */}
        <div className="p-4">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 text-white">
            <p className="text-green-100">Total Vendido Hoje</p>
            <p className="text-3xl font-bold">{formatCurrency(totalHoje)}</p>
            <p className="text-green-200 text-sm mt-1">{waiterHistory.length} pedidos</p>
          </div>
        </div>

        {/* Lista */}
        <div className="px-4 space-y-3">
          {waiterHistory.map(order => (
            <div key={order.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold">#{order.order_number || order.id.slice(0,6)}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  order.status === 'completed' ? 'bg-green-100 text-green-700' :
                  order.status === 'ready' ? 'bg-blue-100 text-blue-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {order.status === 'completed' ? 'Finalizado' : order.status}
                </span>
              </div>
              <div className="text-sm text-slate-600">
                {order.items?.slice(0, 2).map(i => `${i.quantity}x ${i.product_name}`).join(', ')}
                {order.items && order.items.length > 2 && ` +${order.items.length - 2} itens`}
              </div>
              <div className="mt-2 pt-2 border-t flex justify-between">
                <span className="text-slate-500">Total</span>
                <span className="font-bold">{formatCurrency(order.total_amount)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return null
}
