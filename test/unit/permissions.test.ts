/**
 * Unit tests for permission-based access control
 */
import { describe, it, expect } from 'vitest'
import { DEFAULT_PERMISSIONS } from '../../server/utils/auth/permissions'

describe('DEFAULT_PERMISSIONS', () => {
    describe('admin role', () => {
        it('should have all user management permissions', () => {
            expect(DEFAULT_PERMISSIONS.admin).toContain('users.read')
            expect(DEFAULT_PERMISSIONS.admin).toContain('users.create')
            expect(DEFAULT_PERMISSIONS.admin).toContain('users.update')
            expect(DEFAULT_PERMISSIONS.admin).toContain('users.delete')
        })

        it('should have audit log access', () => {
            expect(DEFAULT_PERMISSIONS.admin).toContain('audit.read')
        })

        it('should have settings management', () => {
            expect(DEFAULT_PERMISSIONS.admin).toContain('settings.manage')
        })

        it('should have business permissions', () => {
            expect(DEFAULT_PERMISSIONS.admin).toContain('business.read')
            expect(DEFAULT_PERMISSIONS.admin).toContain('business.update')
        })
    })

    describe('business_owner role', () => {
        it('should have user read/create/update but not delete', () => {
            expect(DEFAULT_PERMISSIONS.business_owner).toContain('users.read')
            expect(DEFAULT_PERMISSIONS.business_owner).toContain('users.create')
            expect(DEFAULT_PERMISSIONS.business_owner).toContain('users.update')
            expect(DEFAULT_PERMISSIONS.business_owner).not.toContain('users.delete')
        })

        it('should have audit log access', () => {
            expect(DEFAULT_PERMISSIONS.business_owner).toContain('audit.read')
        })

        it('should have business management', () => {
            expect(DEFAULT_PERMISSIONS.business_owner).toContain('business.read')
            expect(DEFAULT_PERMISSIONS.business_owner).toContain('business.update')
        })
    })

    describe('employee role', () => {
        it('should only have self-read permissions', () => {
            expect(DEFAULT_PERMISSIONS.employee).toContain('users.read.self')
            expect(DEFAULT_PERMISSIONS.employee).not.toContain('users.read')
            expect(DEFAULT_PERMISSIONS.employee).not.toContain('users.update')
        })

        it('should have limited business read', () => {
            expect(DEFAULT_PERMISSIONS.employee).toContain('business.read')
            expect(DEFAULT_PERMISSIONS.employee).not.toContain('business.update')
        })

        it('should not have audit or settings access', () => {
            expect(DEFAULT_PERMISSIONS.employee).not.toContain('audit.read')
            expect(DEFAULT_PERMISSIONS.employee).not.toContain('settings.manage')
        })

        it('should have report viewing access', () => {
            expect(DEFAULT_PERMISSIONS.employee).toContain('reports.view')
        })
    })

    it('should have progressively more permissions: employee < business_owner < admin', () => {
        expect(DEFAULT_PERMISSIONS.employee.length).toBeLessThan(DEFAULT_PERMISSIONS.business_owner.length)
        expect(DEFAULT_PERMISSIONS.business_owner.length).toBeLessThan(DEFAULT_PERMISSIONS.admin.length)
    })
})
