'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Ticket, Plus, Edit2, Trash2, Power, Loader2, AlertCircle, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { getCoupons, createCoupon, updateCoupon, deleteCoupon, toggleCouponStatus, type Coupon, type CouponType } from '@/lib/coupons/actions'
import { formatCouponValue, isCouponDateValid, hasUsesRemaining } from '@/lib/coupons/utils'

export default function CouponsPage() {
  const params = useParams()
  const slug = params.slug as string
  
  const [storeId, setStoreId] = useState<string | null>(null)
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    type: 'percent' as CouponType,
    value: '',
    is_active: true,
    starts_at: '',
    ends_at: '',
    max_uses: '',
    min_order_amount: ''
  })

  useEffect(() => {
    loadStore()
  }, [slug])

  useEffect(() => {
    if (storeId) {
      loadCoupons()
    }
  }, [storeId])

  async function loadStore() {
    const { data } = await supabase
      .from('stores')
      .select('id')
      .eq('slug', slug)
      .single()
    
    if (data) {
      setStoreId(data.id)
    }
  }

  async function loadCoupons() {
    if (!storeId) return
    
    setLoading(true)
    setError('')
    
    try {
      const data = await getCoupons(storeId)
      setCoupons(data)
    } catch (err) {
      console.error('Error loading coupons:', err)
      setError('Erro ao carregar cupons')
    } finally {
      setLoading(false)
    }
  }

  function openCreateModal() {
    setEditingCoupon(null)
    setFormData({
      code: '',
      type: 'percent',
      value: '',
      is_active: true,
      starts_at: '',
      ends_at: '',
      max_uses: '',
      min_order_amount: ''
    })
    setShowModal(true)
  }

  function openEditModal(coupon: Coupon) {
    setEditingCoupon(coupon)
    setFormData({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value.toString(),
      is_active: coupon.is_active,
      starts_at: coupon.starts_at ? coupon.starts_at.split('T')[0] : '',
      ends_at: coupon.ends_at ? coupon.ends_at.split('T')[0] : '',
      max_uses: coupon.max_uses?.toString() || '',
      min_order_amount: coupon.min_order_amount?.toString() || ''
    })
    setShowModal(true)
  }

  function validateForm(): string | null {
    if (!formData.code.trim()) {
      return 'Código é obrigatório'
    }
    
    if (!/^[A-Z0-9]+$/.test(formData.code.toUpperCase())) {
      return 'Código deve conter apenas letras e números'
    }

    const value = parseFloat(formData.value)
    if (isNaN(value) || value <= 0) {
      return 'Valor deve ser maior que zero'
    }

    if (formData.type === 'percent' && (value < 1 || value > 100)) {
      return 'Porcentagem deve estar entre 1 e 100'
    }

    if (formData.max_uses && parseInt(formData.max_uses) < 1) {
      return 'Usos máximos deve ser pelo menos 1'
    }

    if (formData.starts_at && formData.ends_at) {
      const start = new Date(formData.starts_at)
      const end = new Date(formData.ends_at)
      if (end < start) {
        return 'Data final deve ser posterior à data inicial'
      }
    }

    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    if (!storeId) return

    setSaving(true)
    setError('')

    try {
      const couponData = {
        store_id: storeId,
        code: formData.code.toUpperCase().trim(),
        type: formData.type,
        value: parseFloat(formData.value),
        is_active: formData.is_active,
        starts_at: formData.starts_at || null,
        ends_at: formData.ends_at || null,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : null
      }

      if (editingCoupon) {
        await updateCoupon(editingCoupon.id, couponData)
      } else {
        await createCoupon(couponData)
      }

      setShowModal(false)
      await loadCoupons()
    } catch (err: any) {
      console.error('Error saving coupon:', err)
      setError(err.message || 'Erro ao salvar cupom')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleStatus(coupon: Coupon) {
    try {
      await toggleCouponStatus(coupon.id, !coupon.is_active)
      await loadCoupons()
    } catch (err) {
      console.error('Error toggling coupon:', err)
      setError('Erro ao alterar status do cupom')
    }
  }

  async function handleDelete(coupon: Coupon) {
    if (!confirm(`Tem certeza que deseja excluir o cupom ${coupon.code}?`)) {
      return
    }

    try {
      await deleteCoupon(coupon.id)
      await loadCoupons()
    } catch (err) {
      console.error('Error deleting coupon:', err)
      setError('Erro ao excluir cupom')
    }
  }

  function getCouponStatus(coupon: Coupon): { label: string; color: string } {
    if (!coupon.is_active) {
      return { label: 'Inativo', color: 'bg-gray-100 text-gray-700' }
    }
    
    if (!isCouponDateValid(coupon)) {
      return { label: 'Expirado', color: 'bg-red-100 text-red-700' }
    }
    
    if (!hasUsesRemaining(coupon)) {
      return { label: 'Esgotado', color: 'bg-orange-100 text-orange-700' }
    }
    
    return { label: 'Ativo', color: 'bg-green-100 text-green-700' }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-3">
              <Ticket className="w-8 h-8 md:w-10 md:h-10 text-purple-600" />
              Cupons de Desconto
            </h1>
            <p className="text-gray-600 mt-1">Gerencie cupons para checkout e PDV</p>
          </div>
          <Button
            onClick={openCreateModal}
            className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Novo Cupom
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700">{error}</p>
            <button onClick={() => setError('')} className="ml-auto">
              <X className="w-5 h-5 text-red-600" />
            </button>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
            <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Carregando cupons...</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
            <Ticket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhum cupom cadastrado</h3>
            <p className="text-gray-600 mb-6">Crie seu primeiro cupom de desconto</p>
            <Button onClick={openCreateModal} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-5 h-5 mr-2" />
              Criar Cupom
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Código</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Tipo</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Valor</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Validade</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Usos</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {coupons.map((coupon) => {
                    const status = getCouponStatus(coupon)
                    return (
                      <tr key={coupon.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <span className="font-mono font-bold text-purple-600">{coupon.code}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">
                            {coupon.type === 'percent' ? 'Porcentagem' : 'Valor Fixo'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-gray-900">
                            {formatCouponValue(coupon.type, coupon.value)}
                          </span>
                          {coupon.min_order_amount && (
                            <div className="text-xs text-gray-500">
                              Mín: R$ {coupon.min_order_amount.toFixed(2)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {coupon.starts_at && (
                            <div>De: {new Date(coupon.starts_at).toLocaleDateString('pt-BR')}</div>
                          )}
                          {coupon.ends_at && (
                            <div>Até: {new Date(coupon.ends_at).toLocaleDateString('pt-BR')}</div>
                          )}
                          {!coupon.starts_at && !coupon.ends_at && (
                            <span className="text-gray-400">Sem limite</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {coupon.uses_count} / {coupon.max_uses || '∞'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleToggleStatus(coupon)}
                              className={`p-2 rounded-lg transition-colors ${
                                coupon.is_active
                                  ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                              title={coupon.is_active ? 'Desativar' : 'Ativar'}
                            >
                              <Power className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditModal(coupon)}
                              className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(coupon)}
                              className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingCoupon ? 'Editar Cupom' : 'Novo Cupom'}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Código *
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none font-mono"
                      placeholder="DESCONTO10"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as CouponType })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                    >
                      <option value="percent">Porcentagem (%)</option>
                      <option value="fixed">Valor Fixo (R$)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valor * {formData.type === 'percent' ? '(1-100)' : '(R$)'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                      placeholder={formData.type === 'percent' ? '10' : '50.00'}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pedido Mínimo (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.min_order_amount}
                      onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data Inicial
                    </label>
                    <input
                      type="date"
                      value={formData.starts_at}
                      onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data Final
                    </label>
                    <input
                      type="date"
                      value={formData.ends_at}
                      onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Usos Máximos
                  </label>
                  <input
                    type="number"
                    value={formData.max_uses}
                    onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                    placeholder="Ilimitado"
                    min="1"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-5 h-5 text-purple-600"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                    Cupom ativo
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    onClick={() => setShowModal(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5 mr-2" />
                        {editingCoupon ? 'Atualizar' : 'Criar'}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
