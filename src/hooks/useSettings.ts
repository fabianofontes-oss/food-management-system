import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface StoreSettings {
  id?: string
  store_id?: string
  enable_pos: boolean
  enable_kitchen: boolean
  enable_delivery: boolean
  enable_dine_in: boolean
  enable_takeout: boolean
  enable_cash: boolean
  enable_credit_card: boolean
  enable_debit_card: boolean
  enable_pix: boolean
  enable_order_notifications: boolean
  enable_whatsapp_notifications: boolean
  enable_email_notifications: boolean
  enable_sound_alerts: boolean
  enable_loyalty_program: boolean
  enable_coupons: boolean
  enable_scheduled_orders: boolean
  enable_table_management: boolean
  enable_inventory_control: boolean
  enable_auto_print: boolean
  enable_kitchen_print: boolean
  enable_ifood: boolean
  enable_rappi: boolean
  enable_uber_eats: boolean
  minimum_order_value: number
  delivery_fee: number
  delivery_radius: number
  estimated_prep_time: number
}

const DEFAULT_SETTINGS: StoreSettings = {
  enable_pos: true,
  enable_kitchen: true,
  enable_delivery: true,
  enable_dine_in: true,
  enable_takeout: true,
  enable_cash: true,
  enable_credit_card: true,
  enable_debit_card: true,
  enable_pix: true,
  enable_order_notifications: true,
  enable_whatsapp_notifications: false,
  enable_email_notifications: true,
  enable_sound_alerts: true,
  enable_loyalty_program: false,
  enable_coupons: true,
  enable_scheduled_orders: false,
  enable_table_management: false,
  enable_inventory_control: false,
  enable_auto_print: false,
  enable_kitchen_print: true,
  enable_ifood: false,
  enable_rappi: false,
  enable_uber_eats: false,
  minimum_order_value: 15,
  delivery_fee: 5,
  delivery_radius: 5,
  estimated_prep_time: 30
}

export function useSettings(storeId?: string) {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (storeId) {
      loadSettings(storeId)
    } else {
      setLoading(false)
    }
  }, [storeId])

  const loadSettings = async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('store_settings')
        .select('*')
        .eq('store_id', id)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          await createDefaultSettings(id)
          return
        }
        throw fetchError
      }

      if (data) {
        setSettings(data as StoreSettings)
      }
    } catch (err) {
      console.error('Error loading settings:', err)
      setError('Erro ao carregar configurações')
    } finally {
      setLoading(false)
    }
  }

  const createDefaultSettings = async (id: string) => {
    try {
      const { data, error: insertError } = await supabase
        .from('store_settings')
        .insert({ store_id: id, ...DEFAULT_SETTINGS })
        .select()
        .single()

      if (insertError) throw insertError

      if (data) {
        setSettings(data as StoreSettings)
      }
    } catch (err) {
      console.error('Error creating default settings:', err)
      setError('Erro ao criar configurações padrão')
    }
  }

  const updateSettings = async (updates: Partial<StoreSettings>) => {
    if (!storeId) {
      setError('Store ID não fornecido')
      return false
    }

    try {
      setError(null)

      const newSettings = { ...settings, ...updates }

      const { error: updateError } = await supabase
        .from('store_settings')
        .update(updates)
        .eq('store_id', storeId)

      if (updateError) throw updateError

      setSettings(newSettings)
      return true
    } catch (err) {
      console.error('Error updating settings:', err)
      setError('Erro ao salvar configurações')
      return false
    }
  }

  const resetToDefaults = async () => {
    return await updateSettings(DEFAULT_SETTINGS)
  }

  return {
    settings,
    loading,
    error,
    updateSettings,
    resetToDefaults,
    refreshSettings: () => storeId && loadSettings(storeId)
  }
}
