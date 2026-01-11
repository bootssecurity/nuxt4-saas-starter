import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from 'hub:db'
import { users } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
    const { user } = await requireUserSession(event)

    const schema = z.object({
        publicKey: z.string().min(1)
    })

    const { publicKey } = await readValidatedBody(event, schema.parse)

    await db.update(users)
        .set({ publicKey })
        .where(eq(users.id, user.id))

    return { success: true }
})
