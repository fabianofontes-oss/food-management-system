// Barrel export - Módulo Store (Vertical Slice)

// Types
export * from './types'

// Repository
export { StoreRepository } from './repository'

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

// Components - Site Builder
export { 
  SiteBuilder, 
  LayoutSelector, 
  ColorPicker, 
  DisplayToggles, 
  LivePreview 
} from './components/site-builder'

// Components - Theme Editor
export { ThemeEditor } from './components/theme-editor'
export { StorePreview } from './components/store-preview'

// Components - Public Store Front
export { StoreFront, ClassicLayout, ModernLayout, GridLayout, MinimalLayout } from './components/public'

// Utils
export { safeParseTheme, DEFAULT_THEME, getThemeCSSVariables, isLightColor } from './utils'
