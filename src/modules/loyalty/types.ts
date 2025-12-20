export interface CreditPointsResult {
  success: boolean
  points_added?: number
  new_balance?: number
  error?: string
}

export interface RedeemPointsResult {
  success: boolean
  discount_amount?: number
  stamps_used?: number
  stamps_remaining?: number
  error?: string
}

export interface RegistrationBonusResult {
  success: boolean
  bonus_stamps?: number
  error?: string
}

export interface RedeemEligibilityResult {
  canRedeem: boolean
  stampsRequired: number
  currentStamps: number
  rewardValue: number
}

export interface BirthdayDiscountResult {
  isBirthday: boolean
  discountPercent: number
  alreadyUsed: boolean
}

export interface UpdateBirthDateResult {
  success: boolean
  error?: string
}

export interface CustomerLoyaltySummary {
  stamps_current: number
  stamps_completed: number
  points_balance: number
  total_orders: number
  total_spent: number
  stamps_to_reward: number
  reward_value: number
  can_redeem: boolean
}

export interface StoreLoyaltyConfig {
  loyalty_stamps_to_reward: number | null
  loyalty_reward_value: number | null
  loyalty_birthday_active: boolean | null
  loyalty_birthday_discount_percent: number | null
  loyalty_birthday_window: string | null
}

export interface CustomerLoyaltyRow {
  stamps_current: number | null
  stamps_completed: number | null
  points_balance: number | null
  total_orders: number | null
  total_spent: number | null
}
