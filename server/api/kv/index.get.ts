import { kv } from 'hub:kv'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const key = query.key as string

    if (!key) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Key parameter is required'
        })
    }

    // Get value from KV storage
    const value = await kv.get(key)

    if (value === null) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Key not found'
        })
    }

    return { key, value }
})
