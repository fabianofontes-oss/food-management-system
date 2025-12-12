'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/stores/cart-store'
import { fetchAddressByCEP, formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { CustomerSection } from './components/CustomerSection'
import { AddressSection } from './components/AddressSection'
import { PaymentMethodSelector } from './components/PaymentMethodSelector'
import { OrderSummary } from './components/OrderSummary'
import { OrderTypeSelector } from './components/OrderTypeSelector'
import { NotesSection } from './components/NotesSection'
import { loadStoreSettings } from './services/storeSettings'
import { validateAndSubmitOrder } from './services/orders'
import type { CheckoutFormData, CheckoutMode, PaymentMethod } from './types'

interface CheckoutClientProps {
  slug: string
}

export function CheckoutClient({ slug }: CheckoutClientProps) {
  const router = useRouter()
  const { items, getSubtotal, clearCart } = useCartStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loadingCEP, setLoadingCEP] = useState(false)
  const [checkoutMode, setCheckoutMode] = useState<CheckoutMode>('phone_required')
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<PaymentMethod[]>(['CASH'])

  const [formData, setFormData] = useState<CheckoutFormData>({
    name: '',
    phone: '',
    email: '',
    channel: 'DELIVERY',
    paymentMethod: 'PIX',
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
    async function loadSettings() {
      const settings = await loadStoreSettings(slug)
      setCheckoutMode(settings.checkoutMode)
      setAvailablePaymentMethods(settings.availablePaymentMethods)
      
      // Se nenhum método disponível, usar o primeiro como fallback
      if (settings.availablePaymentMethods.length > 0 && !settings.availablePaymentMethods.includes(formData.paymentMethod)) {
        setFormData(prev => ({ ...prev, paymentMethod: settings.availablePaymentMethods[0] }))
      }
    }
    loadSettings()
  }, [slug])

  const handleFieldChange = (field: keyof CheckoutFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleCEPBlur = async (zipCode: string) => {
    if (zipCode.replace(/\D/g, '').length === 8) {
      setLoadingCEP(true)
      const address = await fetchAddressByCEP(zipCode)
      if (address && !address.error) {
        setFormData(prev => ({
          ...prev,
          street: address.street,
          district: address.district,
          city: address.city,
          state: address.state
        }))
      }
      setLoadingCEP(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await validateAndSubmitOrder(slug, formData, checkoutMode, items)

    if (result.success && result.orderId) {
      clearCart()
      router.push(`/${slug}/order/${result.orderId}`)
    } else {
      setError(result.error || 'Erro ao criar pedido')
    }

    setLoading(false)
  }

  if (items.length === 0) {
    router.push(`/${slug}`)
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
          <CustomerSection
            formData={formData}
            checkoutMode={checkoutMode}
            onChange={handleFieldChange}
          />

          <OrderTypeSelector
            selectedChannel={formData.channel}
            onSelect={(channel) => setFormData({ ...formData, channel })}
          />

          {formData.channel === 'DELIVERY' && (
            <AddressSection
              formData={formData}
              loadingCEP={loadingCEP}
              onChange={handleFieldChange}
              onCEPBlur={handleCEPBlur}
            />
          )}

          <PaymentMethodSelector
            availableMethods={availablePaymentMethods}
            selectedMethod={formData.paymentMethod}
            onSelect={(method) => setFormData({ ...formData, paymentMethod: method })}
          />

          <NotesSection
            notes={formData.notes}
            onChange={(notes) => setFormData({ ...formData, notes })}
          />

          <OrderSummary
            subtotal={subtotal}
            deliveryFee={deliveryFee}
            total={total}
            showDeliveryFee={formData.channel === 'DELIVERY'}
          />

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
