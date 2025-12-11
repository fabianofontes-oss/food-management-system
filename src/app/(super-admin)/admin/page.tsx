'use client'

import Link from 'next/link'
import { DollarSign, Store, TrendingUp, Activity, Building2, MapPin, ArrowRight, Users, ShoppingBag } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function SuperAdminDashboard() {
  const kpis = [
    {
      title: 'MRR Mensal',
      value: 'R$ 152.400,00',
      change: '+12.5%',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: 'up'
    },
    {
      title: 'Lojas Ativas',
      value: '48',
      change: '+8',
      icon: Store,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: 'up'
    },
    {
      title: 'Novos Tenants (Mês)',
      value: '12',
      change: '+3',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      trend: 'up'
    },
    {
      title: 'Taxa de Erros',
      value: '0.01%',
      change: '-0.02%',
      icon: Activity,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      trend: 'down'
    }
  ]

  const recentStores = [
    { id: 1, name: 'Açaí Sabor Real', tenant: 'Rede Açaí Premium', city: 'São Paulo', date: '10/12/2025', status: 'Ativa' },
    { id: 2, name: 'Burger House Centro', tenant: 'Burger House Franquia', city: 'Rio de Janeiro', date: '09/12/2025', status: 'Ativa' },
    { id: 3, name: 'Pizza Express Norte', tenant: 'Pizza Express', city: 'Belo Horizonte', date: '08/12/2025', status: 'Ativa' },
    { id: 4, name: 'Marmita Fit', tenant: 'Independente', city: 'Curitiba', date: '07/12/2025', status: 'Ativa' },
    { id: 5, name: 'Sorvetes Gelato', tenant: 'Gelato Brasil', city: 'Porto Alegre', date: '06/12/2025', status: 'Ativa' }
  ]

  const quickStats = [
    { label: 'Total de Pedidos Hoje', value: '1.247', icon: ShoppingBag, color: 'text-orange-600' },
    { label: 'Usuários Ativos', value: '3.891', icon: Users, color: 'text-indigo-600' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Centro de Comando</h1>
            <p className="text-gray-600">Visão geral do sistema multi-tenant</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-bold flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Sistema Operacional
            </span>
          </div>
        </div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpis.map((kpi, index) => {
            const Icon = kpi.icon
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {kpi.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                    <Icon className={`w-5 h-5 ${kpi.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900 mb-1">{kpi.value}</div>
                  <p className={`text-sm flex items-center gap-1 ${
                    kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <TrendingUp className={`w-4 h-4 ${kpi.trend === 'down' && 'rotate-180'}`} />
                    {kpi.change} vs mês anterior
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index} className="bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                      <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <Icon className={`w-12 h-12 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Ações Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/tenants">
            <Card className="hover:shadow-xl transition-all hover:scale-105 cursor-pointer bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Building2 className="w-12 h-12 mb-4" />
                    <h3 className="text-2xl font-bold mb-2">Gerenciar Tenants</h3>
                    <p className="text-indigo-100">Redes, franquias e grupos empresariais</p>
                  </div>
                  <ArrowRight className="w-8 h-8" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/stores">
            <Card className="hover:shadow-xl transition-all hover:scale-105 cursor-pointer bg-gradient-to-br from-violet-500 to-violet-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <MapPin className="w-12 h-12 mb-4" />
                    <h3 className="text-2xl font-bold mb-2">Ver Todas as Lojas</h3>
                    <p className="text-violet-100">Gestão completa de unidades operacionais</p>
                  </div>
                  <ArrowRight className="w-8 h-8" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Tabela de Atividade Recente */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Últimas Lojas Criadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Loja</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Tenant</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Cidade</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Data</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentStores.map((store) => (
                    <tr key={store.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-medium text-gray-900">{store.name}</td>
                      <td className="py-3 px-4 text-gray-600">{store.tenant}</td>
                      <td className="py-3 px-4 text-gray-600">{store.city}</td>
                      <td className="py-3 px-4 text-gray-600">{store.date}</td>
                      <td className="py-3 px-4">
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                          {store.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="text-center text-gray-500 text-sm py-4">
          <p>Food Management System • Multi-tenant SaaS Platform • v1.0.0</p>
        </div>
      </div>
    </div>
  )
}
