'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Gift, Star, Settings, Save, Loader2, Cake, UserPlus, Clock,
  Calculator, Trophy, ToggleLeft, ToggleRight, AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

interface LoyaltyConfig {
  loyalty_active: boolean
  
  // Aniversário
  loyalty_birthday_active: boolean
  loyalty_birthday_discount_percent: number
  loyalty_birthday_window: 'day' | 'week' | 'month'
  
  // Cadastro
  loyalty_registration_active: boolean
  loyalty_registration_bonus_stamps: number
  
  // Retenção
  loyalty_retention_first_warning_days: number
  loyalty_retention_second_warning_days: number
  loyalty_retention_second_warning_discount: number
  
  // Pontos/Selos
  loyalty_calculation_type: 'order' | 'value'
  loyalty_order_value_per_stamp: number
  loyalty_stamps_to_reward: number
  loyalty_reward_type: 'credit' | 'product'
  loyalty_reward_value: number
}

const DEFAULT_CONFIG: LoyaltyConfig = {
  loyalty_active: true,
  loyalty_birthday_active: true,
  loyalty_birthday_discount_percent: 10,
  loyalty_birthday_window: 'week',
  loyalty_registration_active: true,
  loyalty_registration_bonus_stamps: 2,
  loyalty_retention_first_warning_days: 30,
  loyalty_retention_second_warning_days: 60,
  loyalty_retention_second_warning_discount: 15,
  loyalty_calculation_type: 'order',
  loyalty_order_value_per_stamp: 20,
  loyalty_stamps_to_reward: 10,
  loyalty_reward_type: 'credit',
  loyalty_reward_value: 15
}

