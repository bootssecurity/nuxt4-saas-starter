/**
 * Session Management Utilities
 * Session tracking, validation, and revocation for SOC2/GDPR/HIPAA compliance
 */

import type { H3Event } from 'h3'
import { eq, and, gt, lt, isNull } from 'drizzle-orm'
import { db } from 'hub:db'
import { userSessions, type NewUserSession } from '~~/server/database/schema'
import { randomUUID } from 'uncrypto'
import { getClientInfo, parseUserAgent } from '../audit/clientInfo'
import {
    logSuccess,
    logFailure,
    AuditEventTypes,
    AuditActions,
    ResourceTypes
} from '../audit'

/**
 * Session configuration
 */
export const SESSION_CONFIG = {
    /** Maximum session age in seconds (24 hours) */
    maxAge: 24 * 60 * 60,
    /** Idle timeout in seconds (30 minutes) */
    idleTimeout: 30 * 60,
    /** Refresh threshold - refresh session if less than this time remaining (5 minutes) */
    refreshThreshold: 5 * 60
}

/**
 * Generate a secure session token
 */
export function generateSessionToken(): string {
    return `${randomUUID()}${randomUUID()}`.replace(/-/g, '')
}

/**
 * Create a tracked user session
 */
export async function createTrackedSession(
    event: H3Event,
    userId: number,
    userEmail: string,
    businessId?: number
): Promise<{ sessionToken: string; expiresAt: Date }> {
    const clientInfo = getClientInfo(event)
    const deviceInfo = parseUserAgent(clientInfo.userAgent)
    const sessionToken = generateSessionToken()
    const expiresAt = new Date(Date.now() + SESSION_CONFIG.maxAge * 1000)

    const sessionData: NewUserSession = {
        userId,
        sessionToken,
        ipAddress: clientInfo.ip,
        userAgent: clientInfo.userAgent,
        deviceInfo: JSON.stringify(deviceInfo),
        country: clientInfo.country,
        expiresAt,
        lastActiveAt: new Date()
    }

    await db.insert(userSessions).values(sessionData)

    // Log session creation
    await logSuccess(event, AuditEventTypes.SESSION_CREATED, AuditActions.CREATE, {
        actorId: userId,
        actorEmail: userEmail,
        resourceType: ResourceTypes.SESSION,
        businessId,
        metadata: {
            device: deviceInfo.device,
            browser: deviceInfo.browser,
            os: deviceInfo.os,
            country: clientInfo.country
        }
    })

    return { sessionToken, expiresAt }
}

/**
 * Validate and refresh a session
 */
export async function validateSession(
    event: H3Event,
    sessionToken: string
): Promise<{ valid: boolean; userId?: number; shouldRefresh: boolean }> {
    const session = await db.select()
        .from(userSessions)
        .where(
            and(
                eq(userSessions.sessionToken, sessionToken),
                isNull(userSessions.revokedAt),
                gt(userSessions.expiresAt, new Date())
            )
        )
        .get()

    if (!session) {
        return { valid: false, shouldRefresh: false }
    }

    // Check idle timeout
    const lastActive = new Date(session.lastActiveAt).getTime()
    const idleTime = (Date.now() - lastActive) / 1000

    if (idleTime > SESSION_CONFIG.idleTimeout) {
        // Session expired due to inactivity
        await revokeSession(event, session.id, session.userId, 'Idle timeout')
        return { valid: false, shouldRefresh: false }
    }

    // Check if session should be refreshed
    const timeRemaining = (new Date(session.expiresAt).getTime() - Date.now()) / 1000
    const shouldRefresh = timeRemaining < SESSION_CONFIG.refreshThreshold

    return { valid: true, userId: session.userId, shouldRefresh }
}

/**
 * Refresh session activity
 */
export async function refreshSession(
    event: H3Event,
    sessionToken: string
): Promise<void> {
    const newLastActiveAt = new Date()

    await db.update(userSessions)
        .set({ lastActiveAt: newLastActiveAt })
        .where(eq(userSessions.sessionToken, sessionToken))
}

/**
 * Revoke a specific session
 */
export async function revokeSession(
    event: H3Event,
    sessionId: number,
    userId: number,
    reason: string = 'User requested'
): Promise<void> {
    await db.update(userSessions)
        .set({
            revokedAt: new Date(),
            revokedReason: reason
        })
        .where(eq(userSessions.id, sessionId))

    await logSuccess(event, AuditEventTypes.SESSION_REVOKED, AuditActions.REVOKE, {
        actorId: userId,
        resourceType: ResourceTypes.SESSION,
        resourceId: sessionId,
        metadata: { reason }
    })
}

/**
 * Revoke all sessions for a user
 */
export async function revokeAllUserSessions(
    event: H3Event,
    userId: number,
    reason: string = 'User requested',
    excludeSessionToken?: string
): Promise<number> {
    const now = new Date()

    // Build condition
    let condition = and(
        eq(userSessions.userId, userId),
        isNull(userSessions.revokedAt)
    )

    // Get sessions to revoke
    const sessions = await db.select()
        .from(userSessions)
        .where(condition)
        .all()

    let count = 0
    for (const session of sessions) {
        if (excludeSessionToken && session.sessionToken === excludeSessionToken) {
            continue // Skip the current session
        }

        await db.update(userSessions)
            .set({
                revokedAt: now,
                revokedReason: reason
            })
            .where(eq(userSessions.id, session.id))
        count++
    }

    if (count > 0) {
        await logSuccess(event, AuditEventTypes.SESSION_REVOKED_ALL, AuditActions.REVOKE, {
            actorId: userId,
            resourceType: ResourceTypes.SESSION,
            metadata: { reason, count, excludedCurrent: !!excludeSessionToken }
        })
    }

    return count
}

/**
 * Get all active sessions for a user
 */
export async function getActiveSessions(userId: number): Promise<any[]> {
    const sessions = await db.select()
        .from(userSessions)
        .where(
            and(
                eq(userSessions.userId, userId),
                isNull(userSessions.revokedAt),
                gt(userSessions.expiresAt, new Date())
            )
        )
        .all()

    return sessions.map(session => ({
        id: session.id,
        ipAddress: session.ipAddress,
        country: session.country,
        device: session.deviceInfo ? JSON.parse(session.deviceInfo) : null,
        createdAt: session.createdAt,
        lastActiveAt: session.lastActiveAt,
        expiresAt: session.expiresAt
    }))
}

/**
 * Cleanup expired sessions (for scheduled task)
 */
export async function cleanupExpiredSessions(): Promise<number> {
    const result = await db.delete(userSessions)
        .where(
            lt(userSessions.expiresAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // 7 days old
        )

    return 0 // Drizzle doesn't return count easily, would need to count before delete
}
