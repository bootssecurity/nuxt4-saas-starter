/**
 * Auth middleware - protects pages that require authentication
 */
export default defineNuxtRouteMiddleware((to) => {
    const { loggedIn } = useUserSession()

    // If not logged in, redirect to login
    if (!loggedIn.value) {
        return navigateTo('/auth/login')
    }
})
