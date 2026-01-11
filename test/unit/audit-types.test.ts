/**
 * Unit tests for audit logging types and utilities
 */
import { describe, it, expect } from 'vitest'
import {
    AuditEventTypes,
    AuditActions,
    AuditStatus,
    ResourceTypes
} from '../../server/utils/audit/types'

describe('AuditEventTypes', () => {
    it('should have all required auth event types', () => {
        expect(AuditEventTypes.AUTH_LOGIN_ATTEMPT).toBe('auth.login.attempt')
        expect(AuditEventTypes.AUTH_LOGIN_SUCCESS).toBe('auth.login.success')
        expect(AuditEventTypes.AUTH_LOGIN_FAILURE).toBe('auth.login.failure')
        expect(AuditEventTypes.AUTH_LOGOUT).toBe('auth.logout')
    })

    it('should have signup event types', () => {
        expect(AuditEventTypes.AUTH_SIGNUP_ATTEMPT).toBe('auth.signup.attempt')
        expect(AuditEventTypes.AUTH_SIGNUP_SUCCESS).toBe('auth.signup.success')
        expect(AuditEventTypes.AUTH_SIGNUP_FAILURE).toBe('auth.signup.failure')
    })

    it('should have token event types', () => {
        expect(AuditEventTypes.AUTH_TOKEN_CREATED).toBe('auth.token.created')
        expect(AuditEventTypes.AUTH_TOKEN_USED).toBe('auth.token.used')
        expect(AuditEventTypes.AUTH_TOKEN_EXPIRED).toBe('auth.token.expired')
    })

    it('should have session event types', () => {
        expect(AuditEventTypes.SESSION_CREATED).toBe('session.created')
        expect(AuditEventTypes.SESSION_REVOKED).toBe('session.revoked')
        expect(AuditEventTypes.SESSION_REVOKED_ALL).toBe('session.revoked_all')
    })

    it('should have GDPR event types', () => {
        expect(AuditEventTypes.USER_DATA_EXPORT).toBe('user.data_export')
        expect(AuditEventTypes.USER_DELETE).toBe('user.delete')
        expect(AuditEventTypes.CONSENT_GRANTED).toBe('consent.granted')
        expect(AuditEventTypes.CONSENT_REVOKED).toBe('consent.revoked')
    })

    it('should have security event types', () => {
        expect(AuditEventTypes.RATE_LIMIT_EXCEEDED).toBe('security.rate_limit.exceeded')
    })
})

describe('AuditActions', () => {
    it('should have all CRUD actions', () => {
        expect(AuditActions.CREATE).toBe('create')
        expect(AuditActions.READ).toBe('read')
        expect(AuditActions.UPDATE).toBe('update')
        expect(AuditActions.DELETE).toBe('delete')
    })

    it('should have auth-specific actions', () => {
        expect(AuditActions.LOGIN).toBe('login')
        expect(AuditActions.LOGOUT).toBe('logout')
        expect(AuditActions.ATTEMPT).toBe('attempt')
    })

    it('should have consent actions', () => {
        expect(AuditActions.GRANT).toBe('grant')
        expect(AuditActions.REVOKE).toBe('revoke')
    })

    it('should have data actions', () => {
        expect(AuditActions.EXPORT).toBe('export')
        expect(AuditActions.BLOCK).toBe('block')
    })
})

describe('AuditStatus', () => {
    it('should have all status values', () => {
        expect(AuditStatus.SUCCESS).toBe('success')
        expect(AuditStatus.FAILURE).toBe('failure')
        expect(AuditStatus.BLOCKED).toBe('blocked')
        expect(AuditStatus.PENDING).toBe('pending')
    })
})

describe('ResourceTypes', () => {
    it('should have all resource types', () => {
        expect(ResourceTypes.USER).toBe('user')
        expect(ResourceTypes.BUSINESS).toBe('business')
        expect(ResourceTypes.SESSION).toBe('session')
        expect(ResourceTypes.TOKEN).toBe('token')
        expect(ResourceTypes.CONSENT).toBe('consent')
        expect(ResourceTypes.EXPORT).toBe('export')
    })
})
