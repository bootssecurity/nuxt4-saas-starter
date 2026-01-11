/**
 * Integration tests for Email API (Zeptomail)
 */
import { describe, it, expect } from 'vitest'

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'

describe('Email API (Zeptomail)', () => {
    describe('POST /api/email/send - Validation', () => {
        it('should fail without required fields', async () => {
            const response = await fetch(`${BASE_URL}/api/email/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            })

            expect(response.ok).toBe(false)
        })

        it('should fail without to field', async () => {
            const response = await fetch(`${BASE_URL}/api/email/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject: 'Test',
                    html: '<p>Test</p>'
                })
            })

            expect(response.ok).toBe(false)
        })

        it('should fail without subject field', async () => {
            const response = await fetch(`${BASE_URL}/api/email/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: 'test@example.com',
                    html: '<p>Test</p>'
                })
            })

            expect(response.ok).toBe(false)
        })

        it('should fail without html or text content', async () => {
            const response = await fetch(`${BASE_URL}/api/email/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: 'test@example.com',
                    subject: 'Test Subject'
                })
            })

            expect(response.ok).toBe(false)
        })
    })
})
