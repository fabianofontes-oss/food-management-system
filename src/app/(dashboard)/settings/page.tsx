'use client'

import { useState } from 'react'
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
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface StoreSettings {
  enablePOS: boolean
  enableKitchen: boolean
  enableDelivery: boolean
  enableDineIn: boolean
  enableTakeout: boolean
  enableCash: boolean
  enableCreditCard: boolean
  enableDebitCard: boolean
  enablePix: boolean
  enableOrderNotifications: boolean
  enableWhatsAppNotifications: boolean
  enableEmailNotifications: boolean
  enableSoundAlerts: boolean
  enableLoyaltyProgram: boolean
  enableCoupons: boolean
  enableScheduledOrders: boolean
  enableTableManagement: boolean
  enableInventoryControl: boolean
  enableAutoPrint: boolean
  enableKitchenPrint: boolean
  enableIfood: boolean
  enableRappi: boolean
  enableUberEats: boolean
  minimumOrderValue: number
  deliveryFee: number
  deliveryRadius: number
  estimatedPrepTime: number
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<StoreSettings>({
    enablePOS: true,
    enableKitchen: true,
    enableDelivery: true,
    enableDineIn: true,
    enableTakeout: true,
    enableCash: true,
    enableCreditCard: true,
    enableDebitCard: true,
    enablePix: true,
    enableOrderNotifications: true,
    enableWhatsAppNotifications: false,
    enableEmailNotifications: true,
    enableSoundAlerts: true,
    enableLoyaltyProgram: false,
    enableCoupons: true,
    enableScheduledOrders: false,
    enableTableManagement: false,
    enableInventoryControl: false,
    enableAutoPrint: false,
    enableKitchenPrint: true,
    enableIfood: false,
    enableRappi: false,
    enableUberEats: false,
    minimumOrderValue: 15,
    deliveryFee: 5,
    deliveryRadius: 5,
    estimatedPrepTime: 30
  })

  const [isSaving, setIsSaving] = useState(false)

  const handleToggle = (key: keyof StoreSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleNumberChange = (key: keyof StoreSettings, value: number) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      alert('✅ Configurações salvas com sucesso!')
    } catch (error) {
      alert('❌ Erro ao salvar configurações')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    if (confirm('Deseja restaurar as configurações padrão?')) {
      setSettings({
        enablePOS: true,
        enableKitchen: true,
        enableDelivery: true,
        enableDineIn: true,
        enableTakeout: true,
        enableCash: true,
        enableCreditCard: true,
        enableDebitCard: true,
        enablePix: true,
        enableOrderNotifications: true,
        enableWhatsAppNotifications: false,
        enableEmailNotifications: true,
        enableSoundAlerts: true,
        enableLoyaltyProgram: false,
        enableCoupons: true,
        enableScheduledOrders: false,
        enableTableManagement: false,
        enableInventoryControl: false,
        enableAutoPrint: false,
        enableKitchenPrint: true,
        enableIfood: false,
        enableRappi: false,
        enableUberEats: false,
        minimumOrderValue: 15,
        deliveryFee: 5,
        deliveryRadius: 5,
        estimatedPrepTime: 30
      })
    }
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

        <div className="flex gap-3 mb-6">
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
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Configurações
              </>
            )}
          </Button>
          <Button
            onClick={handleReset}
            className="bg-gray-200 text-gray-700 hover:bg-gray-300"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Restaurar Padrão
          </Button>
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
                checked={settings.enablePOS}
                onChange={() => handleToggle('enablePOS')}
                color="text-blue-600"
              />
              <ToggleItem
                icon={ChefHat}
                label="Cozinha / KDS"
                description="Display de pedidos para a cozinha"
                checked={settings.enableKitchen}
                onChange={() => handleToggle('enableKitchen')}
                color="text-orange-600"
              />
              <ToggleItem
                icon={Truck}
                label="Delivery"
                description="Entregas em domicílio"
                checked={settings.enableDelivery}
                onChange={() => handleToggle('enableDelivery')}
                color="text-purple-600"
              />
              <ToggleItem
                icon={Store}
                label="Consumo no Local"
                description="Pedidos para consumir no estabelecimento"
                checked={settings.enableDineIn}
                onChange={() => handleToggle('enableDineIn')}
                color="text-green-600"
              />
              <ToggleItem
                icon={Package}
                label="Retirada"
                description="Pedidos para retirar no balcão"
                checked={settings.enableTakeout}
                onChange={() => handleToggle('enableTakeout')}
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
                checked={settings.enableCash}
                onChange={() => handleToggle('enableCash')}
                color="text-green-600"
              />
              <ToggleItem
                icon={CreditCard}
                label="Cartão de Crédito"
                description="Aceitar cartões de crédito"
                checked={settings.enableCreditCard}
                onChange={() => handleToggle('enableCreditCard')}
                color="text-blue-600"
              />
              <ToggleItem
                icon={CreditCard}
                label="Cartão de Débito"
                description="Aceitar cartões de débito"
                checked={settings.enableDebitCard}
                onChange={() => handleToggle('enableDebitCard')}
                color="text-purple-600"
              />
              <ToggleItem
                icon={Smartphone}
                label="PIX"
                description="Pagamento instantâneo via PIX"
                checked={settings.enablePix}
                onChange={() => handleToggle('enablePix')}
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
                checked={settings.enableOrderNotifications}
                onChange={() => handleToggle('enableOrderNotifications')}
                color="text-yellow-600"
              />
              <ToggleItem
                icon={Smartphone}
                label="WhatsApp"
                description="Enviar notificações via WhatsApp"
                checked={settings.enableWhatsAppNotifications}
                onChange={() => handleToggle('enableWhatsAppNotifications')}
                color="text-green-600"
              />
              <ToggleItem
                icon={Bell}
                label="E-mail"
                description="Enviar confirmações por e-mail"
                checked={settings.enableEmailNotifications}
                onChange={() => handleToggle('enableEmailNotifications')}
                color="text-blue-600"
              />
              <ToggleItem
                icon={Bell}
                label="Alertas Sonoros"
                description="Som ao receber novos pedidos"
                checked={settings.enableSoundAlerts}
                onChange={() => handleToggle('enableSoundAlerts')}
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
                checked={settings.enableLoyaltyProgram}
                onChange={() => handleToggle('enableLoyaltyProgram')}
                color="text-purple-600"
              />
              <ToggleItem
                icon={Package}
                label="Cupons de Desconto"
                description="Criar e gerenciar cupons promocionais"
                checked={settings.enableCoupons}
                onChange={() => handleToggle('enableCoupons')}
                color="text-orange-600"
              />
              <ToggleItem
                icon={Clock}
                label="Agendamento de Pedidos"
                description="Permitir pedidos agendados"
                checked={settings.enableScheduledOrders}
                onChange={() => handleToggle('enableScheduledOrders')}
                color="text-blue-600"
              />
              <ToggleItem
                icon={Store}
                label="Gestão de Mesas"
                description="Controle de mesas e comandas"
                checked={settings.enableTableManagement}
                onChange={() => handleToggle('enableTableManagement')}
                color="text-green-600"
              />
              <ToggleItem
                icon={Package}
                label="Controle de Estoque"
                description="Gerenciar inventário de produtos"
                checked={settings.enableInventoryControl}
                onChange={() => handleToggle('enableInventoryControl')}
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
                checked={settings.enableAutoPrint}
                onChange={() => handleToggle('enableAutoPrint')}
                color="text-gray-600"
              />
              <ToggleItem
                icon={Printer}
                label="Impressora da Cozinha"
                description="Enviar pedidos para impressora da cozinha"
                checked={settings.enableKitchenPrint}
                onChange={() => handleToggle('enableKitchenPrint')}
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
                checked={settings.enableIfood}
                onChange={() => handleToggle('enableIfood')}
                color="text-red-600"
              />
              <ToggleItem
                icon={Truck}
                label="Rappi"
                description="Integração com Rappi"
                checked={settings.enableRappi}
                onChange={() => handleToggle('enableRappi')}
                color="text-orange-600"
              />
              <ToggleItem
                icon={Truck}
                label="Uber Eats"
                description="Integração com Uber Eats"
                checked={settings.enableUberEats}
                onChange={() => handleToggle('enableUberEats')}
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
                value={settings.minimumOrderValue}
                onChange={(v) => handleNumberChange('minimumOrderValue', v)}
                suffix="R$"
                color="text-green-600"
              />
              <NumberInput
                icon={Truck}
                label="Taxa de Entrega"
                value={settings.deliveryFee}
                onChange={(v) => handleNumberChange('deliveryFee', v)}
                suffix="R$"
                color="text-purple-600"
              />
              <NumberInput
                icon={Truck}
                label="Raio de Entrega"
                value={settings.deliveryRadius}
                onChange={(v) => handleNumberChange('deliveryRadius', v)}
                suffix="km"
                color="text-blue-600"
              />
              <NumberInput
                icon={Clock}
                label="Tempo de Preparo"
                value={settings.estimatedPrepTime}
                onChange={(v) => handleNumberChange('estimatedPrepTime', v)}
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
