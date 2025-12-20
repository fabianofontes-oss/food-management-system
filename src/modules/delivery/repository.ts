// Repository do módulo Delivery
// Apenas queries ao Supabase (sem regras de negócio)

import { createClient } from '@/lib/supabase/server'
import type { DeliverySettings, DriverShift, UpdateDeliverySettingsInput, DeliveryWithToken } from './types'

export async function getDeliverySettingsByStore(storeId: string): Promise<DeliverySettings | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('delivery_settings')
    .select('*')
    .eq('store_id', storeId)
    .maybeSingle()

  if (error || !data) return null
  return data as DeliverySettings
}

export async function updateDeliverySettingsByStore(
  storeId: string,
  data: UpdateDeliverySettingsInput
): Promise<DeliverySettings> {
  const supabase = await createClient()

  const { data: updated, error } = await supabase
    .from('delivery_settings')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('store_id', storeId)
    .select('*')
    .single()

  if (error || !updated) {
    throw new Error(error?.message || 'Erro ao atualizar configurações de delivery')
  }

  return updated as DeliverySettings
}

export async function getActiveDriverShift(storeId: string, driverId: string): Promise<DriverShift | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('driver_shifts')
    .select('*')
    .eq('store_id', storeId)
    .eq('driver_id', driverId)
    .eq('status', 'active')
    .order('start_at', { ascending: false })
    .maybeSingle()

  if (error || !data) return null
  return data as DriverShift
}

export async function startDriverShift(storeId: string, driverId: string): Promise<DriverShift> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('driver_shifts')
    .insert({
      store_id: storeId,
      driver_id: driverId,
      start_at: new Date().toISOString(),
      status: 'active'
    })
    .select('*')
    .single()

  if (error || !data) {
    throw new Error(error?.message || 'Erro ao iniciar turno')
  }

  return data as DriverShift
}

export async function completeDriverShift(shiftId: string): Promise<DriverShift> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('driver_shifts')
    .update({
      end_at: new Date().toISOString(),
      status: 'completed',
      updated_at: new Date().toISOString()
    })
    .eq('id', shiftId)
    .select('*')
    .single()

  if (error || !data) {
    throw new Error(error?.message || 'Erro ao finalizar turno')
  }

  return data as DriverShift
}

export async function saveDeliveryProofPhoto(orderId: string, photoUrl: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('deliveries')
    .update({
      proof_photo_url: photoUrl,
      status: 'delivered',
      updated_at: new Date().toISOString()
    })
    .eq('order_id', orderId)

  if (error) {
    throw new Error(error.message)
  }
}

export async function markOrderDelivered(orderId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('orders')
    .update({
      status: 'DELIVERED',
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId)

  if (error) {
    throw new Error(error.message)
  }
}

export async function getDeliveryByIdWithToken(
  storeId: string,
  deliveryId: string,
  token: string
): Promise<DeliveryWithToken | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('deliveries')
    .select(`
      store_id,
      id,
      access_token,
      status,
      driver_name,
      driver_rating,
      rated_at,
      customer_confirmed_at,
      order:orders(order_code, customer_name)
    `)
    .eq('store_id', storeId)
    .eq('id', deliveryId)
    .eq('access_token', token)
    .maybeSingle()

  if (error || !data) return null
  return data as unknown as DeliveryWithToken
}

export async function confirmDeliveryReceiptByToken(params: {
  storeId: string
  deliveryId: string
  token: string
}): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('deliveries')
    .update({
      status: 'delivered',
      customer_confirmed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('store_id', params.storeId)
    .eq('id', params.deliveryId)
    .eq('access_token', params.token)

  if (error) {
    console.error('confirmDeliveryReceiptByToken error', error)
    return false
  }

  return true
}

export async function saveDeliveryRatingByToken(params: {
  storeId: string
  deliveryId: string
  token: string
  rating: number
  comment: string | null
}): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('deliveries')
    .update({
      driver_rating: params.rating,
      rating_comment: params.comment,
      rated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('store_id', params.storeId)
    .eq('id', params.deliveryId)
    .eq('access_token', params.token)

  if (error) {
    console.error('saveDeliveryRatingByToken error', error)
    return false
  }

  return true
}

export async function getAvailableDrivers(storeId: string): Promise<any[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .rpc('get_available_drivers', { p_store_id: storeId })

  if (error || !data) return []
  return data
}

export async function assignDeliveryToDriver(
  deliveryId: string,
  storeId: string,
  driverId: string,
  driverName: string,
  driverPhone: string
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('deliveries')
    .update({
      driver_id: driverId,
      driver_name: driverName,
      driver_phone: driverPhone,
      status: 'assigned',
      updated_at: new Date().toISOString()
    })
    .eq('store_id', storeId)
    .eq('id', deliveryId)

  if (error) {
    throw new Error(error.message)
  }
}
