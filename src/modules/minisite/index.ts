/**
 * Módulo Minisite - Barrel Export
 * Vertical Slice completo para cardápio público e editor de aparência
 * 
 * NOTA: Repository e Actions são server-only, importe diretamente quando necessário
 */

// Types
export * from './types'

// Hooks (client-safe)
export { useMinisiteTheme } from './hooks/use-minisite-theme'

// Components (client-safe)
export { 
  LayoutPicker, 
  ColorPicker, 
  DisplayToggles, 
  ThemeEditor, 
  StoreFront 
} from './components'

// Server-only exports (use dynamic import ou import direto)
// export { MinisiteRepository } from './repository'
// export { updateMinisiteThemeAction, updateMinisiteBannerAction } from './actions'
