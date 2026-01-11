/**
 * Unit tests for GDPR consent utilities
 */
import { describe, it, expect } from 'vitest'
import { ConsentTypes, DOCUMENT_VERSIONS } from '../../server/utils/gdpr/consent'

describe('ConsentTypes', () => {
    it('should have all required consent types', () => {
        expect(ConsentTypes.PRIVACY_POLICY).toBe('privacy')
        expect(ConsentTypes.TERMS_OF_SERVICE).toBe('terms')
        expect(ConsentTypes.MARKETING).toBe('marketing')
        expect(ConsentTypes.ANALYTICS).toBe('analytics')
    })
})

describe('DOCUMENT_VERSIONS', () => {
    it('should have versioned documents', () => {
        expect(DOCUMENT_VERSIONS.privacyPolicy).toBeDefined()
        expect(DOCUMENT_VERSIONS.termsOfService).toBeDefined()
    })

    it('should use semantic versioning format', () => {
        expect(DOCUMENT_VERSIONS.privacyPolicy).toMatch(/^\d+\.\d+$/)
        expect(DOCUMENT_VERSIONS.termsOfService).toMatch(/^\d+\.\d+$/)
    })
})
