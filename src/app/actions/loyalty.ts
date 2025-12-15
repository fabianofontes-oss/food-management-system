'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface CreditPointsResult {
  success: boolean
  points_added?: number
  new_balance?: number
  error?: string
}

interface RedeemPointsResult {
  success: boolean
  discount_amount?: number
  stamps_used?: number
  stamps_remaining?: number
  error?: string
}

interface RegistrationBonusResult {
  success: boolean
  bonus_stamps?: number
  error?: string
}

/**
 * Credita pontos/selos ao cliente após um pedido
 */
export async function creditLoyaltyPoints(
  storeId: string,
  customerId: string,
  orderId: string,
  orderTotal: number
): Promise<CreditPointsResult> {
  try {
    const supabase = await createClient()

    // Chamar função do banco de dados
    const { data, error } = await supabase.rpc('credit_loyalty_points', {
      p_store_id: storeId,
      p_customer_id: customerId,
      p_order_id: orderId,
      p_order_total: orderTotal
    })

    if (error) {
      console.error('Erro ao creditar pontos:', error)
      return { success: false, error: error.message }
    }

    // Buscar novo saldo
    const { data: loyalty } = await supabase
      .from('customer_loyalty')
      .select('stamps_current')
      .eq('customer_id', customerId)
      .eq('store_id', storeId)
      .single()

    return {
      success: true,
      points_added: data || 0,
      new_balance: loyalty?.stamps_current || 0
    }
  } catch (err) {
    console.error('Erro ao creditar pontos:', err)
    return { success: false, error: 'Erro interno' }
  }
}

/**
 * Resgata pontos/selos por desconto
 */
export async function redeemLoyaltyPoints(
  storeId: string,
  customerId: string,
  orderId: string
): Promise<RedeemPointsResult> {
  try {
    const supabase = await createClient()

    // Chamar função do banco de dados
    const { data, error } = await supabase.rpc('redeem_loyalty_points', {
      p_store_id: storeId,
      p_customer_id: customerId,
      p_order_id: orderId
    })

    if (error) {
      console.error('Erro ao resgatar pontos:', error)
      return { success: false, error: error.message }
    }

    if (!data.success) {
      return { 
        success: false, 
        error: data.error || 'Saldo insuficiente'
      }
    }

    return {
      success: true,
      discount_amount: data.reward_value,
      stamps_used: data.stamps_used,
      stamps_remaining: data.stamps_remaining
    }
  } catch (err) {
    console.error('Erro ao resgatar pontos:', err)
    return { success: false, error: 'Erro interno' }
  }
}

/**
 * Dá bônus de selos ao completar cadastro
 */
export async function giveRegistrationBonus(
  storeId: string,
  customerId: string
): Promise<RegistrationBonusResult> {
  try {
    const supabase = await createClient()

    // Chamar função do banco de dados
    const { data, error } = await supabase.rpc('give_registration_bonus', {
      p_store_id: storeId,
      p_customer_id: customerId
    })

    if (error) {
      console.error('Erro ao dar bônus:', error)
      return { success: false, error: error.message }
    }

    return {
      success: true,
      bonus_stamps: data || 0
    }
  } catch (err) {
    console.error('Erro ao dar bônus:', err)
    return { success: false, error: 'Erro interno' }
  }
}

/**
 * Verifica se cliente pode resgatar pontos
 */
export async function checkRedeemEligibility(
  storeId: string,
  customerId: string
): Promise<{
  canRedeem: boolean
  stampsRequired: number
  currentStamps: number
  rewardValue: number
}> {
  try {
    const supabase = await createClient()

    // Buscar config da loja
    const { data: store } = await supabase
      .from('stores')
      .select('loyalty_stamps_to_reward, loyalty_reward_value')
      .eq('id', storeId)
      .single()

    // Buscar saldo do cliente
    const { data: loyalty } = await supabase
      .from('customer_loyalty')
      .select('stamps_current')
      .eq('customer_id', customerId)
      .eq('store_id', storeId)
      .single()

    const stampsRequired = store?.loyalty_stamps_to_reward || 10
    const currentStamps = loyalty?.stamps_current || 0
    const rewardValue = store?.loyalty_reward_value || 15

    return {
      canRedeem: currentStamps >= stampsRequired,
      stampsRequired,
      currentStamps,
      rewardValue
    }
  } catch (err) {
    console.error('Erro ao verificar elegibilidade:', err)
    return {
      canRedeem: false,
      stampsRequired: 10,
      currentStamps: 0,
      rewardValue: 0
    }
  }
}

