import { eq, like, and, ne, or } from 'drizzle-orm'
import { db } from 'hub:db'
import { users } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
    const { user } = await requireUserSession(event)
    const query = getQuery(event)
    const search = query.q ? String(query.q) : ''

    // Base conditions: Exclude self, and user must be active/not deleted?
    // Schema has 'status' = 'active'.
    let conditions = [
        ne(users.id, user.id),
        eq(users.status, 'active')
    ]

    // Role Validation based on Request
    // Rule: Employees see Business Owners, Business Owners see All Users
    if (user.role === 'employee') {
        conditions.push(eq(users.role, 'business_owner'))
    } else if (user.role === 'business_owner') {
        // No extra role filter, can see everyone (employees and other owners)
        // Maybe restrict to ONLY employees? "list all users" implies everyone.
    } else {
        // Admin/Other? 
        // Default: maybe see everyone or no one.
    }

    // Search filter
    if (search.length > 0) {
        conditions.push(
            or(
                like(users.firstName, `%${search}%`),
                like(users.lastName, `%${search}%`),
                like(users.email, `%${search}%`)
            )
        )
    }

    const results = await db.select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        role: users.role,
        publicKey: users.publicKey
    })
        .from(users)
        .where(and(...conditions))
        .limit(20)

    return {
        users: results.map(u => ({
            ...u,
            name: `${u.firstName} ${u.lastName}`
        }))
    }
})
