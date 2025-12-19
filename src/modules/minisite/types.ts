/**
 * Módulo Minisite - Types
 * Tipagem Zod + Types do Banco + Types de UI
 */

import { z } from 'zod'

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
// SCHEMAS ZOD
// ============================================================

export const ThemeColorsSchema = z.object({
  primary: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).default('#ea1d2c'),
  background: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).default('#ffffff'),
  header: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).default('#ffffff'),
})

export const ThemeDisplaySchema = z.object({
  showBanner: z.boolean().default(true),
  showLogo: z.boolean().default(true),
  showSearch: z.boolean().default(true),
  showAddress: z.boolean().default(true),
  showSocial: z.boolean().default(true),
})

export const MinisiteThemeSchema = z.object({
  layout: z.enum(LAYOUTS).default('modern'),
  colors: ThemeColorsSchema.default({}),
  display: ThemeDisplaySchema.default({}),
  bannerUrl: z.string().nullable().optional(),
})

// ============================================================
// TYPES INFERIDOS
// ============================================================

export type ThemeColors = z.infer<typeof ThemeColorsSchema>
export type ThemeDisplay = z.infer<typeof ThemeDisplaySchema>
export type MinisiteTheme = z.infer<typeof MinisiteThemeSchema>

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
