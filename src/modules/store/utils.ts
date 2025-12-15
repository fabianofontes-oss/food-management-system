import type { MenuTheme, MenuLayout } from './types'

/**
 * Tema padrão seguro - usado quando o banco retorna null/undefined
 */
export const DEFAULT_THEME: MenuTheme = {
  layout: 'classic',
  colors: {
    primary: '#ea1d2c',
    background: '#f4f4f5',
    header: '#ffffff'
  },
  display: {
    showBanner: true,
    showLogo: true,
    showSocial: true,
    showAddress: true,
    showSearch: true
  },
  bannerUrl: null
}

/**
 * Lista de layouts válidos para validação
 */
const VALID_LAYOUTS: MenuLayout[] = ['classic', 'modern', 'minimal', 'grid']

/**
 * Valida se uma string é um layout válido
 */
function isValidLayout(layout: unknown): layout is MenuLayout {
  return typeof layout === 'string' && VALID_LAYOUTS.includes(layout as MenuLayout)
}

/**
 * Valida se uma string é uma cor hexadecimal válida
 */
function isValidColor(color: unknown): color is string {
  if (typeof color !== 'string') return false
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)
}

/**
 * Parse seguro do tema do banco de dados.
 * NUNCA retorna undefined/null - sempre retorna um MenuTheme válido.
 * 
 * @param theme - JSON do banco (pode ser qualquer coisa)
 * @returns MenuTheme válido e seguro
 */
export function safeParseTheme(theme: unknown): MenuTheme {
  // Se não existe, retorna default
  if (!theme || typeof theme !== 'object') {
    return { ...DEFAULT_THEME }
  }

  const raw = theme as Record<string, unknown>

  // Parse do layout com fallback
  const layout: MenuLayout = isValidLayout(raw.layout) 
    ? raw.layout 
    : DEFAULT_THEME.layout

  // Parse das cores com fallback individual
  const rawColors = raw.colors as Record<string, unknown> | undefined
  const colors = {
    primary: isValidColor(rawColors?.primary) 
      ? rawColors.primary 
      : DEFAULT_THEME.colors.primary,
    background: isValidColor(rawColors?.background) 
      ? rawColors.background 
      : DEFAULT_THEME.colors.background,
    header: isValidColor(rawColors?.header) 
      ? rawColors.header 
      : DEFAULT_THEME.colors.header
  }

  // Parse do display com fallback individual
  const rawDisplay = raw.display as Record<string, unknown> | undefined
  const display = {
    showBanner: typeof rawDisplay?.showBanner === 'boolean' 
      ? rawDisplay.showBanner 
      : DEFAULT_THEME.display.showBanner,
    showLogo: typeof rawDisplay?.showLogo === 'boolean' 
      ? rawDisplay.showLogo 
      : DEFAULT_THEME.display.showLogo,
    showSocial: typeof rawDisplay?.showSocial === 'boolean' 
      ? rawDisplay.showSocial 
      : DEFAULT_THEME.display.showSocial,
    showAddress: typeof rawDisplay?.showAddress === 'boolean' 
      ? rawDisplay.showAddress 
      : DEFAULT_THEME.display.showAddress,
    showSearch: typeof rawDisplay?.showSearch === 'boolean' 
      ? rawDisplay.showSearch 
      : DEFAULT_THEME.display.showSearch
  }

  // Parse do bannerUrl
  const bannerUrl = typeof raw.bannerUrl === 'string' && raw.bannerUrl.length > 0
    ? raw.bannerUrl
    : null

  return {
    layout,
    colors,
    display,
    bannerUrl
  }
}

/**
 * Gera variáveis CSS a partir do tema
 */
export function getThemeCSSVariables(theme: MenuTheme): Record<string, string> {
  return {
    '--theme-primary': theme.colors.primary,
    '--theme-background': theme.colors.background,
    '--theme-header': theme.colors.header
  }
}

/**
 * Verifica se o header é claro (para determinar cor do texto)
 */
export function isLightColor(color: string): boolean {
  const hex = color.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 155
}
