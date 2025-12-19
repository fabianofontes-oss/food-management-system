/**
 * Slugs reservados que não podem ser usados como nome de loja
 * Usado no onboarding, validação de slug e roteamento por subdomínio
 */

export const RESERVED_SLUGS = new Set([
  // Subdomínios do sistema
  'app',
  'admin',
  'api',
  'www',
  'meu',
  'conta',
  
  // Auth
  'login',
  'signin',
  'signup',
  'register',
  'logout',
  'auth',
  
  // Checkout/Pagamento
  'checkout',
  'cart',
  'pagamento',
  'payment',
  'billing',
  
  // Assets
  'static',
  'assets',
  'cdn',
  'images',
  'img',
  'files',
  
  // Páginas do sistema
  'docs',
  'blog',
  'suporte',
  'help',
  'faq',
  'robots',
  'sitemap',
  'status',
  
  // Termos genéricos
  'store',
  'shop',
  'loja',
  'menu',
  'cardapio',
  
  // Domínios relacionados
  'driver',
  'entregou',
  'pensou',
  'pediu',
  
  // Dev/Testing
  'test',
  'teste',
  'demo',
  'staging',
  'dev',
  'preview',
  'sandbox',
  
  // Reservados para futuro
  'discover',
  'explore',
  'search',
  'busca',
  'parceiros',
  'partners',
  'afiliados',
  'affiliates',
])

/**
 * Verifica se um slug é reservado
 */
export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase())
}

/**
 * Valida se um slug é válido (formato + não reservado)
 */
export function isValidSlug(slug: string): boolean {
  // 3-40 chars, letras/números/hífen, sem hífen duplo, não começa/termina com hífen
  if (slug.length < 3 || slug.length > 40) return false
  if (!/^[a-z0-9-]+$/.test(slug)) return false
  if (slug.includes('--')) return false
  if (slug.startsWith('-') || slug.endsWith('-')) return false
  if (isReservedSlug(slug)) return false
  return true
}

/**
 * Normaliza um input para formato de slug
 */
export function normalizeSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9]+/g, '-')     // Substitui não-alfanuméricos por hífen
    .replace(/^-+|-+$/g, '')         // Remove hífens do início/fim
    .replace(/-+/g, '-')             // Remove hífens duplicados
}
