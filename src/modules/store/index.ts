// Barrel export - Módulo Store (Vertical Slice)
// NOTA: Componentes visuais foram removidos. Manter apenas lógica.

// Types
export * from './types'

// Repository

// Server Actions
export {
  getStoreAction,
  updateStoreAction,
  updateStoreSettingsAction,
  updateMenuThemeAction
} from './actions'

// Hooks
export { 
  useStore, 
  useStoreId, 
  useStoreSettings,
  useStoreById 
} from './hooks/use-store'

export { useMenuTheme } from './hooks/use-menu-theme'

// Utils
export { safeParseTheme, DEFAULT_THEME, getThemeCSSVariables, isLightColor } from './utils'
