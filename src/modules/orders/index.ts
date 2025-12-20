// Barrel export - Módulo Orders (Vertical Slice)

// Types
export * from './types'

// Repository
export { OrderRepository } from './repository'

// Server Actions
export { createOrderAction } from './actions'

// Hooks
export { useOrders } from './hooks/use-orders'
export { useOrders as useOrdersDashboard } from './hooks/use-orders-dashboard'

// Components
export { OrderCard } from './components/order-card'
export { OrderKanban } from './components/order-kanban'
