/**
 * Type definitions for nuxt-auth-utils session
 */
declare module '#auth-utils' {
    interface User {
        id: number
        email: string
        firstName: string
        lastName: string
        role: 'business_owner' | 'employee'
        businessId: number | null
        businessName?: string
        businessCode?: string
        status: string
    }

    interface UserSession {
        loggedInAt: Date
    }
}

export { }
