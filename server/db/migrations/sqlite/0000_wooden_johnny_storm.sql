CREATE TABLE `audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`timestamp` integer NOT NULL,
	`eventType` text NOT NULL,
	`action` text NOT NULL,
	`status` text NOT NULL,
	`actorId` integer,
	`actorEmail` text,
	`actorIp` text NOT NULL,
	`actorUserAgent` text,
	`actorCountry` text,
	`resourceType` text,
	`resourceId` integer,
	`failureReason` text,
	`metadata` text,
	`businessId` integer,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_audit_logs_timestamp` ON `audit_logs` (`timestamp`);--> statement-breakpoint
CREATE INDEX `idx_audit_logs_actor_id` ON `audit_logs` (`actorId`);--> statement-breakpoint
CREATE INDEX `idx_audit_logs_event_type` ON `audit_logs` (`eventType`);--> statement-breakpoint
CREATE INDEX `idx_audit_logs_business_id` ON `audit_logs` (`businessId`);--> statement-breakpoint
CREATE TABLE `businesses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `businesses_code_unique` ON `businesses` (`code`);--> statement-breakpoint
CREATE TABLE `consent_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`consentType` text NOT NULL,
	`granted` integer NOT NULL,
	`version` text,
	`ipAddress` text,
	`userAgent` text,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_consent_logs_user_id` ON `consent_logs` (`userId`);--> statement-breakpoint
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
--> statement-breakpoint
CREATE INDEX `idx_participants_conversation_id` ON `conversation_participants` (`conversationId`);--> statement-breakpoint
CREATE INDEX `idx_participants_user_id` ON `conversation_participants` (`userId`);--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`name` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer
);
--> statement-breakpoint
CREATE TABLE `data_export_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`requestedAt` integer NOT NULL,
	`completedAt` integer,
	`exportUrl` text,
	`expiresAt` integer,
	`ipAddress` text,
	`userAgent` text,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE UNIQUE INDEX `magic_tokens_token_unique` ON `magic_tokens` (`token`);--> statement-breakpoint
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
--> statement-breakpoint
CREATE INDEX `idx_messages_conversation_id` ON `messages` (`conversationId`);--> statement-breakpoint
CREATE INDEX `idx_messages_created_at` ON `messages` (`createdAt`);--> statement-breakpoint
CREATE TABLE `permissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`category` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `permissions_name_unique` ON `permissions` (`name`);--> statement-breakpoint
CREATE TABLE `role_permissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`role` text NOT NULL,
	`permissionId` integer NOT NULL,
	FOREIGN KEY (`permissionId`) REFERENCES `permissions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_role_permissions_role` ON `role_permissions` (`role`);--> statement-breakpoint
CREATE TABLE `user_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`sessionToken` text NOT NULL,
	`ipAddress` text,
	`userAgent` text,
	`deviceInfo` text,
	`country` text,
	`createdAt` integer NOT NULL,
	`lastActiveAt` integer NOT NULL,
	`expiresAt` integer NOT NULL,
	`revokedAt` integer,
	`revokedReason` text,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_sessions_sessionToken_unique` ON `user_sessions` (`sessionToken`);--> statement-breakpoint
CREATE INDEX `idx_user_sessions_user_id` ON `user_sessions` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_user_sessions_token` ON `user_sessions` (`sessionToken`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`firstName` text NOT NULL,
	`lastName` text NOT NULL,
	`phone` text,
	`phoneEncrypted` text,
	`role` text NOT NULL,
	`businessId` integer,
	`consentMarketing` integer DEFAULT false,
	`consentAnalytics` integer DEFAULT false,
	`consentTimestamp` integer,
	`privacyPolicyVersion` text,
	`termsVersion` text,
	`status` text DEFAULT 'active',
	`deletedAt` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer,
	`lastLoginAt` integer,
	`publicKey` text,
	FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);