import { randomUUID } from 'uncrypto'

/**
 * Generate a secure random token for magic links
 */
export function generateMagicToken(): string {
    // Generate two UUIDs and combine for extra entropy
    return `${randomUUID()}${randomUUID()}`.replace(/-/g, '')
}

/**
 * Generate a unique 6-character business code
 * Format: 3 letters + 3 numbers (e.g., "ABC123")
 */
export function generateBusinessCode(): string {
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ' // Excluded I, O to avoid confusion
    const numbers = '0123456789'

    let code = ''
    for (let i = 0; i < 3; i++) {
        code += letters.charAt(Math.floor(Math.random() * letters.length))
    }
    for (let i = 0; i < 3; i++) {
        code += numbers.charAt(Math.floor(Math.random() * numbers.length))
    }

    return code
}

/**
 * Send magic link email via Zeptomail
 */
export async function sendMagicLinkEmail(options: {
    to: string
    firstName: string
    type: 'signup_business' | 'signup_employee' | 'login' | 'invite_employee'
    magicLink: string
    businessName?: string
}): Promise<void> {
    const config = useRuntimeConfig()

    const apiKey = config.zeptomailApiKey
    const fromAddress = config.public.mailFromAddress || 'noreply@bootserp.com'
    const fromName = config.public.mailFromName || 'Boots Security'

    if (!apiKey) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Email API key not configured'
        })
    }

    const typeLabels = {
        signup_business: 'Complete Your Business Registration',
        signup_employee: 'Complete Your Employee Registration',
        login: 'Sign In to Your Account',
        invite_employee: `You've been added to ${options.businessName || 'a Team'}`
    }

    const subject = typeLabels[options.type]
    const actionText = {
        signup_business: 'Complete Registration',
        signup_employee: 'Complete Registration',
        login: 'Sign In',
        invite_employee: 'Sign In'
    }

    const descriptionText = {
        signup_business: 'Click the button below to complete your registration:',
        signup_employee: 'Click the button below to complete your registration:',
        login: 'Click the button below to sign in to your account:',
        invite_employee: `You have been added to <strong>${options.businessName}</strong>. Click the button below to sign in and access your account.`
    }

    const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1f2937; margin-bottom: 16px;">${subject}</h2>
      <p style="color: #4b5563; line-height: 1.6; margin-bottom: 24px;">
        Hi ${options.firstName},
      </p>
      <p style="color: #4b5563; line-height: 1.6; margin-bottom: 24px;">
        ${descriptionText[options.type]}
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${options.magicLink}" 
           style="background-color: #2563eb; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">
          ${actionText[options.type]}
        </a>
      </div>
      <p style="color: #9ca3af; font-size: 14px; margin-top: 32px;">
        This link will expire in 15 minutes. If you didn't request this, you can safely ignore this email.
      </p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="color: #9ca3af; font-size: 12px;">
        ${fromName}
      </p>
    </div>
  `

    const payload = {
        from: {
            address: fromAddress,
            name: fromName
        },
        to: [{
            email_address: {
                address: options.to,
                name: options.firstName
            }
        }],
        subject,
        htmlbody: htmlContent
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
        console.error('Failed to send magic link email:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to send email'
        })
    }
}
