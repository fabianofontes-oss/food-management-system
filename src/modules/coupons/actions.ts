'use server'

import type { Coupon, CouponType, CouponValidationResult } from './types'
import {
  createCouponRepository,
  deleteCouponRepository,
  getCouponsRepository,
  incrementCouponUsageRepository,
  updateCouponRepository,
  validateCouponRepository,
} from './repository'

export async function validateCoupon(
  storeId: string,
  code: string,
  subtotal: number
): Promise<CouponValidationResult> {
  try {
    return await validateCouponRepository(storeId, code, subtotal)
  } catch (err) {
    console.error('Exception validating coupon:', err)
    return {
      valid: false,
      reason: 'Erro ao validar cupom',
    }
  }
}

export async function getCoupons(storeId: string) {
  return getCouponsRepository(storeId)
}

export async function createCoupon(coupon: Omit<Coupon, 'id' | 'created_at' | 'updated_at' | 'uses_count'>) {
  return createCouponRepository(coupon)
}

export async function updateCoupon(id: string, updates: Partial<Coupon>) {
  return updateCouponRepository(id, updates)
}

export async function deleteCoupon(id: string) {
  return deleteCouponRepository(id)
}

export async function toggleCouponStatus(id: string, isActive: boolean) {
  return updateCoupon(id, { is_active: isActive })
}

export async function incrementCouponUsage(storeId: string, code: string) {
  return incrementCouponUsageRepository(storeId, code)
}

export type { Coupon, CouponType }
