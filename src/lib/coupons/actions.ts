'use server'

import { createClient } from '@/lib/supabase/server'

export type CouponType = 'percent' | 'fixed'

export type Coupon = {
  id: string
  store_id: string
  code: string
  type: CouponType
  value: number
  is_active: boolean
  starts_at: string | null
  ends_at: string | null
  max_uses: number | null
  uses_count: number
  min_order_amount: number | null
  created_at: string
  updated_at: string
}

export type CouponValidationResult = {
  valid: boolean
  reason?: string
  discount_amount?: number
  coupon_code?: string
  coupon_type?: CouponType
  coupon_value?: number
}

export async function validateCoupon(
  storeId: string,
  code: string,
  subtotal: number
): Promise<CouponValidationResult> {
  const supabase = await createClient()

  try {
    // Call the database function for validation
    const { data, error } = await supabase.rpc('validate_coupon', {
      p_store_id: storeId,
      p_code: code.toUpperCase(),
      p_subtotal: subtotal
    })

    if (error) {
      console.error('Error validating coupon:', error)
      return {
        valid: false,
        reason: 'Erro ao validar cupom'
      }
    }

    return data as CouponValidationResult
  } catch (err) {
    console.error('Exception validating coupon:', err)
    return {
      valid: false,
      reason: 'Erro ao validar cupom'
    }
  }
}

export async function getCoupons(storeId: string) {
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

export async function createCoupon(coupon: Omit<Coupon, 'id' | 'created_at' | 'updated_at' | 'uses_count'>) {
  const supabase = await createClient()

  // Ensure code is uppercase
  const couponData = {
    ...coupon,
    code: coupon.code.toUpperCase().trim(),
    uses_count: 0
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

export async function updateCoupon(id: string, updates: Partial<Coupon>) {
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

export async function deleteCoupon(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('coupons')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting coupon:', error)
    throw new Error(error.message)
  }

  return true
}

export async function toggleCouponStatus(id: string, isActive: boolean) {
  return updateCoupon(id, { is_active: isActive })
}

export async function incrementCouponUsage(storeId: string, code: string) {
  const supabase = await createClient()

  // Atomic increment
  const { error } = await supabase.rpc('increment_coupon_usage', {
    p_store_id: storeId,
    p_code: code.toUpperCase()
  })

  if (error) {
    console.error('Error incrementing coupon usage:', error)
    // Don't throw - this is a non-critical operation
    return false
  }

  return true
}

// Helper function to format coupon for display
export function formatCouponValue(type: CouponType, value: number): string {
  if (type === 'percent') {
    return `${value}%`
  }
  return `R$ ${value.toFixed(2)}`
}

// Helper function to check if coupon is currently valid (date-wise)
export function isCouponDateValid(coupon: Coupon): boolean {
  const now = new Date()
  
  if (coupon.starts_at) {
    const startsAt = new Date(coupon.starts_at)
    if (now < startsAt) return false
  }
  
  if (coupon.ends_at) {
    const endsAt = new Date(coupon.ends_at)
    if (now > endsAt) return false
  }
  
  return true
}

// Helper function to check if coupon has uses remaining
export function hasUsesRemaining(coupon: Coupon): boolean {
  if (coupon.max_uses === null) return true
  return coupon.uses_count < coupon.max_uses
}
