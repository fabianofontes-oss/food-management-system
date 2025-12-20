// Barrel export do módulo Driver

// Types
export * from './types'

// Repository
export * from './repository'

// Actions (Server)
export * from './actions'

// Utils
export * from './utils/whatsapp'
export * from './utils/delivery-fee'

// Hooks
export { useDriverDeliveries } from './hooks/useDriverDeliveries'
export { useDriverStats } from './hooks/useDriverStats'
export { useDriverRealtime } from './hooks/useDriverRealtime'
export { useDriverLocation, useWatchDriverLocation } from './hooks/useDriverLocation'

// Components
export { DriverDashboardShell } from './components/DriverDashboardShell'
export { DeliveriesTab } from './components/tabs/DeliveriesTab'
export { HistoryTab } from './components/tabs/HistoryTab'
export { EarningsTab } from './components/tabs/EarningsTab'
export { AffiliatesTab } from './components/tabs/AffiliatesTab'
export { DeliveryProofCapture } from './components/DeliveryProofCapture'
export { GPSToggle } from './components/GPSToggle'
export { NavigationChooser, NavigationButton, getNavigationLinks } from './components/NavigationChooser'
export { SignatureCapture } from './components/SignatureCapture'
export { DriverPhotoUpload } from './components/DriverPhotoUpload'

// Integrations
export * from './integrations/marketplace'
