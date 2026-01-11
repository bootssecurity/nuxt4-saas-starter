/**
 * Unit tests for session configuration
 */
import { describe, it, expect } from 'vitest'
import { SESSION_CONFIG, generateSessionToken } from '../../server/utils/session'

describe('SESSION_CONFIG', () => {
    it('should have correct max age (24 hours)', () => {
        expect(SESSION_CONFIG.maxAge).toBe(24 * 60 * 60)
    })

    it('should have correct idle timeout (30 minutes)', () => {
        expect(SESSION_CONFIG.idleTimeout).toBe(30 * 60)
    })

    it('should have correct refresh threshold (5 minutes)', () => {
        expect(SESSION_CONFIG.refreshThreshold).toBe(5 * 60)
    })
})

describe('generateSessionToken', () => {
    it('should generate unique tokens', () => {
        const token1 = generateSessionToken()
        const token2 = generateSessionToken()

        expect(token1).not.toBe(token2)
    })

    it('should generate tokens of sufficient length', () => {
        const token = generateSessionToken()

        // UUID without dashes is 32 chars, x2 = 64 chars
        expect(token.length).toBeGreaterThanOrEqual(60)
    })

    it('should not contain dashes', () => {
        const token = generateSessionToken()

        expect(token).not.toContain('-')
    })

    it('should be alphanumeric', () => {
        const token = generateSessionToken()

        expect(token).toMatch(/^[a-f0-9]+$/)
    })
})