/**
 * Verifica se é aniversário do cliente e retorna desconto
 */
export async function checkBirthdayDiscount(
  storeId: string,
  customerId: string
): Promise<{
  isBirthday: boolean
  discountPercent: number
  alreadyUsed: boolean
}> {
  try {
    const supabase = await createClient()

    // Buscar config da loja
    const { data: store } = await supabase
      .from('stores')
      .select('loyalty_birthday_active, loyalty_birthday_discount_percent, loyalty_birthday_window')
      .eq('id', storeId)
      .single()

    if (!store?.loyalty_birthday_active) {
      return { isBirthday: false, discountPercent: 0, alreadyUsed: false }
    }

    // Buscar cliente
    const { data: customer } = await supabase
      .from('customers')
      .select('birth_date')
      .eq('id', customerId)
      .single()

    if (!customer?.birth_date) {
      return { isBirthday: false, discountPercent: 0, alreadyUsed: false }
    }

    // Verificar se está no período de aniversário
    const birthDate = new Date(customer.birth_date)
    const today = new Date()
    const window = store.loyalty_birthday_window || 'week'
    
    let daysRange = 0
    if (window === 'day') daysRange = 0
    else if (window === 'week') daysRange = 3
    else if (window === 'month') daysRange = 15

    const birthMonth = birthDate.getMonth()
    const birthDay = birthDate.getDate()
    const todayMonth = today.getMonth()
    const todayDay = today.getDate()

    // Calcular diferença aproximada
    const diffDays = Math.abs(
      (todayMonth * 30 + todayDay) - (birthMonth * 30 + birthDay)
    )

    const isBirthday = diffDays <= daysRange

    // TODO: Verificar se já usou o desconto este ano
    // Por simplicidade, retornamos false por enquanto
    const alreadyUsed = false

    return {
      isBirthday,
      discountPercent: store.loyalty_birthday_discount_percent || 10,
      alreadyUsed
    }
  } catch (err) {
    console.error('Erro ao verificar aniversário:', err)
    return { isBirthday: false, discountPercent: 0, alreadyUsed: false }
  }
}

/**
 * Atualiza data de nascimento do cliente
 */
export async function updateCustomerBirthDate(
  customerId: string,
  birthDate: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('customers')
      .update({ 
        birth_date: birthDate,
        birth_date_verified: true 
      })
      .eq('id', customerId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('Erro ao atualizar nascimento:', err)
    return { success: false, error: 'Erro interno' }
  }
}

/**
 * Busca dados de fidelidade do cliente
 */
export async function getCustomerLoyalty(
  storeId: string,
  customerId: string
) {
  try {
    const supabase = await createClient()

    const { data: loyalty } = await supabase
      .from('customer_loyalty')
      .select('*')
      .eq('customer_id', customerId)
      .eq('store_id', storeId)
      .single()

    const { data: store } = await supabase
      .from('stores')
      .select('loyalty_stamps_to_reward, loyalty_reward_value')
      .eq('id', storeId)
      .single()

    return {
      stamps_current: loyalty?.stamps_current || 0,
      stamps_completed: loyalty?.stamps_completed || 0,
      points_balance: loyalty?.points_balance || 0,
      total_orders: loyalty?.total_orders || 0,
      total_spent: loyalty?.total_spent || 0,
      stamps_to_reward: store?.loyalty_stamps_to_reward || 10,
      reward_value: store?.loyalty_reward_value || 15,
      can_redeem: (loyalty?.stamps_current || 0) >= (store?.loyalty_stamps_to_reward || 10)
    }
  } catch (err) {
    console.error('Erro ao buscar fidelidade:', err)
    return null
  }
}
