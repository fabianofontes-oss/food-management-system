import type { Coupon, CouponType } from '@/modules/coupons/types'
import {
  formatCouponValue as formatCouponValueImpl,
  isCouponDateValid as isCouponDateValidImpl,
  hasUsesRemaining as hasUsesRemainingImpl,
} from '@/modules/coupons/utils'

// Helper function to format coupon for display
export function formatCouponValue(type: CouponType, value: number): string {
  return formatCouponValueImpl(type, value)
}

// Helper function to check if coupon is currently valid (date-wise)
export function isCouponDateValid(coupon: Coupon): boolean {
  return isCouponDateValidImpl(coupon)
}

// Helper function to check if coupon has uses remaining
export function hasUsesRemaining(coupon: Coupon): boolean {
  return hasUsesRemainingImpl(coupon)
}

