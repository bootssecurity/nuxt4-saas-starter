/**
 * Input Sanitization Utilities
 * Protect against XSS, SQL injection, and other input-based attacks
 */

/**
 * Sanitize email address
 * - Lowercase
 * - Trim whitespace
 * - Validate format
 */
export function sanitizeEmail(email: string): string {
    if (!email) return ''

    // Remove any whitespace
    let sanitized = email.trim().toLowerCase()

    // Remove any HTML tags
    sanitized = sanitized.replace(/<[^>]*>/g, '')

    // Remove control characters
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '')

    return sanitized
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    return emailRegex.test(email) && email.length <= 254
}

/**
 * Sanitize general string input
 * - Remove HTML tags
 * - Remove control characters
 * - Trim and limit length
 */
export function sanitizeString(input: string, maxLength: number = 255): string {
    if (!input) return ''

    let sanitized = input

    // Remove HTML tags
    sanitized = sanitized.replace(/<[^>]*>/g, '')

    // Remove control characters (except newlines and tabs)
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

    // Trim whitespace
    sanitized = sanitized.trim()

    // Limit length
    if (sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength)
    }

    return sanitized
}

/**
 * Sanitize name (first name, last name, etc.)
 * - Only allow letters, spaces, hyphens, apostrophes
 */
export function sanitizeName(name: string): string {
    if (!name) return ''

    let sanitized = name.trim()

    // Remove anything that's not a letter, space, hyphen, or apostrophe
    // Allow Unicode letters for international names
    sanitized = sanitized.replace(/[^\p{L}\s'-]/gu, '')

    // Collapse multiple spaces
    sanitized = sanitized.replace(/\s+/g, ' ')

    // Limit length
    if (sanitized.length > 100) {
        sanitized = sanitized.substring(0, 100)
    }

    return sanitized
}

/**
 * Sanitize phone number
 * - Remove all non-numeric characters except +
 */
export function sanitizePhone(phone: string): string {
    if (!phone) return ''

    // Keep only digits and leading +
    let sanitized = phone.trim()

    const hasPlus = sanitized.startsWith('+')
    sanitized = sanitized.replace(/[^\d]/g, '')

    if (hasPlus) {
        sanitized = '+' + sanitized
    }

    // Limit length
    if (sanitized.length > 20) {
        sanitized = sanitized.substring(0, 20)
    }

    return sanitized
}

/**
 * Validate phone number format
 */
export function isValidPhone(phone: string): boolean {
    if (!phone) return true // Phone is optional

    const sanitized = sanitizePhone(phone)
    // Basic validation: 7-15 digits
    const digitsOnly = sanitized.replace(/\+/, '')
    return digitsOnly.length >= 7 && digitsOnly.length <= 15
}

/**
 * Sanitize business code
 * - Uppercase letters and numbers only
 * - Fixed length validation
 */
export function sanitizeBusinessCode(code: string): string {
    if (!code) return ''

    return code.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 6)
}

/**
 * Validate business code format
 */
export function isValidBusinessCode(code: string): boolean {
    const sanitized = sanitizeBusinessCode(code)
    return /^[A-Z0-9]{6}$/.test(sanitized)
}

/**
 * Escape HTML entities for safe display
 */
export function escapeHtml(text: string): string {
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    }
    return text.replace(/[&<>"']/g, (char) => map[char])
}

/**
 * Sanitize URL
 * - Only allow http/https protocols
 * - Validate format
 */
export function sanitizeUrl(url: string): string | null {
    if (!url) return null

    try {
        const parsed = new URL(url.trim())

        // Only allow http and https
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            return null
        }

        return parsed.toString()
    } catch {
        return null
    }
}
