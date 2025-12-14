'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { 
  User, UtensilsCrossed, ShoppingBag, Plus, Minus, 
  Send, X, Check, Clock, ChefHat, Loader2,
  Search, ArrowLeft, Bell, Home
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
  const [view, setView] = useState<'tables' | 'menu' | 'cart'>('tables')

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
  }

  function handleLogin() {
    if (waiterName.trim()) {
      setIsLoggedIn(true)
      localStorage.setItem('waiter_name', waiterName)
    }
  }

  function selectTable(table: Table) {
    setSelectedTable(table)
    setView('menu')
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
            <button className="p-2 bg-white/20 rounded-xl">
              <Bell className="w-6 h-6" />
            </button>
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
}
