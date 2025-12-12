'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/stores/cart-store'
import { createOrder } from '@/lib/actions/orders'
import { getStoreBySlug } from '@/lib/actions/menu'
import { formatCurrency, fetchAddressByCEP } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2, Search } from 'lucide-react'
import type { OrderData } from '@/types/menu'

export default function CheckoutPage({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const { items, getSubtotal, clearCart } = useCartStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loadingCEP, setLoadingCEP] = useState(false)
  const [checkoutMode, setCheckoutMode] = useState<'guest' | 'phone_required'>('phone_required')
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<string[]>(['CASH'])

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    channel: 'DELIVERY' as 'DELIVERY' | 'TAKEAWAY',
    paymentMethod: 'PIX' as 'PIX' | 'CASH' | 'CARD',
    street: '',
    number: '',
    complement: '',
    district: '',
    city: '',
    state: '',
    zipCode: '',
    reference: '',
    notes: '',
  })

  const subtotal = getSubtotal()
  const deliveryFee = formData.channel === 'DELIVERY' ? 5.00 : 0
  const total = subtotal + deliveryFee

  useEffect(() => {
    async function loadStoreSettings() {
      try {
        const store = await getStoreBySlug(params.slug)
        
        // Carregar modo de checkout
        if (store?.settings?.checkout?.mode) {
          setCheckoutMode(store.settings.checkout.mode)
        }
        
        // Carregar métodos de pagamento disponíveis
        const methods: string[] = []
        if (store?.settings?.payments) {
          if (store.settings.payments.pix?.enabled) {
            methods.push('PIX')
          }
          if (store.settings.payments.cash) {
            methods.push('CASH')
          }
          if (store.settings.payments.card_on_delivery) {
            methods.push('CARD')
          }
        } else {
          // Default: apenas dinheiro se não configurado
          methods.push('CASH')
        }
        
        setAvailablePaymentMethods(methods)
        
        // Se nenhum método disponível, usar o primeiro como fallback
        if (methods.length > 0 && !methods.includes(formData.paymentMethod)) {
          setFormData(prev => ({ ...prev, paymentMethod: methods[0] as any }))
        }
      } catch (err) {
        console.error('Erro ao carregar configurações da loja:', err)
      }
    }
    loadStoreSettings()
  }, [params.slug])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validar telefone baseado no modo de checkout
      if (checkoutMode === 'phone_required' && !formData.phone.trim()) {
        setError('Telefone é obrigatório para finalizar o pedido')
        setLoading(false)
        return
      }

      const store = await getStoreBySlug(params.slug)
      if (!store) {
        setError('Loja não encontrada')
        setLoading(false)
        return
      }

      const orderData: OrderData = {
        customer: {
          name: formData.name,
          phone: formData.phone.trim() || undefined,
          email: formData.email || undefined,
        },
        channel: formData.channel,
        payment_method: formData.paymentMethod,
        notes: formData.notes || undefined,
      }

      if (formData.channel === 'DELIVERY') {
        orderData.delivery_address = {
          street: formData.street,
          number: formData.number,
          complement: formData.complement || undefined,
          district: formData.district,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zipCode,
          reference: formData.reference || undefined,
        }
      }

      const result = await createOrder(store.id, items, orderData)

      if (result.success && result.orderId) {
        clearCart()
        router.push(`/${params.slug}/order/${result.orderId}`)
      } else {
        setError(result.error || 'Erro ao criar pedido')
      }
    } catch (err) {
      setError('Erro ao processar pedido')
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    router.push(`/${params.slug}`)
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Finalizar Pedido</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg p-6 shadow-sm space-y-4">
            <h2 className="font-bold text-lg">Dados pessoais</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome completo *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone {checkoutMode === 'phone_required' ? '*' : '(opcional)'}
              </label>
              <input
                type="tel"
                required={checkoutMode === 'phone_required'}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(11) 99999-9999"
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
              {checkoutMode === 'guest' && (
                <p className="text-xs text-gray-500 mt-1">Opcional: informe para receber atualizações do pedido</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-mail (opcional)
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm space-y-4">
            <h2 className="font-bold text-lg">Tipo de pedido</h2>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, channel: 'DELIVERY' })}
                className={`p-4 rounded-lg border-2 font-medium ${
                  formData.channel === 'DELIVERY'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                Delivery
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, channel: 'TAKEAWAY' })}
                className={`p-4 rounded-lg border-2 font-medium ${
                  formData.channel === 'TAKEAWAY'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                Retirada
              </button>
            </div>
          </div>

          {formData.channel === 'DELIVERY' && (
            <div className="bg-white rounded-lg p-6 shadow-sm space-y-4">
              <h2 className="font-bold text-lg">Endereço de entrega</h2>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CEP *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                      onBlur={async () => {
                        if (formData.zipCode.replace(/\D/g, '').length === 8) {
                          setLoadingCEP(true)
                          const address = await fetchAddressByCEP(formData.zipCode)
                          if (address && !address.error) {
                            setFormData({
                              ...formData,
                              street: address.street,
                              district: address.district,
                              city: address.city,
                              state: address.state
                            })
                          }
                          setLoadingCEP(false)
                        }
                      }}
                      placeholder="00000-000"
                      className="w-full p-3 pr-10 border border-gray-300 rounded-lg"
                    />
                    {loadingCEP && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-gray-400" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Digite o CEP e pressione Tab para buscar automaticamente</p>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rua *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Complemento
                  </label>
                  <input
                    type="text"
                    value={formData.complement}
                    onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bairro *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cidade *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="SP"
                    maxLength={2}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ponto de referência
                  </label>
                  <input
                    type="text"
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg p-6 shadow-sm space-y-4">
            <h2 className="font-bold text-lg">Forma de pagamento</h2>
            
            {availablePaymentMethods.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
                <p className="text-sm">
                  <strong>⚠️ Atenção:</strong> Nenhum método de pagamento configurado. Entre em contato com a loja.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {availablePaymentMethods.map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setFormData({ ...formData, paymentMethod: method as any })}
                    className={`p-4 rounded-lg border-2 font-medium ${
                      formData.paymentMethod === method
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {method === 'PIX' && 'PIX'}
                    {method === 'CASH' && 'Dinheiro'}
                    {method === 'CARD' && 'Cartão na Entrega'}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm space-y-4">
            <h2 className="font-bold text-lg">Observações</h2>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Alguma observação sobre o pedido?"
              className="w-full p-3 border border-gray-300 rounded-lg resize-none"
              rows={3}
            />
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm space-y-3">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {formData.channel === 'DELIVERY' && (
              <div className="flex justify-between text-gray-600">
                <span>Taxa de entrega</span>
                <span>{formatCurrency(deliveryFee)}</span>
              </div>
            )}
            <div className="border-t pt-3 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-green-600">{formatCurrency(total)}</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 text-lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              `Confirmar Pedido • ${formatCurrency(total)}`
            )}
          </Button>
        </form>
      </main>
    </div>
  )
}
