export default defineEventHandler(async (event) => {
    const { user } = await getUserSession(event)

    // 1. Strict access control for /inactive page
    if (event.path === '/inactive') {
        if (!user) {
            return sendRedirect(event, '/auth/login')
        }
        if (user.status === 'active') {
            return sendRedirect(event, '/dashboard')
        }
        // Allow access for logged-in users who are NOT active
        return
    }

    if (!user) return

    // Skip logout checking
    if (event.path.startsWith('/api/auth/logout')) return

    // Check if user is suspended/inactive
    // Assuming 'active' is the approved state. Adjust logic if 'pending' is also allowed for some things.
    // Here we block anything that is NOT 'active'
    if (user.status !== 'active') {
        // If trying to access dashboard or API (except logout)
        if (event.path.startsWith('/dashboard') || (event.path.startsWith('/api') && !event.path.startsWith('/api/auth'))) {
            // For API requests, return 403
            if (event.path.startsWith('/api')) {
                throw createError({
                    statusCode: 403,
                    statusMessage: 'Account is not active'
                })
            }

            // For page requests, redirect to inactive page
            return sendRedirect(event, '/inactive')
        }
    }
})
