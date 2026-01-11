/**
 * Integration tests for KV Storage API
 */
import { describe, it, expect } from 'vitest'

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'

describe('KV Storage API', () => {
    const testKey = `test-key-${Date.now()}`
    const testValue = { message: 'Hello from KV!', timestamp: Date.now() }

    describe('POST /api/kv', () => {
        it('should store a key-value pair', async () => {
            const response = await fetch(`${BASE_URL}/api/kv`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    key: testKey,
                    value: testValue
                })
            })

            expect(response.ok).toBe(true)
            const data = await response.json()

            expect(data.success).toBe(true)
            expect(data.key).toBe(testKey)
        })

        it('should fail without key', async () => {
            const response = await fetch(`${BASE_URL}/api/kv`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ value: 'missing key' })
            })

            expect(response.ok).toBe(false)
        })

        it('should fail without value', async () => {
            const response = await fetch(`${BASE_URL}/api/kv`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'missing-value' })
            })

            expect(response.ok).toBe(false)
        })
    })

    describe('GET /api/kv', () => {
        it('should retrieve stored value', async () => {
            // First store a value
            await fetch(`${BASE_URL}/api/kv`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'retrieve-test', value: 'test-value' })
            })

            const response = await fetch(`${BASE_URL}/api/kv?key=retrieve-test`)
            expect(response.ok).toBe(true)

            const data = await response.json()
            expect(data.key).toBe('retrieve-test')
            expect(data.value).toBe('test-value')
        })

        it('should fail without key parameter', async () => {
            const response = await fetch(`${BASE_URL}/api/kv`)
            expect(response.ok).toBe(false)
        })
    })
})
