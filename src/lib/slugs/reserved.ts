/**
 * Lista de slugs reservados que não podem ser usados por lojas
 * Estes slugs são usados pelo sistema para rotas internas
 */
export const RESERVED_SLUGS = [
  'admin',
  'api',
  'billing',
  'login',
  'dashboard',
  'onboarding',
  'internal',
  'health',
  'setup',
  'auth',
  'select-store',
  'choose-url',
  'qa',
  'mapa-do-site',
  'unauthorized',
  'error',
  'not-found',
  '404',
  '500',
  'actions',
  'public',
] as const

export type ReservedSlug = (typeof RESERVED_SLUGS)[number]

/**
 * Verifica se um slug é reservado
 */
export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.includes(slug.toLowerCase() as ReservedSlug)
}

/**
 * Normaliza um slug para formato válido
 * - Lowercase
 * - Remove acentos
 * - Substitui espaços e caracteres inválidos por hífen
 * - Remove hífens duplicados e nas bordas
 */
export function normalizeSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9]+/g, '-') // Substitui caracteres inválidos por hífen
    .replace(/^-+|-+$/g, '') // Remove hífens nas bordas
    .replace(/-{2,}/g, '-') // Remove hífens duplicados
}

/**
 * Valida se um slug está no formato correto
 * - 3 a 40 caracteres
 * - Apenas letras, números e hífen
 * - Sem hífen duplo
 * - Não pode ser reservado
 */
export function isValidSlug(slug: string): { valid: boolean; reason?: string } {
  if (slug.length < 3) {
    return { valid: false, reason: 'Slug deve ter pelo menos 3 caracteres' }
  }
  
  if (slug.length > 40) {
    return { valid: false, reason: 'Slug deve ter no máximo 40 caracteres' }
  }
  
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { valid: false, reason: 'Slug deve conter apenas letras, números e hífen' }
  }
  
  if (slug.includes('--')) {
    return { valid: false, reason: 'Slug não pode conter hífens consecutivos' }
  }
  
  if (slug.startsWith('-') || slug.endsWith('-')) {
    return { valid: false, reason: 'Slug não pode começar ou terminar com hífen' }
  }
  
  if (isReservedSlug(slug)) {
    return { valid: false, reason: 'Este slug é reservado pelo sistema' }
  }
  
  return { valid: true }
}
