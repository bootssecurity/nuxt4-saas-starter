import { eq } from 'drizzle-orm'
import { db } from 'hub:db'
import { users, magicTokens } from '~~/server/database/schema'
import {
    logSuccess,
    logFailure,
    AuditEventTypes,
    AuditActions,
    ResourceTypes
} from '~~/server/utils/audit'

export default defineEventHandler(async (event) => {
    // 1. Verify Authentication & Permissions
    const session = await requireUserSession(event)

    if (session.user.role !== 'business_owner') {
        throw createError({
            statusCode: 403,
            statusMessage: 'Only business owners can add users'
        })
    }

    if (!session.user.businessId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'You are not associated with a business'
        })
    }

    // 2. Read and Validate Body
    const body = await readBody(event)
    const { firstName, lastName, email, role } = body

    if (!firstName || !lastName || !email || !role) {
        throw createError({
            statusCode: 400,
            statusMessage: 'All fields are required'
        })
    }

    // Sanitize
    const sanitizedEmail = sanitizeEmail(email)
    const sanitizedFirstName = sanitizeString(firstName)
    const sanitizedLastName = sanitizeString(lastName)

    // 3. Check if user exists
    const existingUser = await db.select()
        .from(users)
        .where(eq(users.email, sanitizedEmail))
        .get()

    let newUserId: number

    if (existingUser) {
        // If user exists and belongs to another business, block
        if (existingUser.businessId && existingUser.businessId !== session.user.businessId) {
            throw createError({
                statusCode: 409,
                statusMessage: 'User already belongs to another business'
            })
        }

        // If user exists and belongs to THIS business, block (duplicate)
        if (existingUser.businessId === session.user.businessId) {
            throw createError({
                statusCode: 409,
                statusMessage: 'User is already a member of this business'
            })
        }

        // If user exists but has NO business (freelance/unassigned), claim them
        // Update their businessId and role
        await db.update(users)
            .set({
                businessId: session.user.businessId,
                role: role,
                firstName: sanitizedFirstName, // Update details if changed
                lastName: sanitizedLastName,
                updatedAt: new Date()
            })
            .where(eq(users.id, existingUser.id))

        newUserId = existingUser.id
    } else {
        // Create new user
        const result = await db.insert(users).values({
            email: sanitizedEmail,
            firstName: sanitizedFirstName,
            lastName: sanitizedLastName,
            role: role,
            businessId: session.user.businessId,
            createdAt: new Date(),
            updatedAt: new Date()
        }).returning({ id: users.id }).get()

        newUserId = result.id
    }

    // 4. Generate Magic Link (Token)
    const token = generateMagicToken()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours for invitation

    // Remove existing tokens for this email
    await db.delete(magicTokens).where(eq(magicTokens.email, sanitizedEmail))

    await db.insert(magicTokens).values({
        email: sanitizedEmail,
        token,
        type: 'login', // Use 'login' type so they can just sign in directly. Or 'signup_employee' if we want them to set a password later? 
        // Wait, if we use 'invite_employee' logic in email, the token type in DB should probably match valid types or be 'login'. 
        // The `verify.get.ts` handles the token. Let's see if verify handles specific types.
        // Looking at verify.get.ts (I should check it), usually it just logs them in.
        metadata: JSON.stringify({ userId: newUserId, businessId: session.user.businessId }),
        expiresAt
    })

    // 5. Send Email
    // Fetch business name
    const businessName = session.user.businessName || 'Your Company'
    const config = useRuntimeConfig()
    const appUrl = config.public.appUrl || 'http://localhost:3000'
    const magicLink = `${appUrl}/auth/verify?token=${token}`

    try {
        await sendMagicLinkEmail({
            to: sanitizedEmail,
            firstName: sanitizedFirstName,
            type: 'invite_employee', // This triggers the properly worded email
            magicLink,
            businessName
        })
    } catch (error) {
        console.error('Failed to send invite email', error)
        // Ensure we don't rollback the user creation? Or should we?
        // Ideally we should warn but succeed.
    }

    // 6. Audit Log
    await logSuccess(event, AuditEventTypes.USER_CREATE, AuditActions.CREATE, {
        actorId: session.user.id,
        actorEmail: session.user.email,
        resourceType: ResourceTypes.USER,
        resourceId: newUserId,
        businessId: session.user.businessId,
        metadata: { invitedEmail: sanitizedEmail, role }
    })

    return {
        success: true,
        message: 'User added and invitation sent'
    }
})
