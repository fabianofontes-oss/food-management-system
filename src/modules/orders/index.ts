// Barrel export - Módulo Orders (Vertical Slice)

// Types
export * from './types'

// Repository
export { OrderRepository } from './repository'

// Server Actions
export { createOrderAction } from './actions'

// Hooks
export { useOrders } from './hooks/use-orders'
