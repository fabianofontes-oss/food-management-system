'use client'

import { useState, useEffect } from 'react'
import { 
  Settings, 
  Store, 
  ShoppingCart, 
  ChefHat, 
  Truck, 
  Bell,
  CreditCard,
  Users,
  Package,
  Clock,
  DollarSign,
  Smartphone,
  Printer,
  Wifi,
  Save,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSettings } from '@/hooks/useSettings'
import { useStores } from '@/hooks/useStores'

export default function SettingsPage() {
  const { stores } = useStores()
  const currentStore = stores[0]
  const { settings, loading, error, updateSettings, resetToDefaults } = useSettings(currentStore?.id)
  
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [localSettings, setLocalSettings] = useState(settings)

  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  const handleToggle = (key: string) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }))
  }

  const handleNumberChange = (key: string, value: number) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveSuccess(false)
    setSaveError(null)
    
    try {
      const success = await updateSettings(localSettings)
      
      if (success) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      } else {
        setSaveError('Erro ao salvar configurações')
      }
    } catch (err) {
      setSaveError('Erro ao salvar configurações')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = async () => {
    if (confirm('Deseja restaurar as configurações padrão?')) {
      setIsSaving(true)
      const success = await resetToDefaults()
      setIsSaving(false)
      
      if (success) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Carregando configurações...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 text-lg">{error}</p>
        </div>
      </div>
    )
  }

  const ToggleItem = ({ 
    icon: Icon, 
    label, 
    description, 
    checked, 
    onChange,
    color = 'text-gray-600'
  }: { 
    icon: any
    label: string
    description: string
    checked: boolean
    onChange: () => void
    color?: string
  }) => (
    <div className="flex items-start justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
      <div className="flex items-start gap-3 flex-1">
        <Icon className={`w-5 h-5 mt-0.5 ${color}`} />
        <div>
          <div className="font-semibold text-gray-900">{label}</div>
          <div className="text-sm text-gray-600 mt-1">{description}</div>
        </div>
      </div>
      <button
        onClick={onChange}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          checked ? 'bg-green-500' : 'bg-gray-300'
        }`}
      >
        <div
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )

  const NumberInput = ({
    icon: Icon,
    label,
    value,
    onChange,
    suffix,
    color = 'text-gray-600'
  }: {
    icon: any
    label: string
    value: number
    onChange: (value: number) => void
    suffix: string
    color?: string
  }) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${color}`} />
        <span className="font-semibold text-gray-900">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-20 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-center"
        />
        <span className="text-sm text-gray-600">{suffix}</span>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-8 h-8 text-gray-700" />
            <h1 className="text-4xl font-bold text-gray-900">Configurações</h1>
          </div>
          <p className="text-gray-600">Personalize as funcionalidades da sua loja</p>
        </div>

        <div className="flex gap-3 mb-6 flex-wrap">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : saveSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Salvo com Sucesso!
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Configurações
              </>
            )}
          </Button>
          <Button
            onClick={handleReset}
            disabled={isSaving}
            className="bg-gray-200 text-gray-700 hover:bg-gray-300"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Restaurar Padrão
          </Button>
          {saveError && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              <span>{saveError}</span>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <section className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Store className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold">Funcionalidades Principais</h2>
            </div>
            <div className="space-y-3">
              <ToggleItem
                icon={ShoppingCart}
                label="PDV (Point of Sale)"
                description="Sistema de vendas no balcão"
                checked={localSettings.enable_pos}
                onChange={() => handleToggle('enable_pos')}
                color="text-blue-600"
              />
              <ToggleItem
                icon={ChefHat}
                label="Cozinha / KDS"
                description="Display de pedidos para a cozinha"
                checked={localSettings.enable_kitchen}
                onChange={() => handleToggle('enable_kitchen')}
                color="text-orange-600"
              />
              <ToggleItem
                icon={Truck}
                label="Delivery"
                description="Entregas em domicílio"
                checked={localSettings.enable_delivery}
                onChange={() => handleToggle('enable_delivery')}
                color="text-purple-600"
              />
              <ToggleItem
                icon={Store}
                label="Consumo no Local"
                description="Pedidos para consumir no estabelecimento"
                checked={localSettings.enable_dine_in}
                onChange={() => handleToggle('enable_dine_in')}
                color="text-green-600"
              />
              <ToggleItem
                icon={Package}
                label="Retirada"
                description="Pedidos para retirar no balcão"
                checked={localSettings.enable_takeout}
                onChange={() => handleToggle('enable_takeout')}
                color="text-indigo-600"
              />
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-6 h-6 text-green-600" />
              <h2 className="text-2xl font-bold">Formas de Pagamento</h2>
            </div>
            <div className="space-y-3">
              <ToggleItem
                icon={DollarSign}
                label="Dinheiro"
                description="Pagamento em espécie"
                checked={localSettings.enable_cash}
                onChange={() => handleToggle('enable_cash')}
                color="text-green-600"
              />
              <ToggleItem
                icon={CreditCard}
                label="Cartão de Crédito"
                description="Aceitar cartões de crédito"
                checked={localSettings.enable_credit_card}
                onChange={() => handleToggle('enable_credit_card')}
                color="text-blue-600"
              />
              <ToggleItem
                icon={CreditCard}
                label="Cartão de Débito"
                description="Aceitar cartões de débito"
                checked={localSettings.enable_debit_card}
                onChange={() => handleToggle('enable_debit_card')}
                color="text-purple-600"
              />
              <ToggleItem
                icon={Smartphone}
                label="PIX"
                description="Pagamento instantâneo via PIX"
                checked={localSettings.enable_pix}
                onChange={() => handleToggle('enable_pix')}
                color="text-teal-600"
              />
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-6 h-6 text-yellow-600" />
              <h2 className="text-2xl font-bold">Notificações</h2>
            </div>
            <div className="space-y-3">
              <ToggleItem
                icon={Bell}
                label="Notificações de Pedidos"
                description="Alertas visuais para novos pedidos"
                checked={localSettings.enable_order_notifications}
                onChange={() => handleToggle('enable_order_notifications')}
                color="text-yellow-600"
              />
              <ToggleItem
                icon={Smartphone}
                label="WhatsApp"
                description="Enviar notificações via WhatsApp"
                checked={localSettings.enable_whatsapp_notifications}
                onChange={() => handleToggle('enable_whatsapp_notifications')}
                color="text-green-600"
              />
              <ToggleItem
                icon={Bell}
                label="E-mail"
                description="Enviar confirmações por e-mail"
                checked={localSettings.enable_email_notifications}
                onChange={() => handleToggle('enable_email_notifications')}
                color="text-blue-600"
              />
              <ToggleItem
                icon={Bell}
                label="Alertas Sonoros"
                description="Som ao receber novos pedidos"
                checked={localSettings.enable_sound_alerts}
                onChange={() => handleToggle('enable_sound_alerts')}
                color="text-red-600"
              />
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-bold">Recursos Avançados</h2>
            </div>
            <div className="space-y-3">
              <ToggleItem
                icon={Users}
                label="Programa de Fidelidade"
                description="Sistema de pontos e recompensas"
                checked={localSettings.enable_loyalty_program}
                onChange={() => handleToggle('enable_loyalty_program')}
                color="text-purple-600"
              />
              <ToggleItem
                icon={Package}
                label="Cupons de Desconto"
                description="Criar e gerenciar cupons promocionais"
                checked={localSettings.enable_coupons}
                onChange={() => handleToggle('enable_coupons')}
                color="text-orange-600"
              />
              <ToggleItem
                icon={Clock}
                label="Agendamento de Pedidos"
                description="Permitir pedidos agendados"
                checked={localSettings.enable_scheduled_orders}
                onChange={() => handleToggle('enable_scheduled_orders')}
                color="text-blue-600"
              />
              <ToggleItem
                icon={Store}
                label="Gestão de Mesas"
                description="Controle de mesas e comandas"
                checked={localSettings.enable_table_management}
                onChange={() => handleToggle('enable_table_management')}
                color="text-green-600"
              />
              <ToggleItem
                icon={Package}
                label="Controle de Estoque"
                description="Gerenciar inventário de produtos"
                checked={localSettings.enable_inventory_control}
                onChange={() => handleToggle('enable_inventory_control')}
                color="text-indigo-600"
              />
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Printer className="w-6 h-6 text-gray-600" />
              <h2 className="text-2xl font-bold">Impressão</h2>
            </div>
            <div className="space-y-3">
              <ToggleItem
                icon={Printer}
                label="Impressão Automática"
                description="Imprimir pedidos automaticamente"
                checked={localSettings.enable_auto_print}
                onChange={() => handleToggle('enable_auto_print')}
                color="text-gray-600"
              />
              <ToggleItem
                icon={Printer}
                label="Impressora da Cozinha"
                description="Enviar pedidos para impressora da cozinha"
                checked={localSettings.enable_kitchen_print}
                onChange={() => handleToggle('enable_kitchen_print')}
                color="text-orange-600"
              />
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Wifi className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold">Integrações</h2>
            </div>
            <div className="space-y-3">
              <ToggleItem
                icon={Truck}
                label="iFood"
                description="Integração com iFood"
                checked={localSettings.enable_ifood}
                onChange={() => handleToggle('enable_ifood')}
                color="text-red-600"
              />
              <ToggleItem
                icon={Truck}
                label="Rappi"
                description="Integração com Rappi"
                checked={localSettings.enable_rappi}
                onChange={() => handleToggle('enable_rappi')}
                color="text-orange-600"
              />
              <ToggleItem
                icon={Truck}
                label="Uber Eats"
                description="Integração com Uber Eats"
                checked={localSettings.enable_uber_eats}
                onChange={() => handleToggle('enable_uber_eats')}
                color="text-green-600"
              />
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-6 h-6 text-gray-600" />
              <h2 className="text-2xl font-bold">Operação</h2>
            </div>
            <div className="space-y-3">
              <NumberInput
                icon={DollarSign}
                label="Pedido Mínimo"
                value={localSettings.minimum_order_value}
                onChange={(v) => handleNumberChange('minimum_order_value', v)}
                suffix="R$"
                color="text-green-600"
              />
              <NumberInput
                icon={Truck}
                label="Taxa de Entrega"
                value={localSettings.delivery_fee}
                onChange={(v) => handleNumberChange('delivery_fee', v)}
                suffix="R$"
                color="text-purple-600"
              />
              <NumberInput
                icon={Truck}
                label="Raio de Entrega"
                value={localSettings.delivery_radius}
                onChange={(v) => handleNumberChange('delivery_radius', v)}
                suffix="km"
                color="text-blue-600"
              />
              <NumberInput
                icon={Clock}
                label="Tempo de Preparo"
                value={localSettings.estimated_prep_time}
                onChange={(v) => handleNumberChange('estimated_prep_time', v)}
                suffix="min"
                color="text-orange-600"
              />
            </div>
          </section>
        </div>

        <div className="sticky bottom-6 mt-8 flex justify-center">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-xl"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Salvar Todas as Configurações
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
