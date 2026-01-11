/**
 * Unit tests for input sanitization utilities
 */
import { describe, it, expect } from 'vitest'
import {
    sanitizeEmail,
    isValidEmail,
    sanitizeString,
    sanitizeName,
    sanitizePhone,
    isValidPhone,
    sanitizeBusinessCode,
    isValidBusinessCode,
    escapeHtml,
    sanitizeUrl
} from '../../server/utils/security/sanitize'

describe('sanitizeEmail', () => {
    it('should lowercase email', () => {
        expect(sanitizeEmail('Test@Example.COM')).toBe('test@example.com')
    })

    it('should trim whitespace', () => {
        expect(sanitizeEmail('  test@example.com  ')).toBe('test@example.com')
    })

    it('should remove HTML tags', () => {
        expect(sanitizeEmail('<script>test@example.com</script>')).toBe('test@example.com')
    })

    it('should handle empty input', () => {
        expect(sanitizeEmail('')).toBe('')
    })

    it('should remove control characters', () => {
        expect(sanitizeEmail('test\x00@example.com')).toBe('test@example.com')
    })
})

describe('isValidEmail', () => {
    it('should validate correct email', () => {
        expect(isValidEmail('test@example.com')).toBe(true)
        expect(isValidEmail('user.name+tag@domain.co.uk')).toBe(true)
    })

    it('should reject invalid email', () => {
        expect(isValidEmail('not-an-email')).toBe(false)
        expect(isValidEmail('@nodomain.com')).toBe(false)
        expect(isValidEmail('test@')).toBe(false)
    })

    it('should reject very long emails', () => {
        const longEmail = 'a'.repeat(300) + '@example.com'
        expect(isValidEmail(longEmail)).toBe(false)
    })
})

describe('sanitizeString', () => {
    it('should remove HTML tags', () => {
        expect(sanitizeString('<p>Hello</p>')).toBe('Hello')
        expect(sanitizeString('<script>alert("xss")</script>')).toBe('alert("xss")')
    })

    it('should trim and limit length', () => {
        expect(sanitizeString('  hello  ')).toBe('hello')
        expect(sanitizeString('a'.repeat(300), 10)).toBe('aaaaaaaaaa')
    })

    it('should remove control characters', () => {
        expect(sanitizeString('hello\x00world')).toBe('helloworld')
    })

    it('should allow newlines and tabs', () => {
        expect(sanitizeString('hello\nworld')).toBe('hello\nworld')
    })
})

describe('sanitizeName', () => {
    it('should allow letters and common name characters', () => {
        expect(sanitizeName("O'Brien")).toBe("O'Brien")
        expect(sanitizeName('Mary-Jane')).toBe('Mary-Jane')
        expect(sanitizeName('José García')).toBe('José García')
    })

    it('should remove numbers and special characters', () => {
        expect(sanitizeName('John123')).toBe('John')
        expect(sanitizeName('Test!')).toBe('Test')
        expect(sanitizeName('Hello@World')).toBe('HelloWorld')
    })

    it('should collapse multiple spaces', () => {
        expect(sanitizeName('John    Doe')).toBe('John Doe')
    })
})

describe('sanitizePhone', () => {
    it('should keep only digits and leading +', () => {
        expect(sanitizePhone('+1 (555) 123-4567')).toBe('+15551234567')
        expect(sanitizePhone('555.123.4567')).toBe('5551234567')
    })

    it('should limit length', () => {
        expect(sanitizePhone('1'.repeat(30)).length).toBeLessThanOrEqual(20)
    })
})

describe('isValidPhone', () => {
    it('should validate correct phone numbers', () => {
        expect(isValidPhone('+15551234567')).toBe(true)
        expect(isValidPhone('5551234567')).toBe(true)
    })

    it('should reject too short/long numbers', () => {
        expect(isValidPhone('123')).toBe(false)
        expect(isValidPhone('1234567890123456789')).toBe(false)
    })

    it('should allow empty (optional field)', () => {
        expect(isValidPhone('')).toBe(true)
    })
})

describe('sanitizeBusinessCode', () => {
    it('should uppercase and remove invalid chars', () => {
        expect(sanitizeBusinessCode('abc123')).toBe('ABC123')
        expect(sanitizeBusinessCode('abc-123')).toBe('ABC123')
    })

    it('should limit to 6 characters', () => {
        expect(sanitizeBusinessCode('ABCDEFGH')).toBe('ABCDEF')
    })
})

describe('isValidBusinessCode', () => {
    it('should validate 6 char alphanumeric codes', () => {
        expect(isValidBusinessCode('ABC123')).toBe(true)
        expect(isValidBusinessCode('ABCDEF')).toBe(true)
        expect(isValidBusinessCode('123456')).toBe(true)
    })

    it('should reject invalid codes', () => {
        expect(isValidBusinessCode('ABC')).toBe(false)
        expect(isValidBusinessCode('ABC12')).toBe(false)
        expect(isValidBusinessCode('abc123')).toBe(true) // sanitized
    })
})

describe('escapeHtml', () => {
    it('should escape HTML entities', () => {
        expect(escapeHtml('<script>')).toBe('&lt;script&gt;')
        expect(escapeHtml('"quoted"')).toBe('&quot;quoted&quot;')
        expect(escapeHtml("it's")).toBe('it&#039;s')
        expect(escapeHtml('a & b')).toBe('a &amp; b')
    })
})

describe('sanitizeUrl', () => {
    it('should allow valid http/https URLs', () => {
        expect(sanitizeUrl('https://example.com')).toBe('https://example.com/')
        expect(sanitizeUrl('http://test.org/path')).toBe('http://test.org/path')
    })

    it('should reject non-http protocols', () => {
        expect(sanitizeUrl('javascript:alert(1)')).toBe(null)
        expect(sanitizeUrl('file:///etc/passwd')).toBe(null)
        expect(sanitizeUrl('data:text/html,<script>')).toBe(null)
    })

    it('should reject invalid URLs', () => {
        expect(sanitizeUrl('not a url')).toBe(null)
    })
})
