/**
 * Zeptomail Email Service
 * Uses HTTP API (Cloudflare Workers compatible)
 */
import { htmlToText } from 'html-to-text'

interface EmailOptions {
    to: string | string[]
    subject: string
    html?: string
    text?: string
    replyTo?: string
}

interface ZeptomailResponse {
    message: string
    request_id: string
}

export async function sendEmail(options: EmailOptions): Promise<ZeptomailResponse> {
    const config = useRuntimeConfig()

    const apiKey = config.zeptomailApiKey
    const fromAddress = config.public.mailFromAddress || 'contact@bootssecurity.com'
    const fromName = config.public.mailFromName || 'Boots Security'

    if (!apiKey) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Zeptomail API key not configured'
        })
    }

    // Normalize recipients to array
    const recipients = Array.isArray(options.to) ? options.to : [options.to]

    const payload = {
        from: {
            address: fromAddress,
            name: fromName
        },
        to: recipients.map(email => ({
            email_address: {
                address: email
            }
        })),
        subject: options.subject,
        htmlbody: options.html,
        textbody: options.text || (options.html ? htmlToText(options.html) : undefined),
        reply_to: options.replyTo ? [{ address: options.replyTo }] : undefined
    }

    const response = await fetch('https://api.zeptomail.com/v1.1/email', {
        method: 'POST',
        headers: {
            'Authorization': apiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
    })

    if (!response.ok) {
        const error = await response.text()
        throw createError({
            statusCode: response.status,
            statusMessage: `Failed to send email: ${error}`
        })
    }

    return response.json()
}
