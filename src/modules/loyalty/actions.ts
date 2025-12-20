'use server'

import type {
  BirthdayDiscountResult,
  CreditPointsResult,
  CustomerLoyaltySummary,
  RedeemEligibilityResult,
  RedeemPointsResult,
  RegistrationBonusResult,
  UpdateBirthDateResult,
} from './types'
import {
  getCustomerBirthDateRepository,
  getCustomerLoyaltyRowRepository,
  getStoreLoyaltyConfigRepository,
  rpcCreditLoyaltyPointsRepository,
  rpcGiveRegistrationBonusRepository,
  rpcRedeemLoyaltyPointsRepository,
  updateCustomerBirthDateRepository,
} from './repository'

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
    const pointsAdded = await rpcCreditLoyaltyPointsRepository({
      storeId,
      customerId,
      orderId,
      orderTotal,
    })

    const loyalty = await getCustomerLoyaltyRowRepository({ storeId, customerId })

    return {
      success: true,
      points_added: pointsAdded,
      new_balance: loyalty?.stamps_current || 0,
    }
  } catch (err) {
    console.error('Erro ao creditar pontos:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Erro interno' }
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
    const data = await rpcRedeemLoyaltyPointsRepository({ storeId, customerId, orderId })

    if (!data.success) {
      return {
        success: false,
        error: data.error || 'Saldo insuficiente',
      }
    }

    return {
      success: true,
      discount_amount: data.reward_value,
      stamps_used: data.stamps_used,
      stamps_remaining: data.stamps_remaining,
    }
  } catch (err) {
    console.error('Erro ao resgatar pontos:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Erro interno' }
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
    const bonus = await rpcGiveRegistrationBonusRepository({ storeId, customerId })

    return {
      success: true,
      bonus_stamps: bonus,
    }
  } catch (err) {
    console.error('Erro ao dar bônus:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Erro interno' }
  }
}

/**
 * Verifica se cliente pode resgatar pontos
 */
export async function checkRedeemEligibility(
  storeId: string,
  customerId: string
): Promise<RedeemEligibilityResult> {
  try {
    const store = await getStoreLoyaltyConfigRepository(storeId)
    const loyalty = await getCustomerLoyaltyRowRepository({ storeId, customerId })

    const stampsRequired = store?.loyalty_stamps_to_reward ?? 10
    const currentStamps = loyalty?.stamps_current ?? 0
    const rewardValue = store?.loyalty_reward_value ?? 15

    return {
      canRedeem: currentStamps >= stampsRequired,
      stampsRequired,
      currentStamps,
      rewardValue,
    }
  } catch (err) {
    console.error('Erro ao verificar elegibilidade:', err)
    return {
      canRedeem: false,
      stampsRequired: 10,
      currentStamps: 0,
      rewardValue: 0,
    }
  }
}

/**
 * Verifica se é aniversário do cliente e retorna desconto
 */
export async function checkBirthdayDiscount(
  storeId: string,
  customerId: string
): Promise<BirthdayDiscountResult> {
  try {
    const store = await getStoreLoyaltyConfigRepository(storeId)

    if (!store?.loyalty_birthday_active) {
      return { isBirthday: false, discountPercent: 0, alreadyUsed: false }
    }

    const birthDateRaw = await getCustomerBirthDateRepository(customerId)

    if (!birthDateRaw) {
      return { isBirthday: false, discountPercent: 0, alreadyUsed: false }
    }

    const birthDate = new Date(birthDateRaw)
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

    const diffDays = Math.abs(todayMonth * 30 + todayDay - (birthMonth * 30 + birthDay))

    const isBirthday = diffDays <= daysRange

    // TODO: Verificar se já usou o desconto este ano
    // Por simplicidade, retornamos false por enquanto
    const alreadyUsed = false

    return {
      isBirthday,
      discountPercent: store.loyalty_birthday_discount_percent || 10,
      alreadyUsed,
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
): Promise<UpdateBirthDateResult> {
  try {
    await updateCustomerBirthDateRepository({ customerId, birthDate })

    return { success: true }
  } catch (err) {
    console.error('Erro ao atualizar nascimento:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Erro interno' }
  }
}

/**
 * Busca dados de fidelidade do cliente
 */
export async function getCustomerLoyalty(
  storeId: string,
  customerId: string
): Promise<CustomerLoyaltySummary | null> {
  try {
    const loyalty = await getCustomerLoyaltyRowRepository({ storeId, customerId })
    const store = await getStoreLoyaltyConfigRepository(storeId)

    return {
      stamps_current: loyalty?.stamps_current || 0,
      stamps_completed: loyalty?.stamps_completed || 0,
      points_balance: loyalty?.points_balance || 0,
      total_orders: loyalty?.total_orders || 0,
      total_spent: loyalty?.total_spent || 0,
      stamps_to_reward: store?.loyalty_stamps_to_reward || 10,
      reward_value: store?.loyalty_reward_value || 15,
      can_redeem: (loyalty?.stamps_current || 0) >= (store?.loyalty_stamps_to_reward || 10),
    }
  } catch (err) {
    console.error('Erro ao buscar fidelidade:', err)
    return null
  }
}
