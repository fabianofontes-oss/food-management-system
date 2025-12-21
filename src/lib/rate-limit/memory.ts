/**
 * In-Memory Rate Limiter (Fallback)
 * 
 * Usado quando Upstash Redis não está configurado.
 * Implementa sliding window em memória.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

class MemoryRateLimiter {
  private store: Map<string, RateLimitEntry> = new Map()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Cleanup automático a cada 1 minuto
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60000)
    
    console.warn('⚠️ [Rate Limit] Usando fallback em memória. Configure UPSTASH_REDIS_REST_URL para produção.')
  }

  /**
   * Verifica se requisição está dentro do limite
   */
  async check(
    identifier: string,
    limit: number,
    window: number
  ): Promise<{
    success: boolean
    limit: number
    remaining: number
    reset: number
  }> {
    const now = Date.now()
    const key = `${identifier}`
    const entry = this.store.get(key)

    // Se não existe ou expirou, criar nova entry
    if (!entry || entry.resetAt < now) {
      this.store.set(key, {
        count: 1,
        resetAt: now + (window * 1000)
      })
      
      return {
        success: true,
        limit,
        remaining: limit - 1,
        reset: now + (window * 1000)
      }
    }

    // Se excedeu o limite
    if (entry.count >= limit) {
      return {
        success: false,
        limit,
        remaining: 0,
        reset: entry.resetAt
      }
    }

    // Incrementar contador
    entry.count++
    this.store.set(key, entry)

    return {
      success: true,
      limit,
      remaining: limit - entry.count,
      reset: entry.resetAt
    }
  }

  /**
   * Remove entries expiradas
   */
  private cleanup() {
    const now = Date.now()
    let cleaned = 0

    for (const [key, entry] of this.store.entries()) {
      if (entry.resetAt < now) {
        this.store.delete(key)
        cleaned++
      }
    }

    if (cleaned > 0) {
      console.log(`[Rate Limit] Limpou ${cleaned} entries expiradas`)
    }
  }

  /**
   * Limpa todos os dados (para testes)
   */
  clear() {
    this.store.clear()
  }

  /**
   * Destrói o rate limiter
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.store.clear()
  }
}

// Singleton
let memoryRateLimiter: MemoryRateLimiter | null = null

export function getMemoryRateLimiter(): MemoryRateLimiter {
  if (!memoryRateLimiter) {
    memoryRateLimiter = new MemoryRateLimiter()
  }
  return memoryRateLimiter
}
