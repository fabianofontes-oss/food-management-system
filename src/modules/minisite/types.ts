/**
 * Módulo Minisite - Types
 * Tipagem TypeScript pura (sem Zod)
 */

// ============================================================
// ENUMS E CONSTANTES
// ============================================================

export const LAYOUTS = ['modern', 'classic', 'minimal', 'grid'] as const
export type LayoutType = typeof LAYOUTS[number]

export const LAYOUT_OPTIONS: { value: LayoutType; label: string; description: string }[] = [
  { value: 'modern', label: 'Moderno', description: 'Estilo iFood com banner grande' },
  { value: 'classic', label: 'Clássico', description: 'Lista tradicional com categorias' },
  { value: 'minimal', label: 'Minimalista', description: 'Foco no conteúdo, sem distrações' },
  { value: 'grid', label: 'Grade', description: 'Cards em grid responsivo' },
]

// ============================================================
// TYPES DO TEMA
// ============================================================

export interface ThemeColors {
  primary: string
  background: string
  header: string
}

export interface ThemeDisplay {
  showBanner: boolean
  showLogo: boolean
  showSearch: boolean
  showAddress: boolean
  showSocial: boolean
}

export interface MinisiteTheme {
  layout: LayoutType
  colors: ThemeColors
  display: ThemeDisplay
  bannerUrl?: string | null
}

// ============================================================
// DEFAULTS
// ============================================================

export const DEFAULT_THEME: MinisiteTheme = {
  layout: 'modern',
  colors: {
    primary: '#ea1d2c',
    background: '#ffffff',
    header: '#ffffff',
  },
  display: {
    showBanner: true,
    showLogo: true,
    showSearch: true,
    showAddress: true,
    showSocial: true,
  },
  bannerUrl: null,
}

// ============================================================
// TYPES DE UI
// ============================================================

export interface MinisiteStore {
  id: string
  name: string
  slug: string
  logo_url: string | null
  banner_url: string | null
  address: string | null
  phone: string | null
  whatsapp: string | null
}

export interface MinisiteProduct {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  is_available: boolean
}

export interface MinisiteCategory {
  id: string
  name: string
  color: string | null
  products: MinisiteProduct[]
}

export interface MinisiteData {
  store: MinisiteStore
  theme: MinisiteTheme
  categories: MinisiteCategory[]
}

// ============================================================
// HELPERS
// ============================================================

export function parseTheme(raw: unknown): MinisiteTheme {
  if (!raw || typeof raw !== 'object') return DEFAULT_THEME
  
  const obj = raw as Record<string, unknown>
  
  return {
    layout: (LAYOUTS.includes(obj.layout as LayoutType) ? obj.layout : 'modern') as LayoutType,
    colors: {
      primary: typeof (obj.colors as any)?.primary === 'string' ? (obj.colors as any).primary : DEFAULT_THEME.colors.primary,
      background: typeof (obj.colors as any)?.background === 'string' ? (obj.colors as any).background : DEFAULT_THEME.colors.background,
      header: typeof (obj.colors as any)?.header === 'string' ? (obj.colors as any).header : DEFAULT_THEME.colors.header,
    },
    display: {
      showBanner: typeof (obj.display as any)?.showBanner === 'boolean' ? (obj.display as any).showBanner : DEFAULT_THEME.display.showBanner,
      showLogo: typeof (obj.display as any)?.showLogo === 'boolean' ? (obj.display as any).showLogo : DEFAULT_THEME.display.showLogo,
      showSearch: typeof (obj.display as any)?.showSearch === 'boolean' ? (obj.display as any).showSearch : DEFAULT_THEME.display.showSearch,
      showAddress: typeof (obj.display as any)?.showAddress === 'boolean' ? (obj.display as any).showAddress : DEFAULT_THEME.display.showAddress,
      showSocial: typeof (obj.display as any)?.showSocial === 'boolean' ? (obj.display as any).showSocial : DEFAULT_THEME.display.showSocial,
    },
    bannerUrl: typeof obj.bannerUrl === 'string' ? obj.bannerUrl : null,
  }
}
