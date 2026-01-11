/**
 * Integration tests for R2 Blob Storage API
 */
import { describe, it, expect } from 'vitest'

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'

describe('Blob Storage API (R2)', () => {
    describe('GET /api/files', () => {
        it('should return list of files', async () => {
            const response = await fetch(`${BASE_URL}/api/files`)
            expect(response.ok).toBe(true)

            const data = await response.json()
            expect(data.files).toBeDefined()
            expect(Array.isArray(data.files)).toBe(true)
            expect(typeof data.total).toBe('number')
        })

        it('should filter by prefix', async () => {
            const response = await fetch(`${BASE_URL}/api/files?prefix=uploads/`)
            expect(response.ok).toBe(true)

            const data = await response.json()
            expect(data.files).toBeDefined()
            expect(Array.isArray(data.files)).toBe(true)
        })
    })

    describe('POST /api/upload', () => {
        it('should fail without file', async () => {
            const formData = new FormData()

            const response = await fetch(`${BASE_URL}/api/upload`, {
                method: 'POST',
                body: formData
            })

            expect(response.ok).toBe(false)
        })

        it('should upload a text file', async () => {
            const formData = new FormData()
            const blob = new Blob(['Test file content'], { type: 'text/plain' })
            formData.append('file', blob, 'test-file.txt')

            const response = await fetch(`${BASE_URL}/api/upload`, {
                method: 'POST',
                body: formData
            })

            expect(response.ok).toBe(true)
            const data = await response.json()
            expect(data.success).toBe(true)
            expect(data.filename).toContain('test-file.txt')
        })
    })
})
