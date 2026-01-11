/**
 * Integration tests for Auth API
 * Uses the running dev server for testing
 */
import { describe, it, expect } from 'vitest'

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'

describe('Auth API', () => {
    let businessCode: string
    let businessOwnerEmail = `owner-${Date.now()}@example.com`
    let employeeEmail = `employee-${Date.now()}@example.com`

    describe('Business Signup', () => {
        it('should send magic link for business signup', async () => {
            const response = await fetch(`${BASE_URL}/api/auth/signup/business`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: businessOwnerEmail,
                    firstName: 'Business',
                    lastName: 'Owner',
                    businessName: 'Test Corp',
                    phone: '1234567890'
                })
            })

            expect(response.ok).toBe(true)
            const data = await response.json() as any
            expect(data.success).toBe(true)
            expect(data.message).toContain('Magic link sent')
        })

        it('should fail with missing fields', async () => {
            const response = await fetch(`${BASE_URL}/api/auth/signup/business`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'incomplete@example.com'
                })
            })

            expect(response.ok).toBe(false)
        })
    })

    describe('Login', () => {
        it('should send magic link for login', async () => {
            const response = await fetch(`${BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: businessOwnerEmail
                })
            })

            expect(response.ok).toBe(true)
            const data = await response.json() as any
            expect(data.success).toBe(true)
        })
    })

    // Note: We can't fully test the verification flow here without intercepting the email
    // or mocking the database to retrieve the token. 
    // For now, we verify the initiation endpoints work.
})
