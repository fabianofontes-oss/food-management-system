import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

interface SystemSetting {
  id: string
  key: string
  value: string
  value_type: 'string' | 'boolean' | 'number' | 'json'
  category: string
  description: string
  updated_at: string
}

interface SystemMetrics {
  total_tenants: number
  total_stores: number
  total_orders: number
  total_deliveries: number
  total_drivers: number
  total_customers: number
  total_revenue: number
}

export function useSystemSettings() {
  const supabase = useMemo(() => createClient(), [])
  const [settings, setSettings] = useState<SystemSetting[]>([])
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSettings()
    fetchMetrics()
  }, [])

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('category')

      if (error) throw error
      setSettings(data || [])
    } catch (err) {
      console.error('Erro ao buscar configurações:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchMetrics = async () => {
    try {
      // Buscar métricas atuais do sistema
      const [tenantsRes, storesRes, ordersRes, deliveriesRes, driversRes] = await Promise.all([
        supabase.from('tenants').select('id', { count: 'exact', head: true }),
        supabase.from('stores').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('deliveries').select('id', { count: 'exact', head: true }),
        supabase.from('drivers').select('id', { count: 'exact', head: true })
      ])

      // Buscar total de receita
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
        total_customers: 0, // Calcular depois se necessário
        total_revenue: totalRevenue
      })
    } catch (err) {
      console.error('Erro ao buscar métricas:', err)
    }
  }

  const getSetting = (key: string): string | boolean | number | null => {
    const setting = settings.find(s => s.key === key)
    if (!setting) return null

    switch (setting.value_type) {
      case 'boolean':
        return setting.value === 'true'
      case 'number':
        return parseFloat(setting.value) || 0
      case 'json':
        try {
          return JSON.parse(setting.value)
        } catch {
          return null
        }
      default:
        return setting.value
    }
  }

  const updateSetting = async (key: string, value: string | boolean | number) => {
    try {
      const stringValue = typeof value === 'boolean' ? value.toString() : String(value)
      
      const { error } = await supabase
        .from('system_settings')
        .update({ 
          value: stringValue, 
          updated_at: new Date().toISOString() 
        })
        .eq('key', key)

      if (error) throw error
      await fetchSettings()
      return true
    } catch (err) {
      console.error('Erro ao atualizar configuração:', err)
      return false
    }
  }

  const getSettingsByCategory = (category: string) => {
    return settings.filter(s => s.category === category)
  }

  // Verificações rápidas de features
  const isGoogleMapsEnabled = () => getSetting('google_maps_enabled') === true
  const isRealtimeGPSEnabled = () => getSetting('realtime_gps_enabled') === true
  const isPushNotificationsEnabled = () => getSetting('push_notifications_enabled') === true
  const isGlobalDriversEnabled = () => getSetting('global_drivers_enabled') === true

  // Verificar se deve sugerir ativar API
  const shouldSuggestGoogleMaps = () => {
    const threshold = getSetting('google_maps_threshold') as number || 5000
    return (metrics?.total_deliveries || 0) >= threshold && !isGoogleMapsEnabled()
  }

  const shouldSuggestRealtimeGPS = () => {
    const threshold = getSetting('realtime_gps_threshold') as number || 20
    return (metrics?.total_drivers || 0) >= threshold && !isRealtimeGPSEnabled()
  }

  const shouldSuggestPushNotifications = () => {
    const threshold = getSetting('push_notifications_threshold') as number || 100
    return (metrics?.total_customers || 0) >= threshold && !isPushNotificationsEnabled()
  }

  return {
    settings,
    metrics,
    loading,
    getSetting,
    updateSetting,
    getSettingsByCategory,
    refreshSettings: fetchSettings,
    refreshMetrics: fetchMetrics,
    // Features
    isGoogleMapsEnabled,
    isRealtimeGPSEnabled,
    isPushNotificationsEnabled,
    isGlobalDriversEnabled,
    // Sugestões
    shouldSuggestGoogleMaps,
    shouldSuggestRealtimeGPS,
    shouldSuggestPushNotifications
  }
}
