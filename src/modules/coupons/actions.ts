'use server'

import { createClient } from '@/lib/supabase/server'
import type { Coupon, CouponType, CouponValidationResult } from './types'
import {
  createCouponRepository,
  deleteCouponRepository,
  getCouponsRepository,
  incrementCouponUsageRepository,
  updateCouponRepository,
} from './repository'

export async function validateCoupon(
  storeId: string,
  code: string,
  subtotal: number
): Promise<CouponValidationResult> {
  try {
    const supabase = await createClient()

    // Call the database function for validation
    const { data, error } = await supabase.rpc('validate_coupon', {
      p_store_id: storeId,
      p_code: code.toUpperCase(),
      p_subtotal: subtotal,
    })

    if (error) {
      console.error('Error validating coupon:', error)
      return {
        valid: false,
        reason: 'Erro ao validar cupom',
      }
    }

    return data as CouponValidationResult
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
