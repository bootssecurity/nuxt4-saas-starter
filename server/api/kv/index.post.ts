import { kv } from 'hub:kv'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    if (!body.key || body.value === undefined) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Key and value are required'
        })
    }

    // Set value in KV storage with optional TTL (time-to-live in seconds)
    const ttl = body.ttl ? { ttl: body.ttl } : undefined
    await kv.set(body.key, body.value, ttl)

    return {
        success: true,
        key: body.key,
        message: 'Value stored successfully'
    }
})
