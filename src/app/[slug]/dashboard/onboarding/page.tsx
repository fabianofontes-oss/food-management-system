'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Check, ChevronRight, ChevronLeft, Store, CreditCard, Clock, Package, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

type OnboardingStep = 'store_info' | 'payments' | 'hours' | 'first_product' | 'ready_check'

type OnboardingState = {
  completed: boolean
  ready_check: boolean
  steps: {
    store_info: boolean
    payments: boolean
    hours: boolean
    first_product: boolean
  }
}

export default function OnboardingPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const supabase = useMemo(() => createClient(), [])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [storeId, setStoreId] = useState('')
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('store_info')
  const [onboardingState, setOnboardingState] = useState<OnboardingState>({
    completed: false,
    ready_check: false,
    steps: {
      store_info: false,
      payments: false,
      hours: false,
      first_product: false
    }
  })
  const [showReadyCheckConfirm, setShowReadyCheckConfirm] = useState(false)

  // Step 1 - Store Info
  const [storeName, setStoreName] = useState('')
  const [storePhone, setStorePhone] = useState('')
  const [storeAddress, setStoreAddress] = useState('')

  // Step 2 - Payments
  const [enableCash, setEnableCash] = useState(false)
  const [enableCreditCard, setEnableCreditCard] = useState(false)
  const [enableDebitCard, setEnableDebitCard] = useState(false)
  const [enablePix, setEnablePix] = useState(false)

  // Step 3 - Hours
  const [hours, setHours] = useState<Record<string, { open: string; close: string; enabled: boolean }>>({
    monday: { open: '08:00', close: '18:00', enabled: true },
    tuesday: { open: '08:00', close: '18:00', enabled: true },
    wednesday: { open: '08:00', close: '18:00', enabled: true },
    thursday: { open: '08:00', close: '18:00', enabled: true },
    friday: { open: '08:00', close: '18:00', enabled: true },
    saturday: { open: '08:00', close: '14:00', enabled: true },
    sunday: { open: '08:00', close: '14:00', enabled: false }
  })

  // Step 4 - First Product
  const [productName, setProductName] = useState('')
  const [productPrice, setProductPrice] = useState('')
  const [productCategory, setProductCategory] = useState('')
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    loadStoreData()
  }, [slug])

  async function loadStoreData() {
    try {
      setLoading(true)

      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('id, name, phone, address, settings')
        .eq('slug', slug)
        .single()

      if (storeError || !store) {
        console.error('Store not found:', storeError)
        setLoading(false)
        return
      }

      setStoreId(store.id)
      setStoreName(store.name || '')
      setStorePhone(store.phone || '')
      setStoreAddress(store.address || '')

      // Load onboarding state from settings
      const settings = store.settings as any
      if (settings?.onboarding) {
        setOnboardingState(settings.onboarding)
        // Find first incomplete step
        const steps: OnboardingStep[] = ['store_info', 'payments', 'hours', 'first_product']
        const firstIncomplete = steps.find(step => !settings.onboarding.steps[step])
        if (firstIncomplete) {
          setCurrentStep(firstIncomplete)
        }
      }

      // Load payment settings
      if (settings?.enableCash) setEnableCash(true)
      if (settings?.enableCreditCard) setEnableCreditCard(true)
      if (settings?.enableDebitCard) setEnableDebitCard(true)
      if (settings?.enablePix) setEnablePix(true)

      // Load hours
      if (settings?.hours) {
        setHours(settings.hours)
      }

      // Load categories
      const { data: cats } = await supabase
        .from('categories')
        .select('id, name')
        .eq('store_id', store.id)
        .order('name')

      if (cats) {
        setCategories(cats)
      }

      setLoading(false)
    } catch (err) {
      console.error('Error loading store:', err)
      setLoading(false)
    }
  }

  async function saveStepProgress(step: OnboardingStep, completed: boolean) {
    const newState = {
      ...onboardingState,
      steps: {
        ...onboardingState.steps,
        [step]: completed
      }
    }
    setOnboardingState(newState)

    // Save to database
    const { data: store } = await supabase
      .from('stores')
      .select('settings')
      .eq('id', storeId)
      .single()

    const settings = (store?.settings as any) || {}
    settings.onboarding = newState

    await supabase
      .from('stores')
      .update({ settings })
      .eq('id', storeId)
  }

  async function handleStoreInfoSubmit() {
    setSaving(true)
    try {
      await supabase
        .from('stores')
        .update({
          name: storeName,
          phone: storePhone,
          address: storeAddress
        })
        .eq('id', storeId)

      await saveStepProgress('store_info', true)
      setCurrentStep('payments')
    } catch (err) {
      console.error('Error saving store info:', err)
    }
    setSaving(false)
  }

  async function handlePaymentsSubmit() {
    setSaving(true)
    try {
      const { data: store } = await supabase
        .from('stores')
        .select('settings')
        .eq('id', storeId)
        .single()

      const settings = (store?.settings as any) || {}
      settings.enableCash = enableCash
      settings.enableCreditCard = enableCreditCard
      settings.enableDebitCard = enableDebitCard
      settings.enablePix = enablePix

      await supabase
        .from('stores')
        .update({ settings })
        .eq('id', storeId)

      await saveStepProgress('payments', true)
      setCurrentStep('hours')
    } catch (err) {
      console.error('Error saving payments:', err)
    }
    setSaving(false)
  }

  async function handleHoursSubmit() {
    setSaving(true)
    try {
      const { data: store } = await supabase
        .from('stores')
        .select('settings')
        .eq('id', storeId)
        .single()

      const settings = (store?.settings as any) || {}
      settings.hours = hours

      await supabase
        .from('stores')
        .update({ settings })
        .eq('id', storeId)

      await saveStepProgress('hours', true)
      setCurrentStep('first_product')
    } catch (err) {
      console.error('Error saving hours:', err)
    }
    setSaving(false)
  }

  async function handleProductSubmit() {
    setSaving(true)
    try {
      let categoryId = productCategory

      // Create category if new
      if (productCategory && !categories.find(c => c.id === productCategory)) {
        const { data: newCat } = await supabase
          .from('categories')
          .insert({
            store_id: storeId,
            name: productCategory,
            display_order: 0
          })
          .select()
          .single()

        if (newCat) {
          categoryId = newCat.id
        }
      }

      // Create product
      await supabase
        .from('products')
        .insert({
          store_id: storeId,
          name: productName,
          base_price: parseFloat(productPrice),
          category_id: categoryId || null,
          is_available: true
        })

      await saveStepProgress('first_product', true)
      setCurrentStep('ready_check')
    } catch (err) {
      console.error('Error creating product:', err)
    }
    setSaving(false)
  }

  async function handleReadyCheck() {
    setSaving(true)
    try {
      const { data: store } = await supabase
        .from('stores')
        .select('settings')
        .eq('id', storeId)
        .single()

      const settings = (store?.settings as any) || {}
      if (!settings.onboarding) {
        settings.onboarding = {}
      }
      
      settings.onboarding.ready_check = true
      settings.onboarding.completed = true

      await supabase
        .from('stores')
        .update({ settings })
        .eq('id', storeId)

      setOnboardingState({
        ...onboardingState,
        ready_check: true,
        completed: true
      })
    } catch (err) {
      console.error('Error marking ready:', err)
    }
    setSaving(false)
  }

  async function completeOnboarding() {
    const finalState = {
      completed: true,
      ready_check: true,
      steps: {
        store_info: true,
        payments: true,
        hours: true,
        first_product: true
      }
    }

    const { data: store } = await supabase
      .from('stores')
      .select('settings')
      .eq('id', storeId)
      .single()

    const settings = (store?.settings as any) || {}
    settings.onboarding = finalState

    await supabase
      .from('stores')
      .update({ settings })
      .eq('id', storeId)

    setOnboardingState(finalState)
  }

  const steps = [
    { id: 'store_info', label: 'Informações da Loja', icon: Store },
    { id: 'payments', label: 'Pagamentos', icon: CreditCard },
    { id: 'hours', label: 'Horários', icon: Clock },
    { id: 'first_product', label: 'Primeiro Produto', icon: Package }
  ]

  const currentStepIndex = steps.findIndex(s => s.id === currentStep)

  function canProceed() {
    switch (currentStep) {
      case 'store_info':
        return storeName.trim() !== '' && storePhone.trim() !== ''
      case 'payments':
        return enableCash || enableCreditCard || enableDebitCard || enablePix
      case 'hours':
        return Object.values(hours).some(h => h.enabled)
      case 'first_product':
        return productName.trim() !== '' && productPrice !== '' && parseFloat(productPrice) > 0
      default:
        return false
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Carregando...</p>
        </div>
      </div>
    )
  }

  if (onboardingState.completed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="inline-block p-4 bg-green-100 rounded-full mb-6">
            <Sparkles className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Sua loja está pronta para vender! 🎉</h1>
          <p className="text-gray-600 mb-8">
            Parabéns! Você completou a configuração inicial da sua loja.
            Agora você pode começar a vender e gerenciar seus pedidos.
          </p>
          <Button
            onClick={() => router.push(`/${slug}/dashboard`)}
            className="w-full"
            size="lg"
          >
            Ir para o Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Configure sua loja</h1>
          <p className="text-gray-600">Complete os passos abaixo para começar a vender</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isCompleted = onboardingState.steps[step.id as keyof typeof onboardingState.steps]
              const isCurrent = step.id === currentStep
              const isAccessible = index <= currentStepIndex

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <button
                    onClick={() => isAccessible && setCurrentStep(step.id as OnboardingStep)}
                    disabled={!isAccessible}
                    className={`flex flex-col items-center gap-2 ${isAccessible ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                      isCompleted 
                        ? 'bg-green-600 text-white'
                        : isCurrent
                        ? 'bg-green-100 text-green-600 ring-4 ring-green-200'
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {isCompleted ? <Check className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                    </div>
                    <span className={`text-xs font-medium hidden md:block ${
                      isCurrent ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {step.label}
                    </span>
                  </button>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-1 mx-2 ${
                      onboardingState.steps[steps[index + 1].id as keyof typeof onboardingState.steps] ? 'bg-green-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {currentStep === 'store_info' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Informações da Loja</h2>
                <p className="text-gray-600">Confirme ou edite as informações básicas da sua loja</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Loja *
                </label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                  placeholder="Minha Loja"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone *
                </label>
                <input
                  type="tel"
                  value={storePhone}
                  onChange={(e) => setStorePhone(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Endereço
                </label>
                <input
                  type="text"
                  value={storeAddress}
                  onChange={(e) => setStoreAddress(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                  placeholder="Rua, número, bairro, cidade"
                />
              </div>

              <Button
                onClick={handleStoreInfoSubmit}
                disabled={!canProceed() || saving}
                className="w-full"
                size="lg"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    Continuar
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </div>
          )}

          {currentStep === 'payments' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Formas de Pagamento</h2>
                <p className="text-gray-600">Selecione pelo menos uma forma de pagamento que você aceita</p>
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={enableCash}
                    onChange={(e) => setEnableCash(e.target.checked)}
                    className="w-5 h-5 text-green-600"
                  />
                  <span className="font-medium text-gray-900">Dinheiro</span>
                </label>

                <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={enableCreditCard}
                    onChange={(e) => setEnableCreditCard(e.target.checked)}
                    className="w-5 h-5 text-green-600"
                  />
                  <span className="font-medium text-gray-900">Cartão de Crédito</span>
                </label>

                <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={enableDebitCard}
                    onChange={(e) => setEnableDebitCard(e.target.checked)}
                    className="w-5 h-5 text-green-600"
                  />
                  <span className="font-medium text-gray-900">Cartão de Débito</span>
                </label>

                <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={enablePix}
                    onChange={(e) => setEnablePix(e.target.checked)}
                    className="w-5 h-5 text-green-600"
                  />
                  <span className="font-medium text-gray-900">PIX</span>
                </label>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setCurrentStep('store_info')}
                  variant="outline"
                  className="flex-1"
                  size="lg"
                >
                  <ChevronLeft className="w-5 h-5 mr-2" />
                  Voltar
                </Button>
                <Button
                  onClick={handlePaymentsSubmit}
                  disabled={!canProceed() || saving}
                  className="flex-1"
                  size="lg"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      Continuar
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {currentStep === 'hours' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Horário de Funcionamento</h2>
                <p className="text-gray-600">Configure os dias e horários que sua loja estará aberta</p>
              </div>

              <div className="space-y-3">
                {Object.entries(hours).map(([day, schedule]) => (
                  <div key={day} className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg">
                    <input
                      type="checkbox"
                      checked={schedule.enabled}
                      onChange={(e) => setHours({
                        ...hours,
                        [day]: { ...schedule, enabled: e.target.checked }
                      })}
                      className="w-5 h-5 text-green-600"
                    />
                    <span className="w-24 font-medium text-gray-900 capitalize">
                      {day === 'monday' ? 'Segunda' :
                       day === 'tuesday' ? 'Terça' :
                       day === 'wednesday' ? 'Quarta' :
                       day === 'thursday' ? 'Quinta' :
                       day === 'friday' ? 'Sexta' :
                       day === 'saturday' ? 'Sábado' : 'Domingo'}
                    </span>
                    <input
                      type="time"
                      value={schedule.open}
                      onChange={(e) => setHours({
                        ...hours,
                        [day]: { ...schedule, open: e.target.value }
                      })}
                      disabled={!schedule.enabled}
                      className="px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                    />
                    <span className="text-gray-500">até</span>
                    <input
                      type="time"
                      value={schedule.close}
                      onChange={(e) => setHours({
                        ...hours,
                        [day]: { ...schedule, close: e.target.value }
                      })}
                      disabled={!schedule.enabled}
                      className="px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setCurrentStep('payments')}
                  variant="outline"
                  className="flex-1"
                  size="lg"
                >
                  <ChevronLeft className="w-5 h-5 mr-2" />
                  Voltar
                </Button>
                <Button
                  onClick={handleHoursSubmit}
                  disabled={!canProceed() || saving}
                  className="flex-1"
                  size="lg"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      Continuar
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {currentStep === 'first_product' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Primeiro Produto</h2>
                <p className="text-gray-600">Adicione seu primeiro produto para começar a vender</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                  placeholder="Ex: Pizza Margherita"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preço (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria
                </label>
                {categories.length > 0 ? (
                  <select
                    value={productCategory}
                    onChange={(e) => setProductCategory(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                  >
                    <option value="">Selecione ou digite nova categoria</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={productCategory}
                    onChange={(e) => setProductCategory(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                    placeholder="Ex: Pizzas"
                  />
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setCurrentStep('hours')}
                  variant="outline"
                  className="flex-1"
                  size="lg"
                >
                  <ChevronLeft className="w-5 h-5 mr-2" />
                  Voltar
                </Button>
                <Button
                  onClick={handleProductSubmit}
                  disabled={!canProceed() || saving}
                  className="flex-1"
                  size="lg"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Finalizando...
                    </>
                  ) : (
                    <>
                      Continuar
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {currentStep === 'ready_check' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Sua loja está pronta?</h2>
                <p className="text-gray-600">Confirme que você completou a configuração inicial</p>
              </div>

              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 space-y-4">
                <h3 className="font-bold text-green-900 text-lg mb-3">Checklist de Prontidão:</h3>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Informações da loja configuradas</p>
                      <p className="text-sm text-gray-600">Nome, telefone e endereço</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Formas de pagamento ativas</p>
                      <p className="text-sm text-gray-600">Pelo menos um método habilitado</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Horário de funcionamento definido</p>
                      <p className="text-sm text-gray-600">Dias e horários configurados</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Primeiro produto cadastrado</p>
                      <p className="text-sm text-gray-600">Menu inicial criado</p>
                    </div>
                  </div>
                </div>
              </div>

              {showReadyCheckConfirm && (
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
                  <p className="text-yellow-900 font-medium mb-4">
                    Ao confirmar, sua loja será marcada como pronta para começar a receber pedidos. 
                    Você poderá fazer ajustes a qualquer momento nas configurações.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setShowReadyCheckConfirm(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleReadyCheck}
                      disabled={saving}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Confirmando...
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5 mr-2" />
                          Confirmar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {!showReadyCheckConfirm && (
                <div className="flex gap-3">
                  <Button
                    onClick={() => setCurrentStep('first_product')}
                    variant="outline"
                    className="flex-1"
                    size="lg"
                  >
                    <ChevronLeft className="w-5 h-5 mr-2" />
                    Voltar
                  </Button>
                  <Button
                    onClick={() => setShowReadyCheckConfirm(true)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Marcar loja como pronta
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
