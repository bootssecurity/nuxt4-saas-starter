/**
 * Consent Management Utilities
 * GDPR-compliant consent tracking and management
 */

import type { H3Event } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from 'hub:db'
import { users, consentLogs, type NewConsentLog } from '~~/server/database/schema'
import { getClientInfo } from '../audit/clientInfo'
import {
    logSuccess,
    AuditEventTypes,
    AuditActions,
    ResourceTypes
} from '../audit'

/**
 * Consent types that can be tracked
 */
export const ConsentTypes = {
    PRIVACY_POLICY: 'privacy',
    TERMS_OF_SERVICE: 'terms',
    MARKETING: 'marketing',
    ANALYTICS: 'analytics'
} as const

export type ConsentType = typeof ConsentTypes[keyof typeof ConsentTypes]

/**
 * Current versions of legal documents
 */
export const DOCUMENT_VERSIONS = {
    privacyPolicy: '1.0',
    termsOfService: '1.0'
}

/**
 * Record a consent change
 */
export async function recordConsentChange(
    event: H3Event,
    userId: number,
    consentType: ConsentType,
    granted: boolean,
    version?: string
): Promise<void> {
    const clientInfo = getClientInfo(event)

    const logEntry: NewConsentLog = {
        userId,
        consentType,
        granted,
        version,
        ipAddress: clientInfo.ip,
        userAgent: clientInfo.userAgent
    }

    await db.insert(consentLogs).values(logEntry)

    // Log to audit trail
    const eventType = granted
        ? AuditEventTypes.CONSENT_GRANTED
        : AuditEventTypes.CONSENT_REVOKED

    await logSuccess(event, eventType, granted ? AuditActions.GRANT : AuditActions.REVOKE, {
        actorId: userId,
        resourceType: ResourceTypes.CONSENT,
        metadata: { consentType, granted, version }
    })
}

/**
 * Update user consent preferences
 */
export async function updateUserConsent(
    event: H3Event,
    userId: number,
    preferences: {
        marketing?: boolean
        analytics?: boolean
    }
): Promise<void> {
    const updates: Record<string, any> = {
        consentTimestamp: new Date()
    }

    if (typeof preferences.marketing === 'boolean') {
        updates.consentMarketing = preferences.marketing
        await recordConsentChange(event, userId, ConsentTypes.MARKETING, preferences.marketing)
    }

    if (typeof preferences.analytics === 'boolean') {
        updates.consentAnalytics = preferences.analytics
        await recordConsentChange(event, userId, ConsentTypes.ANALYTICS, preferences.analytics)
    }

    await db.update(users)
        .set(updates)
        .where(eq(users.id, userId))
}

/**
 * Get user consent status
 */
export async function getUserConsent(userId: number): Promise<{
    marketing: boolean
    analytics: boolean
    privacyPolicyVersion: string | null
    termsVersion: string | null
    consentTimestamp: Date | null
}> {
    const user = await db.select({
        consentMarketing: users.consentMarketing,
        consentAnalytics: users.consentAnalytics,
        privacyPolicyVersion: users.privacyPolicyVersion,
        termsVersion: users.termsVersion,
        consentTimestamp: users.consentTimestamp
    })
        .from(users)
        .where(eq(users.id, userId))
        .get()

    if (!user) {
        return {
            marketing: false,
            analytics: false,
            privacyPolicyVersion: null,
            termsVersion: null,
            consentTimestamp: null
        }
    }

    return {
        marketing: !!user.consentMarketing,
        analytics: !!user.consentAnalytics,
        privacyPolicyVersion: user.privacyPolicyVersion,
        termsVersion: user.termsVersion,
        consentTimestamp: user.consentTimestamp
    }
}

/**
 * Record acceptance of privacy policy and terms
 */
export async function recordLegalAcceptance(
    event: H3Event,
    userId: number
): Promise<void> {
    // Update user record
    await db.update(users)
        .set({
            privacyPolicyVersion: DOCUMENT_VERSIONS.privacyPolicy,
            termsVersion: DOCUMENT_VERSIONS.termsOfService,
            consentTimestamp: new Date()
        })
        .where(eq(users.id, userId))

    // Log both acceptances
    await recordConsentChange(
        event,
        userId,
        ConsentTypes.PRIVACY_POLICY,
        true,
        DOCUMENT_VERSIONS.privacyPolicy
    )
    await recordConsentChange(
        event,
        userId,
        ConsentTypes.TERMS_OF_SERVICE,
        true,
        DOCUMENT_VERSIONS.termsOfService
    )
}
