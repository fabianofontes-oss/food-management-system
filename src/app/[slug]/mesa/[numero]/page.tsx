'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { 
  Utensils, Bell, Receipt, Users, Clock, CheckCircle, 
  Loader2, Coffee, UtensilsCrossed, Droplets, CreditCard,
  ChevronRight, Star, Plus, Minus, ShoppingCart, X
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Table {
  id: string
  number: string
  capacity: number
  status: string
  current_order_id: string | null
}

interface Order {
  id: string
  order_code: string
  total_amount: number
  status: string
  items: any[]
}

interface Category {
  id: string
  name: string
  products: Product[]
}

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
}

export default function MesaClientePage() {
  const params = useParams()
  const slug = params.slug as string
  const numero = params.numero as string
  const supabase = useMemo(() => createClient(), [])

  const [loading, setLoading] = useState(true)
  const [storeId, setStoreId] = useState<string | null>(null)
  const [storeName, setStoreName] = useState('')
  const [table, setTable] = useState<Table | null>(null)
  const [order, setOrder] = useState<Order | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [callingWaiter, setCallingWaiter] = useState(false)
  const [callSuccess, setCallSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState<'menu' | 'order' | 'call'>('menu')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        // Buscar loja
        const { data: storeData } = await supabase
          .from('stores')
          .select('id, name')
          .eq('slug', slug)
          .single()

        if (!storeData) {
          setLoading(false)
          return
        }

        setStoreId(storeData.id)
        setStoreName(storeData.name)

        // Buscar mesa
        const { data: tableData } = await supabase
          .from('tables')
          .select('*')
          .eq('store_id', storeData.id)
          .eq('number', numero)
          .single()

        if (tableData) {
          setTable(tableData)

          // Buscar pedido atual se houver
          if (tableData.current_order_id) {
            const { data: orderData } = await supabase
              .from('orders')
              .select('*')
              .eq('id', tableData.current_order_id)
              .single()

            if (orderData) setOrder(orderData)
          }
        }

        // Buscar categorias e produtos
        const { data: categoriesData } = await supabase
          .from('categories')
          .select(`
            id, name,
            products:products(id, name, description, price, image_url)
          `)
          .eq('store_id', storeData.id)
          .eq('is_active', true)
          .order('display_order')

        if (categoriesData) {
          setCategories(categoriesData.filter((c: Category) => c.products && c.products.length > 0))
          if (categoriesData.length > 0) {
            setSelectedCategory(categoriesData[0].id)
          }
        }

      } catch (err) {
        console.error('Erro:', err)
      } finally {
        setLoading(false)
      }
    }

    if (slug && numero) loadData()
  }, [slug, numero, supabase])

  const handleCallWaiter = async (callType: string) => {
    if (!table || !storeId) return
    
    setCallingWaiter(true)
    try {
      await supabase.from('waiter_calls').insert({
        store_id: storeId,
        table_id: table.id,
        call_type: callType,
        status: 'pending'
      })

      await supabase.from('tables').update({
        waiter_called: true,
        waiter_called_at: new Date().toISOString()
      }).eq('id', table.id)

      setCallSuccess(true)
      setTimeout(() => setCallSuccess(false), 3000)
    } catch (err) {
      console.error('Erro:', err)
      alert('Erro ao chamar garçom')
    } finally {
      setCallingWaiter(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      </div>
    )
  }

  if (!table) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center max-w-md">
          <Utensils className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Mesa não encontrada</h1>
          <p className="text-slate-500 mb-6">A mesa {numero} não existe ou não está disponível</p>
          <Link href={`/${slug}`}>
            <Button className="bg-orange-500 hover:bg-orange-600">
              Ver Cardápio
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-4 sticky top-0 z-40">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">{storeName}</p>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Utensils className="w-5 h-5" />
              Mesa {table.number}
            </h1>
          </div>
          {order && (
            <div className="text-right">
              <p className="text-sm opacity-90">Pedido</p>
              <p className="font-bold">{formatCurrency(order.total_amount)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b sticky top-[72px] z-30">
        <div className="max-w-lg mx-auto flex">
          <button
            onClick={() => setActiveTab('menu')}
            className={`flex-1 py-3 text-center font-medium transition-colors ${
              activeTab === 'menu' 
                ? 'text-orange-600 border-b-2 border-orange-500' 
                : 'text-slate-500'
            }`}
          >
            🍽️ Cardápio
          </button>
          <button
            onClick={() => setActiveTab('order')}
            className={`flex-1 py-3 text-center font-medium transition-colors ${
              activeTab === 'order' 
                ? 'text-orange-600 border-b-2 border-orange-500' 
                : 'text-slate-500'
            }`}
          >
            📋 Meu Pedido
          </button>
          <button
            onClick={() => setActiveTab('call')}
            className={`flex-1 py-3 text-center font-medium transition-colors ${
              activeTab === 'call' 
                ? 'text-orange-600 border-b-2 border-orange-500' 
                : 'text-slate-500'
            }`}
          >
            🔔 Chamar
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 pb-24">
        {/* Tab: Cardápio */}
        {activeTab === 'menu' && (
          <div className="space-y-4">
            {/* Categorias */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-orange-500 text-white'
                      : 'bg-white text-slate-600 border'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Produtos */}
            <div className="space-y-3">
              {categories
                .find(c => c.id === selectedCategory)
                ?.products.map(product => (
                  <div key={product.id} className="bg-white rounded-2xl p-4 shadow-sm flex gap-4">
                    {product.image_url && (
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="w-20 h-20 rounded-xl object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-800">{product.name}</h3>
                      {product.description && (
                        <p className="text-sm text-slate-500 line-clamp-2">{product.description}</p>
                      )}
                      <p className="text-lg font-bold text-orange-600 mt-1">
                        {formatCurrency(product.price)}
                      </p>
                    </div>
                  </div>
                ))}
            </div>

            <div className="text-center py-8 text-slate-400 text-sm">
              Para fazer pedidos, chame o garçom
            </div>
          </div>
        )}

        {/* Tab: Meu Pedido */}
        {activeTab === 'order' && (
          <div className="space-y-4">
            {order ? (
              <>
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-slate-800">Pedido #{order.order_code}</h2>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {order.status === 'preparing' ? 'Preparando' : order.status}
                    </span>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg">
                      <span className="font-medium">Total</span>
                      <span className="font-bold text-orange-600">{formatCurrency(order.total_amount)}</span>
                    </div>
                  </div>
                </div>

                {/* Dividir conta */}
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-3">Dividir Conta</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {[2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        className="p-3 bg-slate-50 rounded-xl text-center hover:bg-orange-50 transition-colors"
                      >
                        <Users className="w-5 h-5 mx-auto mb-1 text-slate-600" />
                        <p className="text-xs text-slate-500">{n} pessoas</p>
                        <p className="font-bold text-orange-600">
                          {formatCurrency(order.total_amount / n)}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
                <Receipt className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h2 className="text-lg font-bold text-slate-800 mb-2">Nenhum pedido</h2>
                <p className="text-slate-500">Chame o garçom para fazer seu pedido</p>
              </div>
            )}
          </div>
        )}

        {/* Tab: Chamar Garçom */}
        {activeTab === 'call' && (
          <div className="space-y-4">
            {callSuccess ? (
              <div className="bg-green-50 rounded-2xl p-8 text-center border-2 border-green-200">
                <div className="w-20 h-20 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-green-800 mb-2">Garçom chamado!</h2>
                <p className="text-green-600">Aguarde, já estamos indo até você</p>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-lg font-bold text-slate-800">O que você precisa?</h2>
                  <p className="text-slate-500">Selecione uma opção abaixo</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleCallWaiter('assistance')}
                    disabled={callingWaiter}
                    className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg hover:scale-105 transition-all text-center border-2 border-transparent hover:border-orange-300"
                  >
                    <div className="w-14 h-14 mx-auto mb-3 bg-orange-100 rounded-2xl flex items-center justify-center">
                      <Bell className="w-7 h-7 text-orange-600" />
                    </div>
                    <h3 className="font-bold text-slate-800">Garçom</h3>
                    <p className="text-xs text-slate-500">Atendimento geral</p>
                  </button>

                  <button
                    onClick={() => handleCallWaiter('order')}
                    disabled={callingWaiter}
                    className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg hover:scale-105 transition-all text-center border-2 border-transparent hover:border-blue-300"
                  >
                    <div className="w-14 h-14 mx-auto mb-3 bg-blue-100 rounded-2xl flex items-center justify-center">
                      <UtensilsCrossed className="w-7 h-7 text-blue-600" />
                    </div>
                    <h3 className="font-bold text-slate-800">Fazer Pedido</h3>
                    <p className="text-xs text-slate-500">Quero pedir</p>
                  </button>

                  <button
                    onClick={() => handleCallWaiter('water')}
                    disabled={callingWaiter}
                    className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg hover:scale-105 transition-all text-center border-2 border-transparent hover:border-cyan-300"
                  >
                    <div className="w-14 h-14 mx-auto mb-3 bg-cyan-100 rounded-2xl flex items-center justify-center">
                      <Droplets className="w-7 h-7 text-cyan-600" />
                    </div>
                    <h3 className="font-bold text-slate-800">Água</h3>
                    <p className="text-xs text-slate-500">Preciso de água</p>
                  </button>

                  <button
                    onClick={() => handleCallWaiter('bill')}
                    disabled={callingWaiter}
                    className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg hover:scale-105 transition-all text-center border-2 border-transparent hover:border-green-300"
                  >
                    <div className="w-14 h-14 mx-auto mb-3 bg-green-100 rounded-2xl flex items-center justify-center">
                      <CreditCard className="w-7 h-7 text-green-600" />
                    </div>
                    <h3 className="font-bold text-slate-800">Conta</h3>
                    <p className="text-xs text-slate-500">Fechar a conta</p>
                  </button>
                </div>

                {callingWaiter && (
                  <div className="text-center py-4">
                    <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto" />
                    <p className="text-slate-500 mt-2">Chamando...</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer fixo */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 safe-area-bottom">
        <div className="max-w-lg mx-auto">
          <Link href={`/${slug}`}>
            <Button variant="outline" className="w-full">
              Ver Cardápio Completo
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
