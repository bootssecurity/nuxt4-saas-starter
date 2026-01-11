import { describe, it, expect } from 'vitest'

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'

describe('Business Users API', () => {
    // Note: These tests assume a running server and valid session
    // Since we can't easily injection session in black-box integration tests without a helper,
    // we primarily check that unauthenticated access is forbidden.
    // For full testing, we'd need to simulate the login flow first (which is complex here).

    it('should return 401 for unauthenticated access', async () => {
        const response = await fetch(`${BASE_URL}/api/business/users`)
        expect(response.status).toBe(401)
    })
})
