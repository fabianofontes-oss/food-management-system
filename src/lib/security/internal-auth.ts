import 'server-only'

/**
 * Security Helper: Internal API Authentication
 * 
 * Protege endpoints internos (admin, health, audit) de acesso não autorizado.
 * 
 * REGRAS:
 * - DEV: Permite acesso sem token (NODE_ENV !== 'production')
 * - PROD: Exige INTERNAL_API_TOKEN via header x-internal-token
 * - Mensagens neutras (404) para não vazar informações
 */

/**
 * Verifica autenticação para endpoints internos
 * @throws Response com 404 se não autorizado
 */
export function requireInternalAuth(request: Request): void {
  const isProduction = process.env.NODE_ENV === 'production'

  // Em desenvolvimento, permitir acesso
  if (!isProduction) {
    return
  }

  // Em produção, exigir token
  const internalToken = process.env.INTERNAL_API_TOKEN
  
  if (!internalToken) {
    // Token não configurado - bloquear acesso em produção
    throw new Response('Not Found', { status: 404 })
  }

  const requestToken = request.headers.get('x-internal-token')

  if (!requestToken || requestToken !== internalToken) {
    // Token inválido ou ausente - retornar 404 (não 401 para não vazar info)
    throw new Response('Not Found', { status: 404 })
  }

  // Token válido - permitir acesso
}

/**
 * Verifica autenticação para cron jobs
 * @throws Response com 401 se não autorizado
 */
export function requireCronAuth(request: Request): void {
  const isProduction = process.env.NODE_ENV === 'production'
  const cronSecret = process.env.CRON_SECRET

  // Em desenvolvimento sem CRON_SECRET configurado, permitir
  if (!isProduction && !cronSecret) {
    return
  }

  // Se CRON_SECRET está configurado (dev ou prod), exigir
  if (!cronSecret) {
    throw new Response('Unauthorized', { status: 401 })
  }

  const authHeader = request.headers.get('authorization')
  const expectedAuth = `Bearer ${cronSecret}`

  if (!authHeader || authHeader !== expectedAuth) {
    throw new Response('Unauthorized', { status: 401 })
  }

  // Auth válido - permitir acesso
}

/**
 * Bloqueia endpoint completamente em produção (para endpoints que executam código)
 * @throws Response com 404 em produção
 */
export function blockInProduction(): void {
  const isProduction = process.env.NODE_ENV === 'production'

  if (isProduction) {
    throw new Response('Not Found', { status: 404 })
  }

  // Em dev, permitir (mas ainda deve passar por requireInternalAuth)
}

/**
 * Verifica token interno para endpoints E2E/seed
 * @throws Response com 404 se não autorizado
 */
export function verifyInternalToken(request: Request): void {
  const isProduction = process.env.NODE_ENV === 'production'
  
  if (!isProduction) {
    return
  }

  const internalToken = process.env.E2E_INTERNAL_TOKEN
  
  if (!internalToken) {
    throw new Response('Not Found', { status: 404 })
  }

  const requestToken = request.headers.get('x-internal-token')

  if (!requestToken || requestToken !== internalToken) {
    throw new Response('Not Found', { status: 404 })
  }
}
