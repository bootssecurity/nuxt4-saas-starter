import { blob } from 'hub:blob'

export default defineEventHandler(async (event) => {
    const form = await readFormData(event)
    const file = form.get('file') as File

    if (!file) {
        throw createError({
            statusCode: 400,
            statusMessage: 'No file provided'
        })
    }

    // Generate a unique filename with timestamp
    const timestamp = Date.now()
    const filename = `uploads/${timestamp}-${file.name}`

    // Upload to R2 blob storage
    const result = await blob.put(filename, file)

    return {
        success: true,
        filename: result.pathname,
        size: file.size,
        type: file.type
    }
})