export default function LoyaltySettingsPage() {
  const params = useParams()
  const slug = params.slug as string
  const supabase = useMemo(() => createClient(), [])
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [storeId, setStoreId] = useState<string | null>(null)
  const [config, setConfig] = useState<LoyaltyConfig>(DEFAULT_CONFIG)

  useEffect(() => {
    async function loadConfig() {
      const { data: store } = await supabase
        .from('stores')
        .select(`
          id,
          loyalty_active,
          loyalty_birthday_active,
          loyalty_birthday_discount_percent,
          loyalty_birthday_window,
          loyalty_registration_active,
          loyalty_registration_bonus_stamps,
          loyalty_retention_first_warning_days,
          loyalty_retention_second_warning_days,
          loyalty_retention_second_warning_discount,
          loyalty_calculation_type,
          loyalty_order_value_per_stamp,
          loyalty_stamps_to_reward,
          loyalty_reward_type,
          loyalty_reward_value
        `)
        .eq('slug', slug)
        .single()

      if (store) {
        setStoreId(store.id)
        setConfig({
          loyalty_active: store.loyalty_active ?? true,
          loyalty_birthday_active: store.loyalty_birthday_active ?? true,
          loyalty_birthday_discount_percent: store.loyalty_birthday_discount_percent ?? 10,
          loyalty_birthday_window: store.loyalty_birthday_window ?? 'week',
          loyalty_registration_active: store.loyalty_registration_active ?? true,
          loyalty_registration_bonus_stamps: store.loyalty_registration_bonus_stamps ?? 2,
          loyalty_retention_first_warning_days: store.loyalty_retention_first_warning_days ?? 30,
          loyalty_retention_second_warning_days: store.loyalty_retention_second_warning_days ?? 60,
          loyalty_retention_second_warning_discount: store.loyalty_retention_second_warning_discount ?? 15,
          loyalty_calculation_type: store.loyalty_calculation_type ?? 'order',
          loyalty_order_value_per_stamp: store.loyalty_order_value_per_stamp ?? 20,
          loyalty_stamps_to_reward: store.loyalty_stamps_to_reward ?? 10,
          loyalty_reward_type: store.loyalty_reward_type ?? 'credit',
          loyalty_reward_value: store.loyalty_reward_value ?? 15
        })
      }
      setLoading(false)
    }
    loadConfig()
  }, [slug, supabase])

  const handleSave = async () => {
    if (!storeId) return
    setSaving(true)

    const { error } = await supabase
      .from('stores')
      .update(config)
      .eq('id', storeId)

    setSaving(false)

    if (error) {
      toast.error('Erro ao salvar configurações')
      console.error(error)
    } else {
      toast.success('Configurações salvas com sucesso!')
    }
  }

  const updateConfig = <K extends keyof LoyaltyConfig>(key: K, value: LoyaltyConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg shadow-amber-500/25">
                <Gift className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
              Programa de Fidelidade
            </h1>
            <p className="text-slate-500 mt-2 ml-14">Configure seu programa de fidelização de clientes</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-medium hover:from-amber-600 hover:to-orange-700 transition-all shadow-lg shadow-amber-500/25 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Salvar
          </button>
        </div>

        {/* Toggle Principal */}
        <div className={`rounded-2xl p-6 border-2 transition-all ${
          config.loyalty_active 
            ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200' 
            : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${config.loyalty_active ? 'bg-amber-100' : 'bg-slate-200'}`}>
                <Star className={`w-6 h-6 ${config.loyalty_active ? 'text-amber-600' : 'text-slate-400'}`} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Programa Ativo</h2>
                <p className="text-sm text-slate-500">
                  {config.loyalty_active ? 'Clientes estão acumulando selos' : 'Programa desativado'}
                </p>
              </div>
            </div>
            <button
              onClick={() => updateConfig('loyalty_active', !config.loyalty_active)}
              className="p-1"
            >
              {config.loyalty_active ? (
                <ToggleRight className="w-12 h-12 text-amber-500" />
              ) : (
                <ToggleLeft className="w-12 h-12 text-slate-300" />
              )}
            </button>
          </div>
        </div>

        {config.loyalty_active && (
          <>
            {/* Configuração de Selos */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
              <h3 className="font-semibold text-slate-800 mb-6 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-amber-600" />
                Regras de Acúmulo
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tipo de Cálculo */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Como o cliente ganha selos?
                  </label>
                  <div className="space-y-2">
                    <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      config.loyalty_calculation_type === 'order' 
                        ? 'border-amber-500 bg-amber-50' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}>
                      <input
                        type="radio"
                        name="calculation_type"
                        checked={config.loyalty_calculation_type === 'order'}
                        onChange={() => updateConfig('loyalty_calculation_type', 'order')}
                        className="w-4 h-4 text-amber-500"
                      />
                      <div>
                        <p className="font-medium text-slate-800">Por Pedido</p>
                        <p className="text-sm text-slate-500">1 pedido = 1 selo</p>
                      </div>
                    </label>
                    <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      config.loyalty_calculation_type === 'value' 
                        ? 'border-amber-500 bg-amber-50' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}>
                      <input
                        type="radio"
                        name="calculation_type"
                        checked={config.loyalty_calculation_type === 'value'}
                        onChange={() => updateConfig('loyalty_calculation_type', 'value')}
                        className="w-4 h-4 text-amber-500"
                      />
                      <div>
                        <p className="font-medium text-slate-800">Por Valor</p>
                        <p className="text-sm text-slate-500">A cada R$ X gastos = 1 selo</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Valor por selo (se por valor) */}
                {config.loyalty_calculation_type === 'value' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Valor para ganhar 1 selo
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">R$</span>
                      <input
                        type="number"
                        value={config.loyalty_order_value_per_stamp}
                        onChange={(e) => updateConfig('loyalty_order_value_per_stamp', Number(e.target.value))}
                        className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Ex: R$ 20 = a cada R$ 20 gastos, ganha 1 selo</p>
                  </div>
                )}

                {/* Meta de selos */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Quantos selos para completar?
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={config.loyalty_stamps_to_reward}
                    onChange={(e) => updateConfig('loyalty_stamps_to_reward', Number(e.target.value))}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                  />
                  <p className="text-xs text-slate-500 mt-1">Número de selos para ganhar o prêmio</p>
                </div>

                {/* Valor do Prêmio */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Valor do prêmio (desconto)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">R$</span>
                    <input
                      type="number"
                      value={config.loyalty_reward_value}
                      onChange={(e) => updateConfig('loyalty_reward_value', Number(e.target.value))}
                      className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Quanto o cliente ganha ao completar</p>
                </div>
              </div>

              {/* Preview */}
              <div className="mt-6 p-4 bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl">
                <p className="text-amber-800 text-sm">
                  <strong>📋 Resumo:</strong> Cliente completa{' '}
                  <strong>{config.loyalty_stamps_to_reward} {config.loyalty_calculation_type === 'order' ? 'pedidos' : `x R$ ${config.loyalty_order_value_per_stamp}`}</strong>{' '}
                  → ganha <strong>{formatCurrency(config.loyalty_reward_value)}</strong> de desconto
                </p>
              </div>
            </div>

            {/* Aniversário */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <Cake className="w-5 h-5 text-pink-500" />
                  Mimo de Aniversário
                </h3>
                <button
                  onClick={() => updateConfig('loyalty_birthday_active', !config.loyalty_birthday_active)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    config.loyalty_birthday_active
                      ? 'bg-pink-100 text-pink-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {config.loyalty_birthday_active ? 'Ativo' : 'Desativado'}
                </button>
              </div>

              {config.loyalty_birthday_active && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Desconto de Aniversário
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={config.loyalty_birthday_discount_percent}
                        onChange={(e) => updateConfig('loyalty_birthday_discount_percent', Number(e.target.value))}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">%</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Período de validade
                    </label>
                    <select
                      value={config.loyalty_birthday_window}
                      onChange={(e) => updateConfig('loyalty_birthday_window', e.target.value as 'day' | 'week' | 'month')}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10"
                    >
                      <option value="day">Apenas no dia</option>
                      <option value="week">Na semana do aniversário</option>
                      <option value="month">No mês do aniversário</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Bônus de Cadastro */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-emerald-500" />
                  Bônus de Cadastro
                </h3>
                <button
                  onClick={() => updateConfig('loyalty_registration_active', !config.loyalty_registration_active)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    config.loyalty_registration_active
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {config.loyalty_registration_active ? 'Ativo' : 'Desativado'}
                </button>
              </div>

              {config.loyalty_registration_active && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Selos de bônus ao completar cadastro
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={config.loyalty_registration_bonus_stamps}
                    onChange={(e) => updateConfig('loyalty_registration_bonus_stamps', Number(e.target.value))}
                    className="w-full max-w-xs px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Cliente ganha selos ao preencher e-mail e data de nascimento
                  </p>
                </div>
              )}
            </div>

            {/* Régua de Retenção */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
              <h3 className="font-semibold text-slate-800 mb-6 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Régua de Retenção (CRM)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Primeiro Aviso */}
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">🟡</span>
                    <span className="font-medium text-amber-800">Primeiro Aviso</span>
                  </div>
                  <label className="block text-sm text-amber-700 mb-2">
                    Dias sem comprar
                  </label>
                  <input
                    type="number"
                    min="7"
                    max="90"
                    value={config.loyalty_retention_first_warning_days}
                    onChange={(e) => updateConfig('loyalty_retention_first_warning_days', Number(e.target.value))}
                    className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg focus:border-amber-500"
                  />
                </div>

                {/* Segundo Aviso */}
                <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">🔴</span>
                    <span className="font-medium text-red-800">Risco de Perda</span>
                  </div>
                  <label className="block text-sm text-red-700 mb-2">
                    Dias sem comprar
                  </label>
                  <input
                    type="number"
                    min="14"
                    max="180"
                    value={config.loyalty_retention_second_warning_days}
                    onChange={(e) => updateConfig('loyalty_retention_second_warning_days', Number(e.target.value))}
                    className="w-full px-4 py-2 border-2 border-red-200 rounded-lg focus:border-red-500"
                  />
                </div>

                {/* Desconto Agressivo */}
                <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">🎁</span>
                    <span className="font-medium text-red-800">Cupom de Resgate</span>
                  </div>
                  <label className="block text-sm text-red-700 mb-2">
                    Desconto para voltar
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="5"
                      max="50"
                      value={config.loyalty_retention_second_warning_discount}
                      onChange={(e) => updateConfig('loyalty_retention_second_warning_discount', Number(e.target.value))}
                      className="w-full px-4 py-2 border-2 border-red-200 rounded-lg focus:border-red-500"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500">%</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-slate-50 rounded-xl">
                <p className="text-slate-600 text-sm">
                  <strong>💡 Como funciona:</strong> No CRM, clientes que não compram há{' '}
                  <strong>{config.loyalty_retention_first_warning_days} dias</strong> ficam amarelos.{' '}
                  Acima de <strong>{config.loyalty_retention_second_warning_days} dias</strong>, ficam vermelhos{' '}
                  e você pode oferecer <strong>{config.loyalty_retention_second_warning_discount}%</strong> de desconto para reconquistá-los.
                </p>
              </div>
            </div>
          </>
        )}

        {/* Botão Salvar Mobile */}
        <div className="md:hidden">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-medium disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  )
}
