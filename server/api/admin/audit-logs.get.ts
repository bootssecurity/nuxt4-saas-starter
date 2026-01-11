import { eq, desc, and, gte, lte, like } from 'drizzle-orm'
import { db } from 'hub:db'
import { auditLogs } from '~~/server/db/schema'
import {
    logSuccess,
    AuditEventTypes,
    AuditActions,
    ResourceTypes
} from '~~/server/utils/audit'

/**
 * GET /api/admin/audit-logs
 * Query audit logs with filtering and pagination
 * 
 * Security:
 * - Requires admin or business_owner role
 * - Access is logged for compliance
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 50, max: 100)
 * - eventType: Filter by event type
 * - status: Filter by status (success, failure, blocked)
 * - actorEmail: Filter by actor email (partial match)
 * - startDate: Filter logs after this date (ISO string)
 * - endDate: Filter logs before this date (ISO string)
 * - businessId: Filter by business (for multi-tenant)
 */
export default defineEventHandler(async (event) => {
    // Check authentication
    const session = await requireUserSession(event)

    // Check authorization - only admins and business owners can view audit logs
    if (session.user.role !== 'admin' && session.user.role !== 'business_owner') {
        throw createError({
            statusCode: 403,
            statusMessage: 'Insufficient permissions to view audit logs'
        })
    }

    // Parse query parameters
    const query = getQuery(event)
    const page = Math.max(1, parseInt(query.page as string) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 50))
    const offset = (page - 1) * limit

    const eventType = query.eventType as string | undefined
    const status = query.status as string | undefined
    const actorEmail = query.actorEmail as string | undefined
    const startDate = query.startDate as string | undefined
    const endDate = query.endDate as string | undefined

    // Build conditions
    const conditions = []

    // Business filtering based on role
    if (session.user.role === 'business_owner') {
        // Business owners can only see logs for their business
        conditions.push(eq(auditLogs.businessId, session.user.businessId!))
    } else if (query.businessId) {
        // Admins can filter by business
        conditions.push(eq(auditLogs.businessId, parseInt(query.businessId as string)))
    }

    if (eventType) {
        conditions.push(eq(auditLogs.eventType, eventType))
    }

    if (status) {
        conditions.push(eq(auditLogs.status, status))
    }

    if (actorEmail) {
        conditions.push(like(auditLogs.actorEmail, `%${actorEmail}%`))
    }

    if (startDate) {
        conditions.push(gte(auditLogs.timestamp, new Date(startDate)))
    }

    if (endDate) {
        conditions.push(lte(auditLogs.timestamp, new Date(endDate)))
    }

    // Query logs
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const logs = await db.select()
        .from(auditLogs)
        .where(whereClause)
        .orderBy(desc(auditLogs.timestamp))
        .limit(limit)
        .offset(offset)
        .all()

    // Get total count for pagination
    const countResult = await db.select({ count: auditLogs.id })
        .from(auditLogs)
        .where(whereClause)
        .all()

    const total = countResult.length

    // Log this access for compliance
    await logSuccess(event, AuditEventTypes.ADMIN_AUDIT_VIEW, AuditActions.READ, {
        actorId: session.user.id,
        actorEmail: session.user.email,
        resourceType: ResourceTypes.USER,
        businessId: session.user.businessId ?? undefined,
        metadata: {
            filters: { eventType, status, actorEmail, startDate, endDate },
            resultsCount: logs.length,
            page,
            limit
        }
    })

    return {
        success: true,
        data: logs.map(log => ({
            ...log,
            metadata: log.metadata ? JSON.parse(log.metadata) : null,
            timestamp: log.timestamp instanceof Date ? log.timestamp.toISOString() : log.timestamp
        })),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    }
})
