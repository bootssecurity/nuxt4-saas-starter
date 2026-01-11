/**
 * Rate Limiting Utility for NuxtHub KV
 * Implements IP-based rate limiting with configurable windows and limits
 */

import type { H3Event } from 'h3'

// Use useStorage from Nitro to access KV storage

interface RateLimitConfig {
    /** Window size in seconds */
    window: number
    /** Maximum requests allowed in window */
    max: number
    /** Key prefix for KV storage */
    prefix?: string
}

interface RateLimitResult {
    success: boolean
    remaining: number
    reset: number
    limit: number
}

/**
 * Default rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
    // Auth endpoints - stricter limits
    login: { window: 60, max: 5, prefix: 'ratelimit:login' },
    signup: { window: 60, max: 3, prefix: 'ratelimit:signup' },
    verify: { window: 60, max: 10, prefix: 'ratelimit:verify' },
    validateCode: { window: 60, max: 10, prefix: 'ratelimit:validate-code' },

    // General API - more lenient
    api: { window: 60, max: 100, prefix: 'ratelimit:api' }
} as const

/**
 * Get the client IP address from the request
 * Checks common proxy headers first, then falls back to remote address
 */
export function getClientIP(event: H3Event): string {
    const headers = getHeaders(event)

    // Check common proxy headers (in order of preference)
    const forwardedFor = headers['x-forwarded-for']
    if (forwardedFor) {
        // x-forwarded-for can contain multiple IPs, take the first one
        return forwardedFor.split(',')[0].trim()
    }

    // Cloudflare specific header
    const cfConnectingIP = headers['cf-connecting-ip']
    if (cfConnectingIP) {
        return cfConnectingIP
    }

    // Real IP header (nginx)
    const realIP = headers['x-real-ip']
    if (realIP) {
        return realIP
    }

    // Fallback to connection remote address
    return getRequestIP(event) || 'unknown'
}

/**
 * Check and increment rate limit for a given key
 * Uses sliding window algorithm with NuxtHub KV (via Nitro useStorage)
 */
export async function checkRateLimit(
    event: H3Event,
    config: RateLimitConfig
): Promise<RateLimitResult> {
    // Use Nitro's useStorage with hub:kv driver (configured by NuxtHub)
    const kv = useStorage('hub:kv')
    const ip = getClientIP(event)
    const key = `${config.prefix || 'ratelimit'}:${ip}`
    const now = Date.now()
    const windowStart = now - (config.window * 1000)

    // Get existing rate limit data
    const data = await kv.getItem<{ requests: number[]; }>(key)
    let requests = data?.requests || []

    // Filter out requests outside the current window
    requests = requests.filter((timestamp: number) => timestamp > windowStart)

    // Check if rate limit exceeded
    if (requests.length >= config.max) {
        const oldestRequest = Math.min(...requests)
        const resetTime = oldestRequest + (config.window * 1000)

        return {
            success: false,
            remaining: 0,
            reset: Math.ceil((resetTime - now) / 1000),
            limit: config.max
        }
    }

    // Add current request
    requests.push(now)

    // Store updated data with TTL matching the window
    await kv.setItem(key, { requests }, { ttl: config.window })

    return {
        success: true,
        remaining: config.max - requests.length,
        reset: config.window,
        limit: config.max
    }
}

/**
 * Rate limit middleware - throws 429 error if limit exceeded
 */
export async function rateLimit(
    event: H3Event,
    config: RateLimitConfig
): Promise<void> {
    const result = await checkRateLimit(event, config)

    // Set rate limit headers
    setHeader(event, 'X-RateLimit-Limit', result.limit.toString())
    setHeader(event, 'X-RateLimit-Remaining', result.remaining.toString())
    setHeader(event, 'X-RateLimit-Reset', result.reset.toString())

    if (!result.success) {
        throw createError({
            statusCode: 429,
            statusMessage: 'Too many requests. Please try again later.',
            data: {
                retryAfter: result.reset
            }
        })
    }
}

/**
 * Helper to create a rate-limited event handler
 */
export function defineRateLimitedEventHandler<T>(
    config: RateLimitConfig,
    handler: (event: H3Event) => T | Promise<T>
) {
    return defineEventHandler(async (event: H3Event) => {
        await rateLimit(event, config)
        return handler(event)
    })
}
