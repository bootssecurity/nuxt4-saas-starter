/**
 * Unit tests for client info extraction
 */
import { describe, it, expect } from 'vitest'
import { parseUserAgent } from '../../server/utils/audit/clientInfo'

describe('parseUserAgent', () => {
    it('should detect Chrome on Windows', () => {
        const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        const result = parseUserAgent(ua)

        expect(result.browser).toBe('Chrome')
        expect(result.os).toBe('Windows')
        expect(result.isMobile).toBe(false)
        expect(result.device).toBe('Desktop')
    })

    it('should detect Safari on macOS', () => {
        const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15'
        const result = parseUserAgent(ua)

        expect(result.browser).toBe('Safari')
        expect(result.os).toBe('macOS')
        expect(result.isMobile).toBe(false)
    })

    it('should detect Firefox on Linux', () => {
        const ua = 'Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0'
        const result = parseUserAgent(ua)

        expect(result.browser).toBe('Firefox')
        expect(result.os).toBe('Linux')
        expect(result.isMobile).toBe(false)
    })

    it('should detect Chrome on iPhone', () => {
        const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.6099.119 Mobile/15E148 Safari/604.1'
        const result = parseUserAgent(ua)

        expect(result.os).toBe('iOS')
        expect(result.isMobile).toBe(true)
        expect(result.device).toBe('iPhone')
    })

    it('should detect browser on iPad', () => {
        const ua = 'Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1'
        const result = parseUserAgent(ua)

        expect(result.os).toBe('iOS')
        expect(result.isMobile).toBe(true)
        expect(result.device).toBe('iPad')
    })

    it('should detect Chrome on Android', () => {
        const ua = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36'
        const result = parseUserAgent(ua)

        expect(result.browser).toBe('Chrome')
        expect(result.os).toBe('Android')
        expect(result.isMobile).toBe(true)
        expect(result.device).toBe('Android Phone')
    })

    it('should detect Edge browser', () => {
        const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
        const result = parseUserAgent(ua)

        expect(result.browser).toBe('Edge')
        expect(result.os).toBe('Windows')
    })

    it('should handle unknown user agent', () => {
        const ua = 'Unknown Bot/1.0'
        const result = parseUserAgent(ua)

        expect(result.browser).toBe('Unknown')
        expect(result.os).toBe('Unknown')
        expect(result.isMobile).toBe(false)
        expect(result.device).toBe('Desktop')
    })
})
