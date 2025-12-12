'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CreditCard, Plus, Edit, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getAllPlans, formatPrice, type Plan } from '@/lib/superadmin/plans'

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPlans()
  }, [])

  async function loadPlans() {
    try {
      setLoading(true)
      const data = await getAllPlans()
      setPlans(data)
    } catch (err) {
      console.error('Erro ao carregar planos:', err)
      setError('Erro ao carregar planos')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando planos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={loadPlans} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Gestão de Planos</h1>
            <p className="text-gray-600 mt-1">Gerenciar planos de assinatura do SaaS</p>
          </div>
          <Link href="/admin/plans/new">
            <Button className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800">
              <Plus className="w-5 h-5 mr-2" />
              Novo Plano
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total de Planos</p>
                  <p className="text-3xl font-bold text-gray-900">{plans.length}</p>
                </div>
                <CreditCard className="w-12 h-12 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Planos Ativos</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {plans.filter(p => p.is_active).length}
                  </p>
                </div>
                <CreditCard className="w-12 h-12 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Planos Inativos</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {plans.filter(p => !p.is_active).length}
                  </p>
                </div>
                <CreditCard className="w-12 h-12 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Planos */}
        {plans.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhum plano cadastrado ainda
              </h3>
              <p className="text-gray-500 mb-6">
                Crie ao menos um plano para vincular aos tenants.
              </p>
              <Link href="/admin/plans/new">
                <Button className="bg-gradient-to-r from-indigo-600 to-indigo-700">
                  <Plus className="w-5 h-5 mr-2" />
                  Criar Primeiro Plano
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Nome</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Slug</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Preço Mensal</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Preço Anual</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Status</th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                  <tr key={plan.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6 font-medium text-gray-900">{plan.name}</td>
                    <td className="py-4 px-6">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">{plan.slug}</code>
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {formatPrice(plan.price_monthly_cents, plan.currency)}
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {plan.price_yearly_cents 
                        ? formatPrice(plan.price_yearly_cents, plan.currency)
                        : '-'
                      }
                    </td>
                    <td className="py-4 px-6">
                      {plan.is_active ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">
                          Ativo
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded-full">
                          Inativo
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link href={`/admin/plans/${plan.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-indigo-600 border-indigo-300 hover:bg-indigo-50"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
