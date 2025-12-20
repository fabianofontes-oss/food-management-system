import { z } from 'zod'

export const deliveryModeSchema = z.enum(['internal', 'hybrid'])
export type DeliveryMode = z.infer<typeof deliveryModeSchema>

export const deliveryFeeTypeSchema = z.enum(['fixed', 'distance'])
export type DeliveryFeeType = z.infer<typeof deliveryFeeTypeSchema>

export const deliverySettingsSchema = z.object({
  store_id: z.string().uuid(),
  delivery_mode: deliveryModeSchema,
  require_proof_photo: z.boolean(),
  auto_assign_orders: z.boolean(),
  delivery_fee_type: deliveryFeeTypeSchema,
  created_at: z.string().optional(),
  updated_at: z.string().optional()
})

export type DeliverySettings = z.infer<typeof deliverySettingsSchema>

export const updateDeliverySettingsSchema = z.object({
  delivery_mode: deliveryModeSchema.optional(),
  require_proof_photo: z.boolean().optional(),
  auto_assign_orders: z.boolean().optional(),
  delivery_fee_type: deliveryFeeTypeSchema.optional()
})

export type UpdateDeliverySettingsInput = z.infer<typeof updateDeliverySettingsSchema>

export const toggleShiftInputSchema = z.object({
  storeId: z.string().uuid()
})

export const completeDeliveryInputSchema = z.object({
  orderId: z.string().uuid(),
  photoUrl: z.string().url()
})

export const validateDeliveryTokenSchema = z.object({
  storeId: z.string().uuid(),
  deliveryId: z.string().uuid(),
  token: z.string().uuid()
})

export const autoAssignDriverSchema = z.object({
  storeId: z.string().uuid(),
  orderId: z.string().uuid()
})

export interface DriverShift {
  id: string
  store_id: string
  driver_id: string
  start_at: string
  end_at: string | null
  status: 'active' | 'completed'
  created_at: string
  updated_at: string
}

export interface AvailableDriver {
  driver_id: string
  driver_name: string
  driver_phone: string
  current_deliveries_count: number
}

export interface DeliveryWithToken {
  id: string
  access_token: string
  status: string
  driver_name: string | null
  driver_rating?: number | null
  rated_at?: string | null
  customer_confirmed_at?: string | null
  order?: {
    order_code: string
    customer_name: string
  }
}
