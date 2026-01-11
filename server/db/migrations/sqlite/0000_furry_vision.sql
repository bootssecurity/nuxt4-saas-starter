CREATE TABLE `conversations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`name` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer
);
--> statement-breakpoint
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
ALTER TABLE `users` ADD COLUMN `publicKey` text;