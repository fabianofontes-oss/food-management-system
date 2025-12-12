'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useEffect } from 'react'
import { 
  Settings, ShoppingCart, ChefHat, Truck, Store, Package,
  DollarSign, CreditCard, Smartphone, Bell, Mail, Volume2,
  Users, Tag, Clock, UtensilsCrossed, Archive, Printer,
  Wifi, Save, RotateCcw, Loader2, CheckCircle, XCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ToggleCard } from '@/components/settings/ToggleCard'
import { settingsFormSchema, defaultSettings, type SettingsFormData } from '@/lib/validations/settings'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import { CheckoutSection } from './components/CheckoutSection'
import { PaymentsSection } from './components/PaymentsSection'

export default function SettingsPage() {
  const params = useParams()
  const slug = params.slug as string
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [storeId, setStoreId] = useState<string | null>(null)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: defaultSettings,
  })

  useEffect(() => {
    async function loadStore() {
      if (!slug) return
      const { data } = await supabase
        .from('stores')
        .select('id, settings')
        .eq('slug', slug)
        .single()
      
      if (data) {
        setStoreId(data.id)
        
        // Carregar settings do banco se existirem
        if (data.settings) {
          const settings = data.settings as any
          
          // Popular formulário com valores salvos
          Object.keys(settings).forEach((key) => {
            if (key === 'checkout' && settings.checkout?.mode) {
              setValue('checkout.mode', settings.checkout.mode)
            } else if (typeof settings[key] === 'object' && settings[key] !== null) {
              Object.keys(settings[key]).forEach((subKey) => {
                setValue(`${key}.${subKey}` as any, settings[key][subKey])
              })
            } else {
              setValue(key as any, settings[key])
            }
          })
        }
      }
    }
    loadStore()
  }, [slug, setValue])

  const watchedValues = watch()

  const onSubmit = async (data: SettingsFormData) => {
    if (!storeId) {
      alert('Nenhuma loja selecionada')
      return
    }

    setSaving(true)
    setSaveStatus('idle')

    try {
      const { error } = await supabase
        .from('stores')
        .update({ settings: data })
        .eq('id', storeId)

      if (error) throw error

      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (confirm('Deseja restaurar as configurações padrão?')) {
      Object.keys(defaultSettings).forEach((key) => {
        setValue(key as keyof SettingsFormData, defaultSettings[key as keyof SettingsFormData])
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-10 h-10 text-gray-700" />
            <h1 className="text-4xl font-bold text-gray-900">Configurações</h1>
          </div>
          <p className="text-gray-600">Personalize as funcionalidades da sua loja</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Botões de Ação */}
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Salvar Configurações
                </>
              )}
            </Button>

            <Button
              type="button"
              onClick={handleReset}
              variant="outline"
              className="px-6 py-3 flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Restaurar Padrão
            </Button>

            {saveStatus === 'success' && (
              <div className="flex items-center gap-2 text-green-600 font-medium">
                <CheckCircle className="w-5 h-5" />
                Salvo com sucesso!
              </div>
            )}

            {saveStatus === 'error' && (
              <div className="flex items-center gap-2 text-red-600 font-medium">
                <XCircle className="w-5 h-5" />
                Erro ao salvar
              </div>
            )}
          </div>

          {/* Funcionalidades Principais */}
          <section className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Store className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Funcionalidades Principais</h2>
            </div>
            <div className="space-y-3">
              <ToggleCard
                icon={ShoppingCart}
                iconColor="text-blue-600"
                title="PDV (Point of Sale)"
                description="Sistema de vendas no balcão"
                enabled={watchedValues.enablePOS}
                onToggle={(val) => setValue('enablePOS', val)}
              />
              <ToggleCard
                icon={ChefHat}
                iconColor="text-orange-600"
                title="Cozinha / KDS"
                description="Display de pedidos para a cozinha"
                enabled={watchedValues.enableKitchen}
                onToggle={(val) => setValue('enableKitchen', val)}
              />
              <ToggleCard
                icon={Truck}
                iconColor="text-purple-600"
                title="Delivery"
                description="Entregas em domicílio"
                enabled={watchedValues.delivery.enabled}
                onToggle={(val) => setValue('delivery.enabled', val)}
                showAccordion={true}
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Taxa de Entrega (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('delivery.fee', { valueAsNumber: true })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                      placeholder="5.00"
                    />
                    {errors.delivery?.fee && (
                      <p className="text-red-600 text-sm mt-1">{errors.delivery.fee.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Raio de Entrega (km) *
                    </label>
                    <input
                      type="number"
                      {...register('delivery.minRadius', { valueAsNumber: true })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                      placeholder="5"
                    />
                    {errors.delivery?.minRadius && (
                      <p className="text-red-600 text-sm mt-1">{errors.delivery.minRadius.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tempo Médio de Entrega (min) *
                    </label>
                    <input
                      type="number"
                      {...register('delivery.avgTime', { valueAsNumber: true })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                      placeholder="30"
                    />
                    {errors.delivery?.avgTime && (
                      <p className="text-red-600 text-sm mt-1">{errors.delivery.avgTime.message}</p>
                    )}
                  </div>
                </div>
              </ToggleCard>
              <ToggleCard
                icon={Store}
                iconColor="text-green-600"
                title="Consumo no Local"
                description="Pedidos para consumir no estabelecimento"
                enabled={watchedValues.enableDineIn}
                onToggle={(val) => setValue('enableDineIn', val)}
              />
              <ToggleCard
                icon={Package}
                iconColor="text-indigo-600"
                title="Retirada"
                description="Pedidos para retirar no balcão"
                enabled={watchedValues.enableTakeout}
                onToggle={(val) => setValue('enableTakeout', val)}
              />
            </div>
          </section>

          {/* Formas de Pagamento */}
          <section className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <CreditCard className="w-6 h-6 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-900">Formas de Pagamento</h2>
            </div>
            <div className="space-y-3">
              <ToggleCard
                icon={DollarSign}
                iconColor="text-green-600"
                title="Dinheiro"
                description="Pagamento em espécie"
                enabled={watchedValues.enableCash}
                onToggle={(val) => setValue('enableCash', val)}
              />
              <ToggleCard
                icon={CreditCard}
                iconColor="text-blue-600"
                title="Cartão de Crédito"
                description="Aceitar cartões de crédito"
                enabled={watchedValues.enableCreditCard}
                onToggle={(val) => setValue('enableCreditCard', val)}
              />
              <ToggleCard
                icon={CreditCard}
                iconColor="text-purple-600"
                title="Cartão de Débito"
                description="Aceitar cartões de débito"
                enabled={watchedValues.enableDebitCard}
                onToggle={(val) => setValue('enableDebitCard', val)}
              />
              <ToggleCard
                icon={Smartphone}
                iconColor="text-teal-600"
                title="PIX"
                description="Pagamento instantâneo via PIX"
                enabled={watchedValues.pix.enabled}
                onToggle={(val) => setValue('pix.enabled', val)}
                showAccordion={true}
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Chave PIX *
                    </label>
                    <select
                      {...register('pix.keyType')}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:outline-none"
                    >
                      <option value="">Selecione o tipo</option>
                      <option value="cpf">CPF</option>
                      <option value="cnpj">CNPJ</option>
                      <option value="email">E-mail</option>
                      <option value="phone">Telefone</option>
                      <option value="random">Chave Aleatória</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chave PIX *
                    </label>
                    <input
                      type="text"
                      {...register('pix.keyValue')}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:outline-none"
                      placeholder="Digite sua chave PIX"
                    />
                    {errors.pix?.keyValue && (
                      <p className="text-red-600 text-sm mt-1">{errors.pix.keyValue.message}</p>
                    )}
                  </div>
                </div>
              </ToggleCard>
            </div>
          </section>

          {/* Notificações */}
          <section className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Bell className="w-6 h-6 text-yellow-600" />
              <h2 className="text-2xl font-bold text-gray-900">Notificações</h2>
            </div>
            <div className="space-y-3">
              <ToggleCard
                icon={Bell}
                iconColor="text-yellow-600"
                title="Notificações de Pedidos"
                description="Alertas visuais para novos pedidos"
                enabled={watchedValues.enableOrderNotifications}
                onToggle={(val) => setValue('enableOrderNotifications', val)}
              />
              <ToggleCard
                icon={Smartphone}
                iconColor="text-green-600"
                title="WhatsApp"
                description="Enviar notificações via WhatsApp"
                enabled={watchedValues.whatsapp.enabled}
                onToggle={(val) => setValue('whatsapp.enabled', val)}
                showAccordion={true}
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número do WhatsApp *
                    </label>
                    <input
                      type="text"
                      {...register('whatsapp.phoneNumber')}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Token da API *
                    </label>
                    <input
                      type="text"
                      {...register('whatsapp.apiToken')}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                      placeholder="Token da API do WhatsApp"
                    />
                    {errors.whatsapp && (
                      <p className="text-red-600 text-sm mt-1">{errors.whatsapp.message}</p>
                    )}
                  </div>
                </div>
              </ToggleCard>
              <ToggleCard
                icon={Mail}
                iconColor="text-blue-600"
                title="E-mail"
                description="Enviar confirmações por e-mail"
                enabled={watchedValues.enableEmail}
                onToggle={(val) => setValue('enableEmail', val)}
              />
              <ToggleCard
                icon={Volume2}
                iconColor="text-red-600"
                title="Alertas Sonoros"
                description="Som ao receber novos pedidos"
                enabled={watchedValues.enableSoundAlerts}
                onToggle={(val) => setValue('enableSoundAlerts', val)}
              />
            </div>
          </section>

          {/* Recursos Avançados */}
          <section className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Settings className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900">Recursos Avançados</h2>
            </div>
            <div className="space-y-3">
              <ToggleCard
                icon={Users}
                iconColor="text-pink-600"
                title="Programa de Fidelidade"
                description="Sistema de pontos e recompensas"
                enabled={watchedValues.loyalty.enabled}
                onToggle={(val) => setValue('loyalty.enabled', val)}
                showAccordion={true}
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pontos por Real Gasto *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      {...register('loyalty.pointsPerReal', { valueAsNumber: true })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:outline-none"
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pontos Mínimos para Resgate *
                    </label>
                    <input
                      type="number"
                      {...register('loyalty.minPointsToRedeem', { valueAsNumber: true })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:outline-none"
                      placeholder="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valor da Recompensa (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('loyalty.rewardValue', { valueAsNumber: true })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:outline-none"
                      placeholder="10.00"
                    />
                    {errors.loyalty && (
                      <p className="text-red-600 text-sm mt-1">{errors.loyalty.message}</p>
                    )}
                  </div>
                </div>
              </ToggleCard>
              <ToggleCard
                icon={Tag}
                iconColor="text-orange-600"
                title="Cupons de Desconto"
                description="Criar e gerenciar cupons promocionais"
                enabled={watchedValues.enableCoupons}
                onToggle={(val) => setValue('enableCoupons', val)}
              />
              <ToggleCard
                icon={Clock}
                iconColor="text-blue-600"
                title="Agendamento de Pedidos"
                description="Permitir pedidos agendados"
                enabled={watchedValues.enableScheduling}
                onToggle={(val) => setValue('enableScheduling', val)}
              />
              <ToggleCard
                icon={UtensilsCrossed}
                iconColor="text-green-600"
                title="Gestão de Mesas"
                description="Controle de mesas e comandas"
                enabled={watchedValues.enableTableManagement}
                onToggle={(val) => setValue('enableTableManagement', val)}
              />
              <ToggleCard
                icon={Archive}
                iconColor="text-indigo-600"
                title="Controle de Estoque"
                description="Gerenciar inventário de produtos"
                enabled={watchedValues.enableInventory}
                onToggle={(val) => setValue('enableInventory', val)}
              />
            </div>
          </section>

          {/* Impressão */}
          <section className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Printer className="w-6 h-6 text-gray-600" />
              <h2 className="text-2xl font-bold text-gray-900">Impressão</h2>
            </div>
            <div className="space-y-3">
              <ToggleCard
                icon={Printer}
                iconColor="text-gray-600"
                title="Impressão Automática"
                description="Imprimir pedidos automaticamente"
                enabled={watchedValues.enableAutoPrint}
                onToggle={(val) => setValue('enableAutoPrint', val)}
              />
              <ToggleCard
                icon={Printer}
                iconColor="text-orange-600"
                title="Impressora da Cozinha"
                description="Enviar pedidos para impressora da cozinha"
                enabled={watchedValues.enableKitchenPrint}
                onToggle={(val) => setValue('enableKitchenPrint', val)}
              />
            </div>
          </section>

          <CheckoutSection
            checkoutMode={watchedValues.checkout?.mode || 'phone_required'}
            setValue={setValue}
          />

          <PaymentsSection
            paymentsData={watchedValues.payments || {}}
            errors={errors}
            setValue={setValue}
          />

          {/* Integrações */}
          <section className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Wifi className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Integrações</h2>
            </div>
            <div className="space-y-3">
              <ToggleCard
                icon={Truck}
                iconColor="text-red-600"
                title="iFood"
                description="Integração com iFood"
                enabled={watchedValues.ifood.enabled}
                onToggle={(val) => setValue('ifood.enabled', val)}
                showAccordion={true}
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Merchant ID *
                    </label>
                    <input
                      type="text"
                      {...register('ifood.merchantId')}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none"
                      placeholder="Seu Merchant ID do iFood"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      API Key *
                    </label>
                    <input
                      type="text"
                      {...register('ifood.apiKey')}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none"
                      placeholder="Sua API Key do iFood"
                    />
                    {errors.ifood && (
                      <p className="text-red-600 text-sm mt-1">{errors.ifood.message}</p>
                    )}
                  </div>
                </div>
              </ToggleCard>
              <ToggleCard
                icon={Truck}
                iconColor="text-orange-600"
                title="Rappi"
                description="Integração com Rappi"
                enabled={watchedValues.rappi.enabled}
                onToggle={(val) => setValue('rappi.enabled', val)}
                showAccordion={true}
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Store ID *
                    </label>
                    <input
                      type="text"
                      {...register('rappi.storeId')}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                      placeholder="Seu Store ID do Rappi"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      API Key *
                    </label>
                    <input
                      type="text"
                      {...register('rappi.apiKey')}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                      placeholder="Sua API Key do Rappi"
                    />
                    {errors.rappi && (
                      <p className="text-red-600 text-sm mt-1">{errors.rappi.message}</p>
                    )}
                  </div>
                </div>
              </ToggleCard>
              <ToggleCard
                icon={Truck}
                iconColor="text-green-600"
                title="Uber Eats"
                description="Integração com Uber Eats"
                enabled={watchedValues.uberEats.enabled}
                onToggle={(val) => setValue('uberEats.enabled', val)}
                showAccordion={true}
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Store ID *
                    </label>
                    <input
                      type="text"
                      {...register('uberEats.storeId')}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                      placeholder="Seu Store ID do Uber Eats"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      API Key *
                    </label>
                    <input
                      type="text"
                      {...register('uberEats.apiKey')}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                      placeholder="Sua API Key do Uber Eats"
                    />
                    {errors.uberEats && (
                      <p className="text-red-600 text-sm mt-1">{errors.uberEats.message}</p>
                    )}
                  </div>
                </div>
              </ToggleCard>
            </div>
          </section>

          {/* Botões de Ação (Repetido no final) */}
          <div className="flex gap-3 sticky bottom-6 bg-white p-4 rounded-xl shadow-lg border-2 border-gray-200">
            <Button
              type="submit"
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Salvar Configurações
                </>
              )}
            </Button>

            <Button
              type="button"
              onClick={handleReset}
              variant="outline"
              className="px-6 py-3 flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Restaurar Padrão
            </Button>

            {saveStatus === 'success' && (
              <div className="flex items-center gap-2 text-green-600 font-medium">
                <CheckCircle className="w-5 h-5" />
                Salvo com sucesso!
              </div>
            )}

            {saveStatus === 'error' && (
              <div className="flex items-center gap-2 text-red-600 font-medium">
                <XCircle className="w-5 h-5" />
                Erro ao salvar
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
