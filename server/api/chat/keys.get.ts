import { z } from 'zod'
import { inArray, eq } from 'drizzle-orm'
import { db } from 'hub:db'
import { users } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
    await requireUserSession(event)

    const query = getQuery(event)
    const userIds = Array.isArray(query.userIds) ? query.userIds : [query.userIds]

    // Filter out undefined/null
    const ids = userIds.filter(Boolean).map(Number)

    if (ids.length === 0) {
        return {}
    }

    const results = await db.select({
        id: users.id,
        publicKey: users.publicKey
    })
        .from(users)
        .where(inArray(users.id, ids))

    // Return map of userId -> publicKey
    return results.reduce((acc, curr) => {
        acc[curr.id] = curr.publicKey
        return acc
    }, {} as Record<number, string | null>)
})
