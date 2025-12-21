/**
 * Rate Limit Middleware
 * 
 * Implementa rate limiting usando Upstash Redis (produção) ou memória (desenvolvimento).
 */

import { NextRequest, NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { getRateLimitConfig, type RateLimitType } from './config'
import { getMemoryRateLimiter } from './memory'

// Cliente Redis (lazy initialization)
let redis: Redis | null = null
let ratelimiters: Map<RateLimitType, Ratelimit> = new Map()

/**
 * Inicializa Redis client
 */
function getRedisClient(): Redis | null {
  if (redis) return redis

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    return null
  }

  try {
    redis = new Redis({
      url,
      token,
    })
    console.log('✅ [Rate Limit] Upstash Redis conectado')
    return redis
  } catch (error) {
    console.error('❌ [Rate Limit] Erro ao conectar Redis:', error)
    return null
  }
}

/**
 * Retorna rate limiter para um tipo específico
 */
function getRateLimiter(type: RateLimitType): Ratelimit | null {
  // Se já existe, retornar
  if (ratelimiters.has(type)) {
    return ratelimiters.get(type)!
  }

  // Tentar criar com Redis
  const redisClient = getRedisClient()
  if (!redisClient) {
    return null
  }

  const config = getRateLimitConfig(type)

  const limiter = new Ratelimit({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(config.limit, `${config.window}s`),
    analytics: true,
    prefix: `ratelimit:${type}`,
  })

  ratelimiters.set(type, limiter)
  return limiter
}

/**
 * Extrai identificador único da requisição
 */
function getIdentifier(req: NextRequest, userId?: string): string {
  // Usar user_id se disponível
  if (userId) {
    return `user:${userId}`
  }

  // Fallback para IP
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip') || 'unknown'
  
  return `ip:${ip}`
}

/**
 * Aplica rate limiting em uma requisição
 * 
 * @example
 * export async function POST(req: NextRequest) {
 *   const rateLimitResult = await rateLimit(req, 'auth')
 *   if (!rateLimitResult.success) {
 *     return rateLimitResult.response
 *   }
 *   
 *   // Sua lógica aqui
 * }
 */
export async function rateLimit(
  req: NextRequest,
  type: RateLimitType = 'default',
  userId?: string
): Promise<{
  success: boolean
  response?: NextResponse
  limit: number
  remaining: number
  reset: number
}> {
  const identifier = getIdentifier(req, userId)
  const config = getRateLimitConfig(type)

  // Tentar usar Upstash Redis
  const limiter = getRateLimiter(type)
  
  if (limiter) {
    // Usar Upstash Redis
    try {
      const result = await limiter.limit(identifier)

      if (!result.success) {
        const resetDate = new Date(result.reset)
        const retryAfter = Math.ceil((result.reset - Date.now()) / 1000)

        return {
          success: false,
          response: NextResponse.json(
            {
              error: 'Too many requests',
              message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
              retryAfter,
            },
            {
              status: 429,
              headers: {
                'X-RateLimit-Limit': result.limit.toString(),
                'X-RateLimit-Remaining': result.remaining.toString(),
                'X-RateLimit-Reset': resetDate.toISOString(),
                'Retry-After': retryAfter.toString(),
              },
            }
          ),
          limit: result.limit,
          remaining: result.remaining,
          reset: result.reset,
        }
      }

      return {
        success: true,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      }
    } catch (error) {
      console.error('[Rate Limit] Erro ao usar Upstash:', error)
      // Fallback para memória em caso de erro
    }
  }

  // Fallback: usar memória
  const memoryLimiter = getMemoryRateLimiter()
  const result = await memoryLimiter.check(identifier, config.limit, config.window)

  if (!result.success) {
    const retryAfter = Math.ceil((result.reset - Date.now()) / 1000)

    return {
      success: false,
      response: NextResponse.json(
        {
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': new Date(result.reset).toISOString(),
            'Retry-After': retryAfter.toString(),
          },
        }
      ),
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    }
  }

  return {
    success: true,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  }
}

/**
 * Wrapper para Server Actions
 * 
 * @example
 * export async function loginAction(email: string, password: string) {
 *   const limited = await rateLimitAction('auth', email)
 *   if (!limited.success) {
 *     return { error: limited.error }
 *   }
 *   
 *   // Sua lógica aqui
 * }
 */
export async function rateLimitAction(
  type: RateLimitType,
  identifier: string
): Promise<{
  success: boolean
  error?: string
  retryAfter?: number
}> {
  const config = getRateLimitConfig(type)
  const limiter = getRateLimiter(type)

  if (limiter) {
    try {
      const result = await limiter.limit(identifier)

      if (!result.success) {
        const retryAfter = Math.ceil((result.reset - Date.now()) / 1000)
        return {
          success: false,
          error: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
          retryAfter,
        }
      }

      return { success: true }
    } catch (error) {
      console.error('[Rate Limit] Erro ao usar Upstash:', error)
    }
  }

  // Fallback: memória
  const memoryLimiter = getMemoryRateLimiter()
  const result = await memoryLimiter.check(identifier, config.limit, config.window)

  if (!result.success) {
    const retryAfter = Math.ceil((result.reset - Date.now()) / 1000)
    return {
      success: false,
      error: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
      retryAfter,
    }
  }

  return { success: true }
}
