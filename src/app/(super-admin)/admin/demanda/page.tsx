'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  BarChart3, Map, Navigation, Bell, Settings, TrendingUp, 
  Store, Package, Truck, Users, DollarSign, AlertTriangle,
  Check, X, Loader2, RefreshCw, Zap, Globe
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface SystemSetting {
  id: string
  key: string
  value: string
  value_type: string
  category: string
  description: string
}

interface Metrics {
  total_tenants: number
  total_stores: number
  total_orders: number
  total_deliveries: number
  total_drivers: number
  total_revenue: number
  orders_this_month: number
  deliveries_this_month: number
}

export default function DemandaPage() {
  const supabase = useMemo(() => createClient(), [])
  const [settings, setSettings] = useState<SystemSetting[]>([])
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Buscar configurações
      const { data: settingsData } = await supabase
        .from('system_settings')
        .select('*')
        .order('category')

      if (settingsData) setSettings(settingsData)

      // Buscar métricas
      const [tenantsRes, storesRes, ordersRes, deliveriesRes, driversRes] = await Promise.all([
        supabase.from('tenants').select('id', { count: 'exact', head: true }),
        supabase.from('stores').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('deliveries').select('id', { count: 'exact', head: true }),
        supabase.from('drivers').select('id', { count: 'exact', head: true })
      ])

      // Métricas do mês
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { count: ordersMonth } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString())

      const { count: deliveriesMonth } = await supabase
        .from('deliveries')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString())

      // Receita total
      const { data: revenueData } = await supabase
        .from('orders')
        .select('total_amount')

      const totalRevenue = revenueData?.reduce((acc: number, o: { total_amount: number }) => acc + (o.total_amount || 0), 0) || 0

      setMetrics({
        total_tenants: tenantsRes.count || 0,
        total_stores: storesRes.count || 0,
        total_orders: ordersRes.count || 0,
        total_deliveries: deliveriesRes.count || 0,
        total_drivers: driversRes.count || 0,
        total_revenue: totalRevenue,
        orders_this_month: ordersMonth || 0,
        deliveries_this_month: deliveriesMonth || 0
      })
    } catch (err) {
      console.error('Erro:', err)
    } finally {
      setLoading(false)
    }
  }

  const getSetting = (key: string): string => {
    return settings.find(s => s.key === key)?.value || ''
  }

  const isEnabled = (key: string): boolean => {
    return getSetting(key) === 'true'
  }

  const toggleSetting = async (key: string) => {
    setSaving(key)
    try {
      const currentValue = getSetting(key)
      const newValue = currentValue === 'true' ? 'false' : 'true'

      await supabase
        .from('system_settings')
        .update({ value: newValue, updated_at: new Date().toISOString() })
        .eq('key', key)

      await fetchData()
    } catch (err) {
      console.error('Erro:', err)
      alert('Erro ao salvar configuração')
    } finally {
      setSaving(null)
    }
  }

  const updateApiKey = async (key: string, value: string) => {
    try {
      await supabase
        .from('system_settings')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('key', key)
    } catch (err) {
      console.error('Erro:', err)
    }
  }

  const getThreshold = (key: string): number => {
    return parseInt(getSetting(key)) || 0
  }

  // Calcular custos estimados
  const estimatedCosts = {
    googleMaps: Math.ceil((metrics?.deliveries_this_month || 0) * 0.007 * 5), // ~R$0.035 por request
    realtimeGPS: Math.ceil((metrics?.total_drivers || 0) * 0.5 * 30), // ~R$0.5/dia por driver
    pushNotifications: 0 // Grátis até 10k
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              Controle de Demanda
            </h1>
            <p className="text-slate-500 mt-1">Monitore métricas e ative APIs conforme a demanda</p>
          </div>
          <Button onClick={fetchData} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
        </div>

        {/* Métricas Gerais */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Store className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm text-slate-500">Lojas</span>
            </div>
            <div className="text-2xl font-bold text-slate-800">{metrics?.total_stores || 0}</div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm text-slate-500">Pedidos (mês)</span>
            </div>
            <div className="text-2xl font-bold text-slate-800">{metrics?.orders_this_month || 0}</div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Truck className="w-5 h-5 text-orange-600" />
              </div>
              <span className="text-sm text-slate-500">Entregas (mês)</span>
            </div>
            <div className="text-2xl font-bold text-slate-800">{metrics?.deliveries_this_month || 0}</div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-sm text-slate-500">Motoristas</span>
            </div>
            <div className="text-2xl font-bold text-slate-800">{metrics?.total_drivers || 0}</div>
          </div>
        </div>

        {/* Total de Receita */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-emerald-100 mb-1">Receita Total Processada</div>
              <div className="text-4xl font-bold">{formatCurrency(metrics?.total_revenue || 0)}</div>
            </div>
            <DollarSign className="w-16 h-16 opacity-20" />
          </div>
        </div>

        {/* Controle de APIs */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Controle de APIs Pagas
            </h2>
            <p className="text-sm text-slate-500 mt-1">Ative conforme sua demanda crescer</p>
          </div>

          <div className="divide-y divide-slate-100">
            {/* Google Maps */}
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className={`p-3 rounded-xl ${isEnabled('google_maps_enabled') ? 'bg-green-100' : 'bg-slate-100'}`}>
                    <Map className={`w-6 h-6 ${isEnabled('google_maps_enabled') ? 'text-green-600' : 'text-slate-400'}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Google Maps API</h3>
                    <p className="text-sm text-slate-500 mt-1">Rotas otimizadas, geocoding, mapa embutido</p>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="text-sm">
                        <span className="text-slate-500">Demanda atual:</span>
                        <span className="ml-2 font-bold text-slate-700">{metrics?.deliveries_this_month || 0} entregas/mês</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-slate-500">Sugestão ativar:</span>
                        <span className="ml-2 font-bold text-slate-700">{getThreshold('google_maps_threshold')} entregas/mês</span>
                      </div>
                    </div>
                    {isEnabled('google_maps_enabled') && (
                      <div className="mt-3">
                        <label className="text-sm text-slate-500">API Key:</label>
                        <input
                          type="password"
                          defaultValue={getSetting('google_maps_api_key')}
                          onBlur={(e) => updateApiKey('google_maps_api_key', e.target.value)}
                          placeholder="Cole sua API key aqui"
                          className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-500 mb-2">
                    Custo estimado: <span className="font-bold text-slate-700">{formatCurrency(estimatedCosts.googleMaps)}/mês</span>
                  </div>
                  <Button
                    onClick={() => toggleSetting('google_maps_enabled')}
                    disabled={saving === 'google_maps_enabled'}
                    className={isEnabled('google_maps_enabled') 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }
                  >
                    {saving === 'google_maps_enabled' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isEnabled('google_maps_enabled') ? (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        ATIVO
                      </>
                    ) : (
                      'ATIVAR'
                    )}
                  </Button>
                </div>
              </div>
              {(metrics?.deliveries_this_month || 0) >= getThreshold('google_maps_threshold') && !isEnabled('google_maps_enabled') && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-800">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="text-sm font-medium">Demanda atingiu o limite sugerido. Considere ativar esta API.</span>
                </div>
              )}
            </div>

            {/* GPS Tempo Real */}
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className={`p-3 rounded-xl ${isEnabled('realtime_gps_enabled') ? 'bg-green-100' : 'bg-slate-100'}`}>
                    <Navigation className={`w-6 h-6 ${isEnabled('realtime_gps_enabled') ? 'text-green-600' : 'text-slate-400'}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">GPS em Tempo Real</h3>
                    <p className="text-sm text-slate-500 mt-1">Rastreamento de motoristas, posição ao vivo</p>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="text-sm">
                        <span className="text-slate-500">Motoristas ativos:</span>
                        <span className="ml-2 font-bold text-slate-700">{metrics?.total_drivers || 0}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-slate-500">Sugestão ativar:</span>
                        <span className="ml-2 font-bold text-slate-700">{getThreshold('realtime_gps_threshold')} motoristas</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-500 mb-2">
                    Custo estimado: <span className="font-bold text-slate-700">{formatCurrency(estimatedCosts.realtimeGPS)}/mês</span>
                  </div>
                  <Button
                    onClick={() => toggleSetting('realtime_gps_enabled')}
                    disabled={saving === 'realtime_gps_enabled'}
                    className={isEnabled('realtime_gps_enabled') 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }
                  >
                    {saving === 'realtime_gps_enabled' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isEnabled('realtime_gps_enabled') ? (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        ATIVO
                      </>
                    ) : (
                      'ATIVAR'
                    )}
                  </Button>
                </div>
              </div>
              {(metrics?.total_drivers || 0) >= getThreshold('realtime_gps_threshold') && !isEnabled('realtime_gps_enabled') && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-800">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="text-sm font-medium">Número de motoristas atingiu o limite sugerido. Considere ativar esta API.</span>
                </div>
              )}
            </div>

            {/* Push Notifications */}
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className={`p-3 rounded-xl ${isEnabled('push_notifications_enabled') ? 'bg-green-100' : 'bg-slate-100'}`}>
                    <Bell className={`w-6 h-6 ${isEnabled('push_notifications_enabled') ? 'text-green-600' : 'text-slate-400'}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Push Notifications</h3>
                    <p className="text-sm text-slate-500 mt-1">Notificações para clientes e motoristas (OneSignal/FCM)</p>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="text-sm">
                        <span className="text-slate-500">Usuários estimados:</span>
                        <span className="ml-2 font-bold text-slate-700">{(metrics?.total_orders || 0) / 3}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-slate-500">Sugestão ativar:</span>
                        <span className="ml-2 font-bold text-slate-700">{getThreshold('push_notifications_threshold')} usuários</span>
                      </div>
                    </div>
                    {isEnabled('push_notifications_enabled') && (
                      <div className="mt-3">
                        <label className="text-sm text-slate-500">API Key:</label>
                        <input
                          type="password"
                          defaultValue={getSetting('push_notifications_key')}
                          onBlur={(e) => updateApiKey('push_notifications_key', e.target.value)}
                          placeholder="Cole sua API key aqui"
                          className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-500 mb-2">
                    Custo estimado: <span className="font-bold text-green-600">GRÁTIS</span> (até 10k)
                  </div>
                  <Button
                    onClick={() => toggleSetting('push_notifications_enabled')}
                    disabled={saving === 'push_notifications_enabled'}
                    className={isEnabled('push_notifications_enabled') 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }
                  >
                    {saving === 'push_notifications_enabled' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isEnabled('push_notifications_enabled') ? (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        ATIVO
                      </>
                    ) : (
                      'ATIVAR'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Globais */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-500" />
              Features Globais
            </h2>
            <p className="text-sm text-slate-500 mt-1">Ative funcionalidades para todo o sistema</p>
          </div>

          <div className="divide-y divide-slate-100">
            {/* Motoristas Globais */}
            <div className="p-6 flex items-center justify-between">
              <div className="flex gap-4">
                <div className={`p-3 rounded-xl ${isEnabled('global_drivers_enabled') ? 'bg-green-100' : 'bg-slate-100'}`}>
                  <Truck className={`w-6 h-6 ${isEnabled('global_drivers_enabled') ? 'text-green-600' : 'text-slate-400'}`} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Motoristas Globais</h3>
                  <p className="text-sm text-slate-500 mt-1">Rede de motoristas compartilhados entre lojas</p>
                </div>
              </div>
              <Button
                onClick={() => toggleSetting('global_drivers_enabled')}
                disabled={saving === 'global_drivers_enabled'}
                className={isEnabled('global_drivers_enabled') 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }
              >
                {saving === 'global_drivers_enabled' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isEnabled('global_drivers_enabled') ? 'ATIVO' : 'ATIVAR'}
              </Button>
            </div>

            {/* Recompensas */}
            <div className="p-6 flex items-center justify-between">
              <div className="flex gap-4">
                <div className={`p-3 rounded-xl ${isEnabled('customer_rewards_enabled') ? 'bg-green-100' : 'bg-slate-100'}`}>
                  <TrendingUp className={`w-6 h-6 ${isEnabled('customer_rewards_enabled') ? 'text-green-600' : 'text-slate-400'}`} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Programa de Recompensas</h3>
                  <p className="text-sm text-slate-500 mt-1">Sistema de pontos e recompensas para clientes</p>
                </div>
              </div>
              <Button
                onClick={() => toggleSetting('customer_rewards_enabled')}
                disabled={saving === 'customer_rewards_enabled'}
                className={isEnabled('customer_rewards_enabled') 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }
              >
                {saving === 'customer_rewards_enabled' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isEnabled('customer_rewards_enabled') ? 'ATIVO' : 'ATIVAR'}
              </Button>
            </div>

            {/* Multi-lojas */}
            <div className="p-6 flex items-center justify-between">
              <div className="flex gap-4">
                <div className={`p-3 rounded-xl ${isEnabled('multi_store_enabled') ? 'bg-green-100' : 'bg-slate-100'}`}>
                  <Store className={`w-6 h-6 ${isEnabled('multi_store_enabled') ? 'text-green-600' : 'text-slate-400'}`} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Multi-Lojas</h3>
                  <p className="text-sm text-slate-500 mt-1">Tenant pode gerenciar múltiplas lojas</p>
                </div>
              </div>
              <Button
                onClick={() => toggleSetting('multi_store_enabled')}
                disabled={saving === 'multi_store_enabled'}
                className={isEnabled('multi_store_enabled') 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }
              >
                {saving === 'multi_store_enabled' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isEnabled('multi_store_enabled') ? 'ATIVO' : 'ATIVAR'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
