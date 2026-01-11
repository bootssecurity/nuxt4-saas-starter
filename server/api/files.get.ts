import { blob } from 'hub:blob'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const prefix = (query.prefix as string) || ''

    // List all blobs with optional prefix filter
    const files = await blob.list({ prefix })

    return {
        files: files.blobs,
        total: files.blobs.length
    }
})
