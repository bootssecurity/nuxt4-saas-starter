import type { H3Event } from 'h3'

/**
 * Get the public URL for magic links
 * On Cloudflare Workers, getRequestURL may return localhost
 * This utility properly extracts the origin from request headers
 */
export function getPublicUrl(event: H3Event): string {
    const config = useRuntimeConfig()

    // First check if APP_URL is configured
    if (config.public.appUrl) {
        return config.public.appUrl
    }

    // Get headers - Cloudflare sets these
    const headers = getHeaders(event)

    // Check for x-forwarded-host (set by proxies/CDN)
    const forwardedHost = headers['x-forwarded-host']
    if (forwardedHost) {
        const protocol = headers['x-forwarded-proto'] || 'https'
        return `${protocol}://${forwardedHost}`
    }

    // Check for cf-connecting-ip which indicates Cloudflare
    // In this case, use the Host header
    const host = headers['host']
    if (host && !host.includes('localhost')) {
        const protocol = headers['x-forwarded-proto'] || 'https'
        return `${protocol}://${host}`
    }

    // Fallback to getRequestURL
    const requestUrl = getRequestURL(event)
    return `${requestUrl.protocol}//${requestUrl.host}`
}
