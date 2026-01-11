import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'

// =============================================================================
// CORE BUSINESS TABLES
// =============================================================================

/**
 * Businesses table - Companies that sign up
 */
export const businesses = sqliteTable('businesses', {
    id: integer().primaryKey({ autoIncrement: true }),
    name: text().notNull(),
    code: text().notNull().unique(), // Unique 6-char code (e.g., "ABC123")
    createdAt: integer({ mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

/**
 * Users table - Both business owners and employees
 */
export const users = sqliteTable('users', {
    id: integer().primaryKey({ autoIncrement: true }),
    email: text().notNull().unique(),
    firstName: text().notNull(),
    lastName: text().notNull(),
    phone: text(),
    phoneEncrypted: text(), // Encrypted PII for compliance
    role: text().notNull(), // 'business_owner' | 'employee' | 'admin'
    businessId: integer().references(() => businesses.id),

    // GDPR Consent Fields
    consentMarketing: integer({ mode: 'boolean' }).default(false),
    consentAnalytics: integer({ mode: 'boolean' }).default(false),
    consentTimestamp: integer({ mode: 'timestamp' }),
    privacyPolicyVersion: text(),
    termsVersion: text(),

    // Account Status
    status: text().default('active'), // 'active' | 'suspended' | 'deleted'
    deletedAt: integer({ mode: 'timestamp' }),

    createdAt: integer({ mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer({ mode: 'timestamp' }).$defaultFn(() => new Date()),
    lastLoginAt: integer({ mode: 'timestamp' }),

    // E2EE Identity
    publicKey: text(), // User's public identity key (JWK format)
})

/**
 * Magic tokens table - For magic link authentication
 */
export const magicTokens = sqliteTable('magic_tokens', {
    id: integer().primaryKey({ autoIncrement: true }),
    email: text().notNull(),
    token: text().notNull().unique(),
    type: text().notNull(), // 'signup_business' | 'signup_employee' | 'login'
    metadata: text(), // JSON string with signup data, company_code, etc.
    expiresAt: integer({ mode: 'timestamp' }).notNull(),
    used: integer({ mode: 'boolean' }).notNull().default(false),
    createdAt: integer({ mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// =============================================================================
// COMPLIANCE: AUDIT LOGGING
// =============================================================================

/**
 * Audit Logs table - SOC2/GDPR/HIPAA compliant event logging
 */
export const auditLogs = sqliteTable('audit_logs', {
    id: integer().primaryKey({ autoIncrement: true }),

    // Timestamp
    timestamp: integer({ mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),

    // Event Classification
    eventType: text().notNull(), // 'auth.login', 'auth.logout', 'user.update', etc.
    action: text().notNull(),    // 'create', 'read', 'update', 'delete', 'login', 'logout'
    status: text().notNull(),    // 'success', 'failure', 'blocked'

    // Actor Information (who performed the action)
    actorId: integer(),
    actorEmail: text(),
    actorIp: text().notNull(),
    actorUserAgent: text(),
    actorCountry: text(),

    // Resource Information (what was affected)
    resourceType: text(),  // 'user', 'business', 'session', etc.
    resourceId: integer(),

    // Additional Context
    failureReason: text(),
    metadata: text(), // JSON with additional context

    // Multi-tenant Support
    businessId: integer(),

    createdAt: integer({ mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => [
    index('idx_audit_logs_timestamp').on(table.timestamp),
    index('idx_audit_logs_actor_id').on(table.actorId),
    index('idx_audit_logs_event_type').on(table.eventType),
    index('idx_audit_logs_business_id').on(table.businessId),
])

// =============================================================================
// COMPLIANCE: SESSION MANAGEMENT
// =============================================================================

/**
 * User Sessions table - Track active sessions for security
 */
export const userSessions = sqliteTable('user_sessions', {
    id: integer().primaryKey({ autoIncrement: true }),
    userId: integer().notNull().references(() => users.id),
    sessionToken: text().notNull().unique(),

    // Device Information
    ipAddress: text(),
    userAgent: text(),
    deviceInfo: text(), // JSON with parsed device info
    country: text(),

    // Timestamps
    createdAt: integer({ mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
    lastActiveAt: integer({ mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
    expiresAt: integer({ mode: 'timestamp' }).notNull(),

    // Revocation
    revokedAt: integer({ mode: 'timestamp' }),
    revokedReason: text(),
}, (table) => [
    index('idx_user_sessions_user_id').on(table.userId),
    index('idx_user_sessions_token').on(table.sessionToken),
])

// =============================================================================
// COMPLIANCE: CONSENT MANAGEMENT (GDPR)
// =============================================================================

/**
 * Consent Logs table - Track consent changes for GDPR compliance
 */
export const consentLogs = sqliteTable('consent_logs', {
    id: integer().primaryKey({ autoIncrement: true }),
    userId: integer().notNull().references(() => users.id),

    // Consent Details
    consentType: text().notNull(), // 'marketing', 'analytics', 'terms', 'privacy'
    granted: integer({ mode: 'boolean' }).notNull(),
    version: text(), // Policy version at time of consent

    // Context
    ipAddress: text(),
    userAgent: text(),

    createdAt: integer({ mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => [
    index('idx_consent_logs_user_id').on(table.userId),
])

// =============================================================================
// COMPLIANCE: DATA EXPORT REQUESTS (GDPR DSAR)
// =============================================================================

/**
 * Data Export Requests - Track DSAR (Data Subject Access Requests)
 */
export const dataExportRequests = sqliteTable('data_export_requests', {
    id: integer().primaryKey({ autoIncrement: true }),
    userId: integer().notNull().references(() => users.id),

    // Request Status
    status: text().notNull().default('pending'), // 'pending', 'processing', 'completed', 'failed'
    requestedAt: integer({ mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
    completedAt: integer({ mode: 'timestamp' }),

    // Export Details
    exportUrl: text(), // Secure download URL
    expiresAt: integer({ mode: 'timestamp' }),

    // Context
    ipAddress: text(),
    userAgent: text(),
})

// =============================================================================
// ACCESS CONTROL: PERMISSIONS
// =============================================================================

/**
 * Permissions table - Define available permissions
 */
export const permissions = sqliteTable('permissions', {
    id: integer().primaryKey({ autoIncrement: true }),
    name: text().notNull().unique(),
    description: text(),
    category: text(), // 'users', 'audit', 'settings', etc.
})

/**
 * Role Permissions - Map roles to permissions
 */
export const rolePermissions = sqliteTable('role_permissions', {
    id: integer().primaryKey({ autoIncrement: true }),
    role: text().notNull(),
    permissionId: integer().notNull().references(() => permissions.id),
}, (table) => [
    index('idx_role_permissions_role').on(table.role),
])

// =============================================================================
// CHAT & E2EE
// =============================================================================

/**
 * Conversations table - Chat threads (Direct or Group)
 */
export const conversations = sqliteTable('conversations', {
    id: integer().primaryKey({ autoIncrement: true }),
    type: text().notNull(), // 'direct' | 'group'
    name: text(), // Optional name for group chats
    createdAt: integer({ mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer({ mode: 'timestamp' }).$defaultFn(() => new Date()),
})

/**
 * Conversation Participants - Members of a chat
 */
export const conversationParticipants = sqliteTable('conversation_participants', {
    id: integer().primaryKey({ autoIncrement: true }),
    conversationId: integer().notNull().references(() => conversations.id),
    userId: integer().notNull().references(() => users.id),

    // E2EE Session Key
    // The conversation's symmetric key, encrypted with this user's public key.
    // This allows the user to decrypt the conversation key and then read messages.
    encryptedKey: text(),

    joinedAt: integer({ mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
    lastReadAt: integer({ mode: 'timestamp' }),
}, (table) => [
    index('idx_participants_conversation_id').on(table.conversationId),
    index('idx_participants_user_id').on(table.userId),
])

/**
 * Messages - Encrypted message blobs
 */
export const messages = sqliteTable('messages', {
    id: integer().primaryKey({ autoIncrement: true }),
    conversationId: integer().notNull().references(() => conversations.id),
    senderId: integer().notNull().references(() => users.id),

    // Content is a JSON blob encrypted with the Conversation Key (AES-GCM)
    // Structure after decryption: { text: "Hello", attachments: [...] }
    content: text().notNull(),

    // Initialization Vector (IV) for AES-GCM
    iv: text().notNull(),

    createdAt: integer({ mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => [
    index('idx_messages_conversation_id').on(table.conversationId),
    index('idx_messages_created_at').on(table.createdAt),
])

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type Business = typeof businesses.$inferSelect
export type NewBusiness = typeof businesses.$inferInsert

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type MagicToken = typeof magicTokens.$inferSelect
export type NewMagicToken = typeof magicTokens.$inferInsert

export type AuditLog = typeof auditLogs.$inferSelect
export type NewAuditLog = typeof auditLogs.$inferInsert

export type UserSession = typeof userSessions.$inferSelect
export type NewUserSession = typeof userSessions.$inferInsert

export type ConsentLog = typeof consentLogs.$inferSelect
export type NewConsentLog = typeof consentLogs.$inferInsert

export type DataExportRequest = typeof dataExportRequests.$inferSelect
export type NewDataExportRequest = typeof dataExportRequests.$inferInsert

export type Permission = typeof permissions.$inferSelect
export type NewPermission = typeof permissions.$inferInsert

export type RolePermission = typeof rolePermissions.$inferSelect
export type NewRolePermission = typeof rolePermissions.$inferInsert

export type Conversation = typeof conversations.$inferSelect
export type NewConversation = typeof conversations.$inferInsert

export type ConversationParticipant = typeof conversationParticipants.$inferSelect
export type NewConversationParticipant = typeof conversationParticipants.$inferInsert

export type Message = typeof messages.$inferSelect
export type NewMessage = typeof messages.$inferInsert
