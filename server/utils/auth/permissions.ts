/**
 * Permission-Based Access Control
 * Role and permission management for authorization
 */

import type { H3Event } from 'h3'
import { eq, and } from 'drizzle-orm'
import { db } from 'hub:db'
import { permissions, rolePermissions } from '~~/server/db/schema'

/**
 * Default role permissions mapping
 */
export const DEFAULT_PERMISSIONS = {
    admin: [
        'users.read', 'users.create', 'users.update', 'users.delete',
        'business.read', 'business.update',
        'audit.read',
        'settings.manage',
        'reports.view'
    ],
    business_owner: [
        'users.read', 'users.create', 'users.update',
        'business.read', 'business.update',
        'audit.read',
        'settings.manage',
        'reports.view'
    ],
    employee: [
        'users.read.self',
        'business.read',
        'reports.view'
    ]
} as const

/**
 * Get permissions for a role
 */
export async function getRolePermissions(role: string): Promise<string[]> {
    // First check database
    const dbPermissions = await db.select({
        name: permissions.name
    })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(eq(rolePermissions.role, role))
        .all()

    if (dbPermissions.length > 0) {
        return dbPermissions.map(p => p.name)
    }

    // Fall back to default permissions
    return DEFAULT_PERMISSIONS[role as keyof typeof DEFAULT_PERMISSIONS] || []
}

/**
 * Check if a role has a specific permission
 */
export async function hasPermission(
    role: string,
    permission: string,
    resourceId?: number,
    userId?: number
): Promise<boolean> {
    const permissions = await getRolePermissions(role)

    // Check for exact permission
    if (permissions.includes(permission)) {
        return true
    }

    // Check for self-only permission (e.g., users.read.self)
    if (permissions.includes(`${permission}.self`) && resourceId === userId) {
        return true
    }

    // Check for wildcard permissions (e.g., users.* matches users.read)
    const [category] = permission.split('.')
    if (permissions.includes(`${category}.*`)) {
        return true
    }

    return false
}

/**
 * Require a specific permission - throws error if not authorized
 */
export async function requirePermission(
    event: H3Event,
    permission: string,
    resourceId?: number
): Promise<void> {
    const session = await requireUserSession(event)

    const authorized = await hasPermission(
        session.user.role,
        permission,
        resourceId,
        session.user.id
    )

    if (!authorized) {
        throw createError({
            statusCode: 403,
            statusMessage: `Insufficient permissions: ${permission} required`
        })
    }
}

/**
 * Check if user can access a specific business
 */
export async function canAccessBusiness(
    event: H3Event,
    businessId: number
): Promise<boolean> {
    const session = await getUserSession(event)

    if (!session?.user) {
        return false
    }

    // Admins can access all businesses
    if (session.user.role === 'admin') {
        return true
    }

    // Users can only access their own business
    return session.user.businessId === businessId
}

/**
 * Require access to a specific business
 */
export async function requireBusinessAccess(
    event: H3Event,
    businessId: number
): Promise<void> {
    const hasAccess = await canAccessBusiness(event, businessId)

    if (!hasAccess) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Access denied to this business'
        })
    }
}

/**
 * Seed default permissions into database
 */
export async function seedDefaultPermissions(): Promise<void> {
    const defaultPermissions = [
        { name: 'users.read', description: 'View user list', category: 'users' },
        { name: 'users.read.self', description: 'View own profile', category: 'users' },
        { name: 'users.create', description: 'Create users', category: 'users' },
        { name: 'users.update', description: 'Update users', category: 'users' },
        { name: 'users.delete', description: 'Delete users', category: 'users' },
        { name: 'business.read', description: 'View business info', category: 'business' },
        { name: 'business.update', description: 'Update business info', category: 'business' },
        { name: 'audit.read', description: 'View audit logs', category: 'audit' },
        { name: 'settings.manage', description: 'Manage settings', category: 'settings' },
        { name: 'reports.view', description: 'View reports', category: 'reports' }
    ]

    for (const perm of defaultPermissions) {
        // Insert if not exists
        const existing = await db.select()
            .from(permissions)
            .where(eq(permissions.name, perm.name))
            .get()

        if (!existing) {
            await db.insert(permissions).values(perm)
        }
    }
}
