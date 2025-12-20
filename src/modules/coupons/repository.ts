import { createClient } from '@/lib/supabase/server'
import type { Coupon, CouponValidationResult } from './types'

export async function validateCouponRepository(
  storeId: string,
  code: string,
  subtotal: number
): Promise<CouponValidationResult> {
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
}

export async function getCouponsRepository(storeId: string): Promise<Coupon[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching coupons:', error)
    return []
  }

  return data as Coupon[]
}

export async function createCouponRepository(
  coupon: Omit<Coupon, 'id' | 'created_at' | 'updated_at' | 'uses_count'>
): Promise<Coupon> {
  const supabase = await createClient()

  // Ensure code is uppercase
  const couponData = {
    ...coupon,
    code: coupon.code.toUpperCase().trim(),
    uses_count: 0,
  }

  const { data, error } = await supabase
    .from('coupons')
    .insert(couponData)
    .select()
    .single()

  if (error) {
    console.error('Error creating coupon:', error)
    throw new Error(error.message)
  }

  return data as Coupon
}

export async function updateCouponRepository(id: string, updates: Partial<Coupon>): Promise<Coupon> {
  const supabase = await createClient()

  // If code is being updated, ensure it's uppercase
  if (updates.code) {
    updates.code = updates.code.toUpperCase().trim()
  }

  const { data, error } = await supabase
    .from('coupons')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating coupon:', error)
    throw new Error(error.message)
  }

  return data as Coupon
}

export async function deleteCouponRepository(id: string): Promise<true> {
  const supabase = await createClient()

  const { error } = await supabase.from('coupons').delete().eq('id', id)

  if (error) {
    console.error('Error deleting coupon:', error)
    throw new Error(error.message)
  }

  return true
}

export async function incrementCouponUsageRepository(storeId: string, code: string): Promise<boolean> {
  const supabase = await createClient()

  // Atomic increment
  const { error } = await supabase.rpc('increment_coupon_usage', {
    p_store_id: storeId,
    p_code: code.toUpperCase(),
  })

  if (error) {
    console.error('Error incrementing coupon usage:', error)
    // Don't throw - this is a non-critical operation
    return false
  }

  return true
}
