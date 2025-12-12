'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Info, Building2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getPlanById, updatePlan, getTenantsByPlan, type Plan } from '@/lib/superadmin/plans'

export default function EditPlanPage({ params }: { params: { planId: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [tenants, setTenants] = useState<Array<{id: string, name: string, created_at: string}>>([])
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    price_monthly_cents: 0,
    price_yearly_cents: 0,
    is_active: true,
    features_note: ''
  })

  useEffect(() => {
    loadData()
  }, [params.planId])

  async function loadData() {
    try {
      setLoading(true)
      const [planData, tenantsData] = await Promise.all([
        getPlanById(params.planId),
        getTenantsByPlan(params.planId)
      ])

      if (!planData) {
        alert('Plano não encontrado')
        router.push('/admin/plans')
        return
      }

      setPlan(planData)
      setTenants(tenantsData)

      const features = planData.features as any
      setFormData({
        name: planData.name,
        slug: planData.slug,
        price_monthly_cents: planData.price_monthly_cents,
        price_yearly_cents: planData.price_yearly_cents || 0,
        is_active: planData.is_active,
        features_note: features?.note || ''
      })
    } catch (err) {
      console.error('Erro ao carregar plano:', err)
      alert('Erro ao carregar plano')
      router.push('/admin/plans')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    try {
      setSubmitting(true)

      const features = formData.features_note 
        ? { note: formData.features_note }
        : null

      await updatePlan(params.planId, {
        name: formData.name,
        slug: formData.slug,
        price_monthly_cents: formData.price_monthly_cents,
        price_yearly_cents: formData.price_yearly_cents || null,
        features,
        is_active: formData.is_active
      })

      router.push('/admin/plans')
    } catch (err) {
      console.error('Erro ao atualizar plano:', err)
      alert('Erro ao atualizar plano. Verifique os dados e tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando plano...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/admin/plans">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Planos
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">Editar Plano</h1>
          <p className="text-gray-600 mt-1">Atualize as informações do plano</p>
        </div>

        <div className="space-y-6">
          {/* Formulário */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Plano</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Nome */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nome do Plano *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Básico, Profissional, Premium"
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                    required
                    disabled={submitting}
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Slug (identificador único) *
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    placeholder="Ex: basic, pro, premium"
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none font-mono text-sm"
                    required
                    disabled={submitting}
                  />
                </div>

                {/* Preços */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Preço Mensal (em centavos) *
                    </label>
                    <input
                      type="number"
                      value={formData.price_monthly_cents}
                      onChange={(e) => setFormData({ ...formData, price_monthly_cents: parseInt(e.target.value) || 0 })}
                      placeholder="Ex: 4900 (R$ 49,00)"
                      className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                      required
                      min="0"
                      disabled={submitting}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      {formData.price_monthly_cents > 0 
                        ? `R$ ${(formData.price_monthly_cents / 100).toFixed(2)}`
                        : 'R$ 0,00'
                      }
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Preço Anual (em centavos)
                    </label>
                    <input
                      type="number"
                      value={formData.price_yearly_cents}
                      onChange={(e) => setFormData({ ...formData, price_yearly_cents: parseInt(e.target.value) || 0 })}
                      placeholder="Ex: 49000 (R$ 490,00)"
                      className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                      min="0"
                      disabled={submitting}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      {formData.price_yearly_cents > 0 
                        ? `R$ ${(formData.price_yearly_cents / 100).toFixed(2)}`
                        : 'Opcional'
                      }
                    </p>
                  </div>
                </div>

                {/* Features Note */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Descrição das Features (opcional)
                  </label>
                  <textarea
                    value={formData.features_note}
                    onChange={(e) => setFormData({ ...formData, features_note: e.target.value })}
                    placeholder="Ex: Inclui PDV, Delivery, CRM básico..."
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                    rows={3}
                    disabled={submitting}
                  />
                </div>

                {/* Status */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                    disabled={submitting}
                  />
                  <label htmlFor="is_active" className="text-sm font-semibold text-gray-700">
                    Plano Ativo (disponível para seleção)
                  </label>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-semibold mb-1">Informação Importante</p>
                    <p>
                      Campos de features e limites ainda não são usados para bloqueio de funcionalidades. 
                      Eles foram deixados prontos para uma futura fase de controle por plano.
                    </p>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      'Salvar Alterações'
                    )}
                  </Button>
                  <Link href="/admin/plans">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={submitting}
                    >
                      Cancelar
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Tenants neste Plano */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Tenants neste Plano ({tenants.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tenants.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>Nenhum tenant vinculado a este plano ainda</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tenants.map((tenant) => (
                    <div key={tenant.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div>
                        <p className="font-semibold text-gray-900">{tenant.name}</p>
                        <p className="text-sm text-gray-500">
                          Criado em: {new Date(tenant.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <Link href="/admin/tenants">
                        <Button variant="outline" size="sm">
                          Ver Tenant
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
