import { createClient } from '@/lib/supabase/server'
import type {
  CustomerLoyaltyRow,
  StoreLoyaltyConfig,
} from './types'

export async function rpcCreditLoyaltyPointsRepository(params: {
  storeId: string
  customerId: string
  orderId: string
  orderTotal: number
}): Promise<number> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('credit_loyalty_points', {
    p_store_id: params.storeId,
    p_customer_id: params.customerId,
    p_order_id: params.orderId,
    p_order_total: params.orderTotal,
  })

  if (error) throw error

  return (data as number) || 0
}

export async function rpcRedeemLoyaltyPointsRepository(params: {
  storeId: string
  customerId: string
  orderId: string
}): Promise<{
  success: boolean
  reward_value?: number
  stamps_used?: number
  stamps_remaining?: number
  error?: string
}> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('redeem_loyalty_points', {
    p_store_id: params.storeId,
    p_customer_id: params.customerId,
    p_order_id: params.orderId,
  })

  if (error) throw error

  return data as {
    success: boolean
    reward_value?: number
    stamps_used?: number
    stamps_remaining?: number
    error?: string
  }
}

export async function rpcGiveRegistrationBonusRepository(params: {
  storeId: string
  customerId: string
}): Promise<number> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('give_registration_bonus', {
    p_store_id: params.storeId,
    p_customer_id: params.customerId,
  })

  if (error) throw error

  return (data as number) || 0
}

export async function getCustomerLoyaltyRowRepository(params: {
  storeId: string
  customerId: string
}): Promise<CustomerLoyaltyRow | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('customer_loyalty')
    .select('stamps_current, stamps_completed, points_balance, total_orders, total_spent')
    .eq('customer_id', params.customerId)
    .eq('store_id', params.storeId)
    .single()

  if (error) return null

  return data as CustomerLoyaltyRow
}

export async function getStoreLoyaltyConfigRepository(storeId: string): Promise<StoreLoyaltyConfig | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('stores')
    .select(
      'loyalty_stamps_to_reward, loyalty_reward_value, loyalty_birthday_active, loyalty_birthday_discount_percent, loyalty_birthday_window'
    )
    .eq('id', storeId)
    .single()

  if (error) return null

  return data as StoreLoyaltyConfig
}

export async function getCustomerBirthDateRepository(customerId: string): Promise<string | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('customers')
    .select('birth_date')
    .eq('id', customerId)
    .single()

  if (error) return null

  const birthDate = (data as { birth_date?: string | null } | null)?.birth_date
  return birthDate ?? null
}

export async function updateCustomerBirthDateRepository(params: {
  customerId: string
  birthDate: string
}): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('customers')
    .update({
      birth_date: params.birthDate,
      birth_date_verified: true,
    })
    .eq('id', params.customerId)

  if (error) throw error
}
