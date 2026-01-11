/**
 * Client Information Extraction Utilities
 * Extract IP, user agent, and geolocation from requests
 * 
 * Note: getClientIP is exported from rateLimit.ts and auto-imported by Nuxt
 */

import type { H3Event } from 'h3'

export interface ClientInfo {
    ip: string
    userAgent: string
    country?: string
    device?: DeviceInfo
}

export interface DeviceInfo {
    browser: string
    os: string
    device: string
    isMobile: boolean
}

/**
 * Get user agent from request
 */
export function getUserAgent(event: H3Event): string {
    return getHeader(event, 'user-agent') || 'unknown'
}

/**
 * Get country from Cloudflare headers
 */
export function getCountry(event: H3Event): string | undefined {
    const headers = getHeaders(event)
    return headers['cf-ipcountry'] || undefined
}

/**
 * Parse user agent into device info
 */
export function parseUserAgent(userAgent: string): DeviceInfo {
    const ua = userAgent.toLowerCase()

    // Detect browser
    let browser = 'Unknown'
    if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Chrome'
    else if (ua.includes('firefox')) browser = 'Firefox'
    else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari'
    else if (ua.includes('edg')) browser = 'Edge'
    else if (ua.includes('opera') || ua.includes('opr')) browser = 'Opera'

    // Detect OS (order matters - check more specific first)
    let os = 'Unknown'
    if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) os = 'iOS'
    else if (ua.includes('android')) os = 'Android'
    else if (ua.includes('windows')) os = 'Windows'
    else if (ua.includes('mac os')) os = 'macOS'
    else if (ua.includes('linux')) os = 'Linux'

    // Detect device type
    const isMobile = /mobile|android|iphone|ipad|ipod/i.test(ua)
    let device = 'Desktop'
    if (ua.includes('iphone')) device = 'iPhone'
    else if (ua.includes('ipad')) device = 'iPad'
    else if (ua.includes('android') && isMobile) device = 'Android Phone'
    else if (ua.includes('android')) device = 'Android Tablet'
    else if (isMobile) device = 'Mobile'

    return { browser, os, device, isMobile }
}

/**
 * Get complete client info from request
 */
export function getClientInfo(event: H3Event): ClientInfo {
    const userAgent = getUserAgent(event)

    return {
        ip: getClientIP(event),
        userAgent,
        country: getCountry(event),
        device: parseUserAgent(userAgent)
    }
}
