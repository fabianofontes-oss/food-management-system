'use client'

import { useState, useEffect, useCallback } from 'react'
import { settingsService } from '@/services/settings.service'
import type { 
  StoreSettings, 
  SalesSettings, 
  PaymentSettings, 
  NotificationSettings, 
  IntegrationSettings,
  BusinessHour,
  StoreInfo
} from '@/types/settings'
import { DEFAULT_STORE_SETTINGS } from '@/types/settings'

// Re-exporta tipos para compatibilidade
export type { StoreSettings } from '@/types/settings'

interface UseSettingsReturn {
  settings: StoreSettings
  loading: boolean
  saving: boolean
  error: string | null
  saveStatus: 'idle' | 'success' | 'error'
  save: () => Promise<boolean>
  updateInfo: (info: Partial<StoreInfo>) => void
  updateBusinessHours: (hours: BusinessHour[]) => void
  updateSales: (sales: Partial<SalesSettings>) => void
  updatePayments: (payments: Partial<PaymentSettings>) => void
  updateNotifications: (notifications: Partial<NotificationSettings>) => void
  updateIntegrations: (integrations: Partial<IntegrationSettings>) => void
  reload: () => Promise<void>
}

export function useSettings(storeId?: string): UseSettingsReturn {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const loadSettings = useCallback(async () => {
    if (!storeId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await settingsService.load(storeId)
      setSettings(data)
    } catch (err) {
      console.error('Erro ao carregar configurações:', err)
      setError('Erro ao carregar configurações')
    } finally {
      setLoading(false)
    }
  }, [storeId])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const save = useCallback(async (): Promise<boolean> => {
    if (!storeId) {
      setError('Store ID não fornecido')
      return false
    }

    try {
      setSaving(true)
      setSaveStatus('idle')
      setError(null)

      const success = await settingsService.save(storeId, settings)

      if (success) {
        setSaveStatus('success')
        setTimeout(() => setSaveStatus('idle'), 3000)
        return true
      } else {
        throw new Error('Falha ao salvar')
      }
    } catch (err) {
      console.error('Erro ao salvar configurações:', err)
      setError('Erro ao salvar configurações')
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
      return false
    } finally {
      setSaving(false)
    }
  }, [storeId, settings])

  const updateInfo = useCallback((info: Partial<StoreInfo>) => {
    setSettings(prev => ({
      ...prev,
      info: { ...prev.info, ...info }
    }))
  }, [])

  const updateBusinessHours = useCallback((hours: BusinessHour[]) => {
    setSettings(prev => ({
      ...prev,
      businessHours: hours
    }))
  }, [])

  const updateSales = useCallback((sales: Partial<SalesSettings>) => {
    setSettings(prev => ({
      ...prev,
      sales: { ...prev.sales, ...sales }
    }))
  }, [])

  const updatePayments = useCallback((payments: Partial<PaymentSettings>) => {
    setSettings(prev => ({
      ...prev,
      payments: { ...prev.payments, ...payments }
    }))
  }, [])

  const updateNotifications = useCallback((notifications: Partial<NotificationSettings>) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, ...notifications }
    }))
  }, [])

  const updateIntegrations = useCallback((integrations: Partial<IntegrationSettings>) => {
    setSettings(prev => ({
      ...prev,
      integrations: { ...prev.integrations, ...integrations }
    }))
  }, [])

  return {
    settings,
    loading,
    saving,
    error,
    saveStatus,
    save,
    updateInfo,
    updateBusinessHours,
    updateSales,
    updatePayments,
    updateNotifications,
    updateIntegrations,
    reload: loadSettings
  }
}
