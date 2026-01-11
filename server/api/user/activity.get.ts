import { eq, desc, and, gte, lte } from 'drizzle-orm'
import { db } from 'hub:db'
import { auditLogs } from '~~/server/database/schema'

/**
 * GET /api/user/activity
 * Get activity log for the current user
 * 
 * Users can only see their own activity
 */
export default defineEventHandler(async (event) => {
    const session = await requireUserSession(event)

    const query = getQuery(event)
    const page = parseInt(query.page as string) || 1
    const limit = Math.min(parseInt(query.limit as string) || 20, 50)
    const offset = (page - 1) * limit

    // Date filters
    const startDate = query.startDate as string
    const endDate = query.endDate as string

    // Build conditions - only show this user's activity
    const conditions = [eq(auditLogs.actorId, session.user.id)]

    if (startDate) {
        conditions.push(gte(auditLogs.timestamp, new Date(startDate)))
    }
    if (endDate) {
        conditions.push(lte(auditLogs.timestamp, new Date(endDate)))
    }

    // Fetch logs
    const logs = await db.select({
        id: auditLogs.id,
        timestamp: auditLogs.timestamp,
        eventType: auditLogs.eventType,
        action: auditLogs.action,
        status: auditLogs.status,
        actorIp: auditLogs.actorIp,
        actorUserAgent: auditLogs.actorUserAgent,
        actorCountry: auditLogs.actorCountry,
        resourceType: auditLogs.resourceType
    })
        .from(auditLogs)
        .where(and(...conditions))
        .orderBy(desc(auditLogs.timestamp))
        .limit(limit)
        .offset(offset)
        .all()

    // Get total count
    const allLogs = await db.select({ id: auditLogs.id })
        .from(auditLogs)
        .where(and(...conditions))
        .all()

    const total = allLogs.length

    return {
        success: true,
        logs,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    }
})
