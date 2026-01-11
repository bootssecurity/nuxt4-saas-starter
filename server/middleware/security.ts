/**
 * Security Headers Server Middleware
 * Adds comprehensive security headers for SOC2/HIPAA compliance
 */

export default defineEventHandler((event) => {
    // Skip for dev tools and internal requests
    const path = getRequestURL(event).pathname
    if (path.startsWith('/_nuxt') || path.startsWith('/__nuxt')) {
        return
    }

    // HSTS - Enforce HTTPS (1 year, include subdomains)
    setHeader(event, 'Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')

    // Prevent MIME type sniffing
    setHeader(event, 'X-Content-Type-Options', 'nosniff')

    // Prevent clickjacking
    setHeader(event, 'X-Frame-Options', 'DENY')

    // XSS Protection (legacy browsers)
    setHeader(event, 'X-XSS-Protection', '1; mode=block')

    // Referrer Policy - Don't leak referrer to third parties
    setHeader(event, 'Referrer-Policy', 'strict-origin-when-cross-origin')

    // Permissions Policy - Restrict browser features
    setHeader(event, 'Permissions-Policy', [
        'camera=()',
        'microphone=()',
        'geolocation=()',
        'payment=()',
        'usb=()',
        'magnetometer=()',
        'gyroscope=()',
        'accelerometer=()'
    ].join(', '))

    // Content Security Policy
    // Note: This is a strict policy, adjust as needed for your app
    const cspDirectives = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Nuxt needs these for dev
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https: blob:",
        "connect-src 'self' https: wss:",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "upgrade-insecure-requests"
    ]

    // Only set CSP in production (can cause issues in dev)
    if (process.env.NODE_ENV === 'production') {
        setHeader(event, 'Content-Security-Policy', cspDirectives.join('; '))
    }

    // Cache Control for sensitive pages
    if (path.startsWith('/api/') || path.startsWith('/dashboard')) {
        setHeader(event, 'Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
        setHeader(event, 'Pragma', 'no-cache')
        setHeader(event, 'Expires', '0')
    }
})
