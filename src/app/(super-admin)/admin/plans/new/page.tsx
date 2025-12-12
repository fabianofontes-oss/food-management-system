'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Info } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createPlan } from '@/lib/superadmin/plans'

export default function NewPlanPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    price_monthly_cents: 0,
    price_yearly_cents: 0,
    is_active: true,
    features_note: ''
  })

  function handleNameChange(name: string) {
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    setFormData(prev => ({ ...prev, name, slug }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    try {
      setSubmitting(true)

      const features = formData.features_note 
        ? { note: formData.features_note }
        : null

      await createPlan({
        name: formData.name,
        slug: formData.slug,
        price_monthly_cents: formData.price_monthly_cents,
        price_yearly_cents: formData.price_yearly_cents || null,
        currency: 'BRL',
        features,
        is_active: formData.is_active
      })

      router.push('/admin/plans')
    } catch (err) {
      console.error('Erro ao criar plano:', err)
      alert('Erro ao criar plano. Verifique os dados e tente novamente.')
    } finally {
      setSubmitting(false)
    }
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
          <h1 className="text-4xl font-bold text-gray-900">Criar Novo Plano</h1>
          <p className="text-gray-600 mt-1">Adicione um novo plano de assinatura</p>
        </div>

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
                  onChange={(e) => handleNameChange(e.target.value)}
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
                <p className="text-sm text-gray-500 mt-1">
                  Usado internamente. Apenas letras minúsculas, números e hífens.
                </p>
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
                <p className="text-sm text-gray-500 mt-1">
                  Texto livre para descrever as funcionalidades incluídas.
                </p>
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
                      Criando...
                    </>
                  ) : (
                    'Criar Plano'
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
      </div>
    </div>
  )
}
