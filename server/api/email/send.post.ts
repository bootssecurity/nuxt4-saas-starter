// sendEmail is auto-imported from server/utils/email.ts

export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    // Validate required fields
    if (!body.to || !body.subject) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Missing required fields: to, subject'
        })
    }

    if (!body.html && !body.text) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Either html or text content is required'
        })
    }

    const result = await sendEmail({
        to: body.to,
        subject: body.subject,
        html: body.html,
        text: body.text,
        replyTo: body.replyTo
    })

    return {
        success: true,
        messageId: result.request_id
    }
})
