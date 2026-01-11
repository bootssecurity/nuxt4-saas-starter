/**
 * Audit Logging Service
 * Core audit logging functionality for SOC2/GDPR/HIPAA compliance
 */

import type { H3Event } from 'h3'
import { db } from 'hub:db'
import { auditLogs, type NewAuditLog } from '~~/server/database/schema'
import { getClientInfo, type ClientInfo } from './clientInfo'
import {
    type AuditEventType,
    type AuditAction,
    type AuditStatusType,
    type ResourceType,
    AuditStatus
} from './types'

export interface AuditLogOptions {
    /** The type of event being logged */
    eventType: AuditEventType
    /** The action performed */
    action: AuditAction
    /** Success, failure, or blocked */
    status: AuditStatusType
    /** User ID who performed the action (null for anonymous) */
    actorId?: number | null
    /** Actor email for quick lookup */
    actorEmail?: string | null
    /** Type of resource affected */
    resourceType?: ResourceType
    /** ID of the affected resource */
    resourceId?: number
    /** Reason for failure if status is 'failure' */
    failureReason?: string
    /** Additional context as JSON-serializable object */
    metadata?: Record<string, unknown>
    /** Business ID for multi-tenant filtering */
    businessId?: number
}

/**
 * Get actor information from session if available
 */
export async function getActorFromSession(event: H3Event): Promise<{
    actorId: number | null
    actorEmail: string | null
    businessId: number | null
}> {
    try {
        const session = await getUserSession(event)
        if (session?.user) {
            return {
                actorId: session.user.id ?? null,
                actorEmail: session.user.email ?? null,
                businessId: session.user.businessId ?? null
            }
        }
    } catch {
        // No session available
    }
    return { actorId: null, actorEmail: null, businessId: null }
}

/**
 * Log an audit event to the database
 */
export async function logAuditEvent(
    event: H3Event,
    options: AuditLogOptions
): Promise<void> {
    try {
        const clientInfo = getClientInfo(event)
        const actor = await getActorFromSession(event)

        const logEntry: NewAuditLog = {
            timestamp: new Date(),
            eventType: options.eventType,
            action: options.action,
            status: options.status,
            actorId: options.actorId ?? actor.actorId,
            actorEmail: options.actorEmail ?? actor.actorEmail,
            actorIp: clientInfo.ip,
            actorUserAgent: clientInfo.userAgent,
            actorCountry: clientInfo.country,
            resourceType: options.resourceType,
            resourceId: options.resourceId,
            failureReason: options.failureReason,
            metadata: options.metadata ? JSON.stringify(options.metadata) : null,
            businessId: options.businessId ?? actor.businessId,
        }

        await db.insert(auditLogs).values(logEntry)
    } catch (error) {
        // Log to console but don't throw - audit logging should not break the request
        console.error('[AUDIT] Failed to log event:', error)
    }
}

/**
 * Log a successful event
 */
export async function logSuccess(
    event: H3Event,
    eventType: AuditEventType,
    action: AuditAction,
    options: Partial<AuditLogOptions> = {}
): Promise<void> {
    return logAuditEvent(event, {
        eventType,
        action,
        status: AuditStatus.SUCCESS,
        ...options
    })
}

/**
 * Log a failed event
 */
export async function logFailure(
    event: H3Event,
    eventType: AuditEventType,
    action: AuditAction,
    failureReason: string,
    options: Partial<AuditLogOptions> = {}
): Promise<void> {
    return logAuditEvent(event, {
        eventType,
        action,
        status: AuditStatus.FAILURE,
        failureReason,
        ...options
    })
}

/**
 * Log a blocked event (e.g., rate limit)
 */
export async function logBlocked(
    event: H3Event,
    eventType: AuditEventType,
    action: AuditAction,
    reason: string,
    options: Partial<AuditLogOptions> = {}
): Promise<void> {
    return logAuditEvent(event, {
        eventType,
        action,
        status: AuditStatus.BLOCKED,
        failureReason: reason,
        ...options
    })
}

// Re-export types and constants for convenience
export * from './types'
export * from './clientInfo'
