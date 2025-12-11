'use client'

import Link from 'next/link'
import { Store, Settings, ShoppingBag, BarChart3, Users, Clock, DollarSign, Package, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useProducts } from '@/hooks/useProducts'
import { useOrders } from '@/hooks/useOrders'

export default function LojistaPage() {
  const { products, loading: loadingProducts } = useProducts()
  const { orders, loading: loadingOrders } = useOrders()

  const today = new Date().toISOString().split('T')[0]
  const ordersToday = orders.filter(o => o.created_at.startsWith(today))
  const vendasHoje = ordersToday.reduce((sum, o) => sum + o.total_amount, 0)
  const pedidosHoje = ordersToday.length
  const ticketMedio = pedidosHoje > 0 ? vendasHoje / pedidosHoje : 0

  if (loadingProducts || loadingOrders) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-green-600 to-green-700 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 mb-4">
            <Store className="w-12 h-12" />
            <div>
              <h1 className="text-3xl font-bold">Área do Lojista</h1>
              <p className="text-green-100">Gerencie sua loja</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Vendas Hoje</span>
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-600">{formatCurrency(vendasHoje)}</p>
            <p className="text-xs text-gray-500 mt-1">Dados reais do Supabase</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Pedidos Hoje</span>
              <ShoppingBag className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-blue-600">{pedidosHoje}</p>
            <p className="text-xs text-gray-500 mt-1">Tempo real</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Ticket Médio</span>
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-purple-600">{formatCurrency(ticketMedio)}</p>
            <p className="text-xs text-gray-500 mt-1">Calculado automaticamente</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Total de Produtos</span>
              <Package className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-orange-600">{products.length}</p>
            <p className="text-xs text-gray-500 mt-1">Cadastrados no sistema</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/lojista/configuracoes" className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Settings className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">Configurações</h3>
                <p className="text-sm text-gray-600">Dados da loja, horários, taxas</p>
              </div>
            </div>
          </Link>

          <Link href="/lojista/cardapio" className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">Cardápio</h3>
                <p className="text-sm text-gray-600">Produtos, categorias, preços</p>
              </div>
            </div>
          </Link>

          <Link href="/lojista/pedidos" className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">Pedidos</h3>
                <p className="text-sm text-gray-600">Acompanhe todos os pedidos</p>
              </div>
            </div>
          </Link>

          <Link href="/lojista/relatorios" className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">Relatórios</h3>
                <p className="text-sm text-gray-600">Vendas, produtos, clientes</p>
              </div>
            </div>
          </Link>

          <Link href="/lojista/clientes" className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-pink-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">Clientes</h3>
                <p className="text-sm text-gray-600">Base de clientes e histórico</p>
              </div>
            </div>
          </Link>

          <Link href="/lojista/horarios" className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">Horários</h3>
                <p className="text-sm text-gray-600">Funcionamento e pausas</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
