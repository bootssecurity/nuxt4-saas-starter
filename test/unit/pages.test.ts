/**
 * Integration tests for Pages
 */
import { describe, it, expect } from 'vitest'

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'

describe('Pages', () => {
    describe('Homepage', () => {
        it('should render homepage', async () => {
            const response = await fetch(`${BASE_URL}/`)
            expect(response.ok).toBe(true)

            const html = await response.text()
            expect(html).toContain('Nuxt')
            expect(html).toContain('Cloudflare')
        })

        it('should have test email link', async () => {
            const response = await fetch(`${BASE_URL}/`)
            expect(response.ok).toBe(true)

            const html = await response.text()
            expect(html).toContain('test-email')
        })
    })

    describe('Test Email Page', () => {
        it('should render test email page', async () => {
            const response = await fetch(`${BASE_URL}/test-email`)
            expect(response.ok).toBe(true)

            const html = await response.text()
            expect(html).toContain('Test Email')
        })
    })

    describe('API Health', () => {
        it('should have users API responding', async () => {
            const response = await fetch(`${BASE_URL}/api/users`)
            expect(response.ok).toBe(true)
        })

        it('should have files API responding', async () => {
            const response = await fetch(`${BASE_URL}/api/files`)
            expect(response.ok).toBe(true)
        })
    })
})
