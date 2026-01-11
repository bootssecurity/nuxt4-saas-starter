/**
 * Unit tests for data retention policy
 */
import { describe, it, expect } from 'vitest'
import { RETENTION_PERIODS } from '../../server/utils/gdpr/accountDeletion'

describe('RETENTION_PERIODS', () => {
    it('should have 30 day deleted user retention', () => {
        expect(RETENTION_PERIODS.deletedUsers).toBe(30)
    })

    it('should have 2 year audit log retention for compliance', () => {
        // GDPR and SOC2 require at least 1 year, we use 2 years
        expect(RETENTION_PERIODS.auditLogs).toBe(730)
        expect(RETENTION_PERIODS.auditLogs).toBeGreaterThanOrEqual(365)
    })

    it('should have 7 day expired session retention', () => {
        expect(RETENTION_PERIODS.expiredSessions).toBe(7)
    })

    it('should have 1 day used token retention', () => {
        expect(RETENTION_PERIODS.usedTokens).toBe(1)
    })

    it('should have all periods in days (positive integers)', () => {
        Object.values(RETENTION_PERIODS).forEach(period => {
            expect(period).toBeGreaterThan(0)
            expect(Number.isInteger(period)).toBe(true)
        })
    })
})
