'use client'

import { BarChart3, TrendingUp, ShoppingBag, Users, DollarSign, Package } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function AdminPage() {
  const stats = [
    { label: 'Vendas Hoje', value: formatCurrency(1250.00), icon: DollarSign, color: 'bg-green-500' },
    { label: 'Pedidos Hoje', value: '45', icon: ShoppingBag, color: 'bg-blue-500' },
    { label: 'Clientes', value: '328', icon: Users, color: 'bg-purple-500' },
    { label: 'Produtos', value: '156', icon: Package, color: 'bg-orange-500' },
  ]

  const recentOrders = [
    { code: 'A001', customer: 'João Silva', total: 45.00, status: 'Entregue', time: '10 min' },
    { code: 'A002', customer: 'Maria Santos', total: 32.00, status: 'Em preparo', time: '15 min' },
    { code: 'A003', customer: 'Pedro Costa', total: 28.00, status: 'Pendente', time: '2 min' },
    { code: 'A004', customer: 'Ana Lima', total: 52.00, status: 'Saiu para entrega', time: '25 min' },
    { code: 'A005', customer: 'Carlos Souza', total: 38.00, status: 'Pronto', time: '8 min' },
  ]

  const topProducts = [
    { name: 'Açaí 500ml', sales: 125, revenue: formatCurrency(2250.00) },
    { name: 'Açaí 300ml', sales: 98, revenue: formatCurrency(1176.00) },
    { name: 'Suco Natural 300ml', sales: 87, revenue: formatCurrency(696.00) },
    { name: 'Açaí 700ml', sales: 65, revenue: formatCurrency(1560.00) },
    { name: 'Água Mineral', sales: 54, revenue: formatCurrency(162.00) },
  ]

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Entregue': 'bg-green-100 text-green-700',
      'Em preparo': 'bg-yellow-100 text-yellow-700',
      'Pendente': 'bg-red-100 text-red-700',
      'Saiu para entrega': 'bg-blue-100 text-blue-700',
      'Pronto': 'bg-purple-100 text-purple-700',
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <header className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 shadow-lg">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold">Dashboard Admin</h1>
          <p className="text-red-100 mt-1">Painel Administrativo</p>
        </div>
      </header>

      <div className="container mx-auto p-4 space-y-6">
        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-xl`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <ShoppingBag className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold">Pedidos Recentes</h2>
            </div>
            <div className="space-y-3">
              {recentOrders.map((order, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-bold text-lg">#{order.code}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">{order.customer}</div>
                    <div className="text-xs text-gray-500 mt-1">há {order.time}</div>
                  </div>
                  <div className="text-xl font-bold text-green-600">
                    {formatCurrency(order.total)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-bold">Produtos Mais Vendidos</h2>
            </div>
            <div className="space-y-4">
              {topProducts.map((product, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-600">{product.sales} vendas</div>
                    </div>
                    <div className="text-lg font-bold text-purple-600">{product.revenue}</div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full"
                      style={{ width: `${(product.sales / 125) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Ações Rápidas</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl hover:shadow-md transition-all text-left">
              <Package className="w-8 h-8 text-blue-600 mb-3" />
              <div className="font-bold text-gray-900">Adicionar Produto</div>
              <div className="text-sm text-gray-600 mt-1">Cadastrar novo item</div>
            </button>
            <button className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl hover:shadow-md transition-all text-left">
              <Users className="w-8 h-8 text-green-600 mb-3" />
              <div className="font-bold text-gray-900">Gerenciar Usuários</div>
              <div className="text-sm text-gray-600 mt-1">Equipe e permissões</div>
            </button>
            <button className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl hover:shadow-md transition-all text-left">
              <BarChart3 className="w-8 h-8 text-purple-600 mb-3" />
              <div className="font-bold text-gray-900">Relatórios</div>
              <div className="text-sm text-gray-600 mt-1">Análises e métricas</div>
            </button>
            <button className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl hover:shadow-md transition-all text-left">
              <DollarSign className="w-8 h-8 text-orange-600 mb-3" />
              <div className="font-bold text-gray-900">Financeiro</div>
              <div className="text-sm text-gray-600 mt-1">Vendas e pagamentos</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
