'use client'

import Link from 'next/link'
import { Store, Settings, ShoppingBag, BarChart3, Users, Clock, DollarSign, Package } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function LojistaPage() {
  const stats = {
    vendasHoje: 1250.00,
    pedidosHoje: 45,
    ticketMedio: 27.78,
    clientesAtivos: 328
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
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.vendasHoje)}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Pedidos Hoje</span>
              <ShoppingBag className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.pedidosHoje}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Ticket Médio</span>
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.ticketMedio)}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Clientes Ativos</span>
              <Users className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.clientesAtivos}</p>
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
