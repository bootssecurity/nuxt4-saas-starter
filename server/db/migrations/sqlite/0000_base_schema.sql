-- Base schema for Nuxt SaaS Starter
-- Exported from local SQLite and cleaned for D1

CREATE TABLE `businesses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`createdAt` integer NOT NULL
);

CREATE UNIQUE INDEX `businesses_code_unique` ON `businesses` (`code`);

CREATE TABLE `magic_tokens` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`token` text NOT NULL,
	`type` text NOT NULL,
	`metadata` text,
	`expiresAt` integer NOT NULL,
	`used` integer DEFAULT false NOT NULL,
	`createdAt` integer NOT NULL
);

CREATE UNIQUE INDEX `magic_tokens_token_unique` ON `magic_tokens` (`token`);

CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`firstName` text NOT NULL,
	`lastName` text NOT NULL,
	`phone` text,
	`role` text NOT NULL,
	`businessId` integer,
	`createdAt` integer NOT NULL,
	`phoneEncrypted` TEXT,
	`consentMarketing` INTEGER DEFAULT 0,
	`consentAnalytics` INTEGER DEFAULT 0,
	`consentTimestamp` TEXT,
	`privacyPolicyVersion` TEXT,
	`termsVersion` TEXT,
	`status` TEXT DEFAULT 'active',
	`deletedAt` TEXT,
	`updatedAt` TEXT,
	`lastLoginAt` integer,
	`publicKey` text,
	FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);

CREATE TABLE audit_logs (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    eventType TEXT NOT NULL,
    action TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'success',
    actorId TEXT,
    actorEmail TEXT,
    actorIp TEXT,
    actorUserAgent TEXT,
    actorCountry TEXT,
    resourceType TEXT,
    resourceId TEXT,
    businessId TEXT,
    metadata TEXT,
    previousState TEXT,
    newState TEXT,
    failureReason TEXT,
    createdAt TEXT
);

CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actorId);
CREATE INDEX idx_audit_logs_business ON audit_logs(businessId);

CREATE TABLE user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL REFERENCES users(id),
    sessionToken TEXT NOT NULL UNIQUE,
    ipAddress TEXT,
    userAgent TEXT,
    deviceInfo TEXT,
    country TEXT,
    createdAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    lastActiveAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    expiresAt INTEGER NOT NULL,
    revokedAt INTEGER,
    revokedReason TEXT
);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(userId);
CREATE INDEX idx_user_sessions_token ON user_sessions(sessionToken);

CREATE TABLE consent_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL REFERENCES users(id),
    consentType TEXT NOT NULL,
    granted INTEGER NOT NULL DEFAULT 0,
    version TEXT,
    ipAddress TEXT,
    userAgent TEXT,
    createdAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX idx_consent_logs_user_id ON consent_logs(userId);

CREATE TABLE permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    resource TEXT NOT NULL,
    action TEXT NOT NULL,
    createdAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE role_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT NOT NULL,
    permissionId INTEGER NOT NULL REFERENCES permissions(id),
    createdAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX idx_role_permissions_role ON role_permissions(role);

CREATE TABLE data_export_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL REFERENCES users(id),
    status TEXT NOT NULL DEFAULT 'pending',
    requestedAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    completedAt INTEGER,
    exportUrl TEXT,
    expiresAt INTEGER,
    ipAddress TEXT,
    userAgent TEXT
);

CREATE INDEX idx_data_export_user_id ON data_export_requests(userId);

CREATE TABLE `conversations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`name` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer
);

CREATE TABLE `conversation_participants` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`conversationId` integer NOT NULL,
	`userId` integer NOT NULL,
	`encryptedKey` text,
	`joinedAt` integer NOT NULL,
	`lastReadAt` integer,
	FOREIGN KEY (`conversationId`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE INDEX `idx_participants_conversation_id` ON `conversation_participants` (`conversationId`);
CREATE INDEX `idx_participants_user_id` ON `conversation_participants` (`userId`);

CREATE TABLE `messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`conversationId` integer NOT NULL,
	`senderId` integer NOT NULL,
	`content` text NOT NULL,
	`iv` text NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`conversationId`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE INDEX `idx_messages_conversation_id` ON `messages` (`conversationId`);
CREATE INDEX `idx_messages_created_at` ON `messages` (`createdAt`);
