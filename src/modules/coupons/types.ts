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
