/**
 * Rate Limit Configuration
 * 
 * Define limites de requisições por tipo de rota.
 * Usa Upstash Redis em produção, memória em desenvolvimento.
 */

export type RateLimitType = 
  | 'public'
  | 'auth'
  | 'checkout'
  | 'admin'
  | 'export'
  | 'default'

export interface RateLimitConfig {
  /**
   * Número máximo de requisições
   */
  limit: number
  
  /**
   * Janela de tempo em segundos
   */
  window: number
  
  /**
   * Descrição do limite
   */
  description: string
}

/**
 * Configuração de limites por tipo de rota
 */
export const RATE_LIMITS: Record<RateLimitType, RateLimitConfig> = {
  /**
   * API pública - Cardápio, produtos, etc
   */
  public: {
    limit: 100,
    window: 60, // 1 minuto
    description: 'API pública - 100 req/min'
  },
  
  /**
   * Autenticação - Login, signup, reset password
   */
  auth: {
    limit: 5,
    window: 60, // 1 minuto
    description: 'Autenticação - 5 req/min'
  },
  
  /**
   * Checkout - Criação de pedidos, pagamentos
   */
  checkout: {
    limit: 10,
    window: 60, // 1 minuto
    description: 'Checkout - 10 req/min'
  },
  
  /**
   * Admin - Operações administrativas
   */
  admin: {
    limit: 1000,
    window: 60, // 1 minuto
    description: 'Admin - 1000 req/min'
  },
  
  /**
   * Export - Exportação de dados
   */
  export: {
    limit: 3,
    window: 60, // 1 minuto
    description: 'Export - 3 req/min'
  },
  
  /**
   * Default - Outras rotas
   */
  default: {
    limit: 60,
    window: 60, // 1 minuto
    description: 'Default - 60 req/min'
  }
}

/**
 * Retorna configuração de rate limit por tipo
 */
export function getRateLimitConfig(type: RateLimitType): RateLimitConfig {
  return RATE_LIMITS[type]
}

/**
 * Rotas que não devem ter rate limiting
 */
export const RATE_LIMIT_EXCLUDED_PATHS = [
  '/_next/static',
  '/_next/image',
  '/favicon.ico',
  '/api/health/status', // Health check
]

/**
 * Verifica se uma rota deve ser excluída do rate limiting
 */
export function isExcludedPath(path: string): boolean {
  return RATE_LIMIT_EXCLUDED_PATHS.some(excluded => path.startsWith(excluded))
}
