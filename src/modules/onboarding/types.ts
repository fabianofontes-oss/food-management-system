import type { Database } from '@/types/database'

export type SlugReservationRow = Database['public']['Tables']['slug_reservations']['Row']
export type SlugReservationInsert = Database['public']['Tables']['slug_reservations']['Insert']

export interface ReserveSlugInput {
  slug: string
}

export interface ReserveSlugResult {
  slug: string
  token: string
  expiresAt: string
}

export interface CompleteSignupInput {
  token: string
  userId: string
  email: string
  name: string
  phone?: string
}

export interface CompleteSignupResult {
  tenantId: string
  storeId: string
  slug: string
}

export function normalizeSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function isValidSlug(slug: string): boolean {
  // 3-40 chars, letras/números/hífen, sem hífen duplo
  if (slug.length < 3 || slug.length > 40) return false
  if (!/^[a-z0-9-]+$/.test(slug)) return false
  if (slug.includes('--')) return false
  return true
}
