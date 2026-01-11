/**
 * Data Export Utilities
 * GDPR Data Subject Access Request (DSAR) implementation
 */

import type { H3Event } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from 'hub:db'
import {
    users,
    businesses,
    userSessions,
    consentLogs,
    auditLogs,
    dataExportRequests,
    type NewDataExportRequest
} from '~~/server/database/schema'
import {
    logSuccess,
    AuditEventTypes,
    AuditActions,
    ResourceTypes
} from '../audit'

/**
 * Export all user data for DSAR compliance
 */
export async function exportUserData(
    event: H3Event,
    userId: number,
    userEmail: string
): Promise<Record<string, unknown>> {
    // Get user profile
    const user = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .get()

    if (!user) {
        throw createError({
            statusCode: 404,
            statusMessage: 'User not found'
        })
    }

    // Get business info if applicable
    let business = null
    if (user.businessId) {
        business = await db.select()
            .from(businesses)
            .where(eq(businesses.id, user.businessId))
            .get()
    }

    // Get consent history
    const consentHistory = await db.select()
        .from(consentLogs)
        .where(eq(consentLogs.userId, userId))
        .all()

    // Get session history (without tokens)
    const sessionHistory = await db.select({
        id: userSessions.id,
        ipAddress: userSessions.ipAddress,
        country: userSessions.country,
        deviceInfo: userSessions.deviceInfo,
        createdAt: userSessions.createdAt,
        lastActiveAt: userSessions.lastActiveAt,
        revokedAt: userSessions.revokedAt,
        revokedReason: userSessions.revokedReason
    })
        .from(userSessions)
        .where(eq(userSessions.userId, userId))
        .all()

    // Get relevant audit logs (only for this user)
    const userAuditLogs = await db.select({
        id: auditLogs.id,
        timestamp: auditLogs.timestamp,
        eventType: auditLogs.eventType,
        action: auditLogs.action,
        status: auditLogs.status,
        actorIp: auditLogs.actorIp,
        resourceType: auditLogs.resourceType
    })
        .from(auditLogs)
        .where(eq(auditLogs.actorId, userId))
        .all()

    // Compile export data
    const exportData = {
        exportedAt: new Date().toISOString(),
        exportRequestedBy: userEmail,

        profile: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            role: user.role,
            status: user.status,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        },

        businessMembership: business ? {
            businessId: business.id,
            businessName: business.name,
            businessCode: business.code
        } : null,

        consentPreferences: {
            marketing: !!user.consentMarketing,
            analytics: !!user.consentAnalytics,
            privacyPolicyVersion: user.privacyPolicyVersion,
            termsVersion: user.termsVersion,
            lastUpdated: user.consentTimestamp
        },

        consentHistory: consentHistory.map(log => ({
            type: log.consentType,
            granted: !!log.granted,
            version: log.version,
            timestamp: log.createdAt
        })),

        sessionHistory: sessionHistory.map(session => ({
            ipAddress: session.ipAddress,
            country: session.country,
            device: session.deviceInfo ? JSON.parse(session.deviceInfo) : null,
            signedIn: session.createdAt,
            lastActive: session.lastActiveAt,
            signedOut: session.revokedAt,
            signOutReason: session.revokedReason
        })),

        activityLog: userAuditLogs.map(log => ({
            timestamp: log.timestamp,
            action: log.eventType,
            ipAddress: log.actorIp
        }))
    }

    // Log the export
    await logSuccess(event, AuditEventTypes.USER_DATA_EXPORT, AuditActions.EXPORT, {
        actorId: userId,
        actorEmail: userEmail,
        resourceType: ResourceTypes.USER,
        resourceId: userId,
        metadata: { exportType: 'full_profile' }
    })

    return exportData
}

/**
 * Create a data export request record
 */
export async function createExportRequest(
    event: H3Event,
    userId: number
): Promise<number> {
    const clientInfo = await import('../audit/clientInfo').then(m => m.getClientInfo(event))

    const request: NewDataExportRequest = {
        userId,
        status: 'pending',
        ipAddress: clientInfo.ip,
        userAgent: clientInfo.userAgent
    }

    const result = await db.insert(dataExportRequests).values(request).returning()
    return result[0].id
}

/**
 * Mark export request as completed
 */
export async function completeExportRequest(
    requestId: number,
    exportUrl?: string
): Promise<void> {
    await db.update(dataExportRequests)
        .set({
            status: 'completed',
            completedAt: new Date(),
            exportUrl,
            expiresAt: exportUrl ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : undefined
        })
        .where(eq(dataExportRequests.id, requestId))
}
