import type { CouponType, Coupon } from './types'

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
