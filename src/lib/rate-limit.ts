import 'server-only'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Rate limiter singleton
let rateLimiter: Ratelimit | null = null

/**
 * Get or create rate limiter instance
 * Uses Upstash Redis for distributed rate limiting
 */
export function getRateLimiter(): Ratelimit | null {
    // Return null if Redis not configured (development fallback)
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
        console.warn('[RateLimit] Upstash Redis not configured - rate limiting disabled')
        return null
    }

    if (rateLimiter) {
        return rateLimiter
    }

    try {
        const redis = new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL,
            token: process.env.UPSTASH_REDIS_REST_TOKEN,
        })

        rateLimiter = new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
            analytics: true,
            prefix: '@upstash/ratelimit',
        })

        console.log('[RateLimit] Upstash Redis rate limiter initialized')
        return rateLimiter
    } catch (error) {
        console.error('[RateLimit] Failed to initialize rate limiter:', error)
        return null
    }
}

/**
 * Rate limit by IP address
 * @param ip - IP address to rate limit
 * @returns { success: boolean, limit: number, remaining: number, reset: Date }
 */
export async function rateLimitByIP(ip: string): Promise<{
    success: boolean
    limit: number
    remaining: number
    reset: Date
}> {
    const limiter = getRateLimiter()

    if (!limiter) {
        // No rate limiting configured - allow all requests
        return {
            success: true,
            limit: 0,
            remaining: 0,
            reset: new Date(),
        }
    }

    try {
        const result = await limiter.limit(`ip:${ip}`)
        return {
            success: result.success,
            limit: result.limit,
            remaining: result.remaining,
            reset: new Date(result.reset),
        }
    } catch (error) {
        console.error('[RateLimit] Error checking rate limit:', error)
        // On error, allow the request (fail open)
        return {
            success: true,
            limit: 0,
            remaining: 0,
            reset: new Date(),
        }
    }
}

/**
 * Rate limit by store slug (prevent abuse on specific stores)
 * @param slug - Store slug to rate limit
 * @returns { success: boolean, limit: number, remaining: number, reset: Date }
 */
export async function rateLimitBySlug(slug: string): Promise<{
    success: boolean
    limit: number
    remaining: number
    reset: Date
}> {
    const limiter = getRateLimiter()

    if (!limiter) {
        return {
            success: true,
            limit: 0,
            remaining: 0,
            reset: new Date(),
        }
    }

    try {
        // More permissive limit per store (20 requests per minute)
        const storeRateLimiter = new Ratelimit({
            redis: new Redis({
                url: process.env.UPSTASH_REDIS_REST_URL!,
                token: process.env.UPSTASH_REDIS_REST_TOKEN!,
            }),
            limiter: Ratelimit.slidingWindow(20, '1 m'),
            analytics: true,
            prefix: '@upstash/ratelimit/store',
        })

        const result = await storeRateLimiter.limit(`store:${slug}`)
        return {
            success: result.success,
            limit: result.limit,
            remaining: result.remaining,
            reset: new Date(result.reset),
        }
    } catch (error) {
        console.error('[RateLimit] Error checking store rate limit:', error)
        return {
            success: true,
            limit: 0,
            remaining: 0,
            reset: new Date(),
        }
    }
}
