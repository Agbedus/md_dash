CREATE TABLE `account` (
	`userId` text NOT NULL,
	`type` text NOT NULL,
	`provider` text NOT NULL,
	`providerAccountId` text NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` integer,
	`token_type` text,
	`scope` text,
	`id_token` text,
	`session_state` text,
	PRIMARY KEY(`provider`, `providerAccountId`),
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` text PRIMARY KEY NOT NULL,
	`company_name` text NOT NULL,
	`contact_person_name` text,
	`contact_email` text,
	`website_url` text,
	`created_at` text
);
--> statement-breakpoint
CREATE TABLE `decisions` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`due_date` text
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`start` text NOT NULL,
	`end` text NOT NULL,
	`all_day` integer DEFAULT 0,
	`location` text,
	`organizer` text,
	`attendees` text,
	`status` text,
	`privacy` text,
	`recurrence` text,
	`reminders` text,
	`color` text,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `note_shares` (
	`id` integer PRIMARY KEY NOT NULL,
	`note_id` integer NOT NULL,
	`user_id` text,
	`email` text NOT NULL,
	`permission` text DEFAULT 'view',
	`created_at` text,
	FOREIGN KEY (`note_id`) REFERENCES `notes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `notes` (
	`id` integer PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`type` text DEFAULT 'note' NOT NULL,
	`tags` text,
	`notebook` text,
	`color` text,
	`is_pinned` integer DEFAULT 0,
	`is_archived` integer DEFAULT 0,
	`is_favorite` integer DEFAULT 0,
	`cover_image` text,
	`links` text,
	`attachments` text,
	`reminder_at` text,
	`due_date` text,
	`priority` text,
	`created_at` text,
	`updated_at` text,
	`user_id` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `project_managers` (
	`project_id` integer NOT NULL,
	`user_id` text NOT NULL,
	PRIMARY KEY(`project_id`, `user_id`),
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`key` text,
	`description` text,
	`status` text DEFAULT 'planning' NOT NULL,
	`priority` text DEFAULT 'medium' NOT NULL,
	`tags` text,
	`owner_id` text,
	`client_id` text,
	`start_date` text,
	`end_date` text,
	`budget` integer,
	`spent` integer DEFAULT 0,
	`currency` text DEFAULT 'USD',
	`billing_type` text DEFAULT 'non_billable',
	`is_archived` integer DEFAULT 0,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_key_unique` ON `projects` (`key`);--> statement-breakpoint
CREATE TABLE `session` (
	`sessionToken` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`expires` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `task_assignees` (
	`task_id` integer NOT NULL,
	`user_id` text NOT NULL,
	PRIMARY KEY(`task_id`, `user_id`),
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`due_date` text,
	`priority` text DEFAULT 'medium' NOT NULL,
	`status` text DEFAULT 'task' NOT NULL,
	`project_id` integer,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`email` text NOT NULL,
	`emailVerified` integer,
	`image` text,
	`password` text,
	`roles` text DEFAULT '["staff"]' NOT NULL,
	`full_name` text,
	`avatar_url` text,
	`created_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `verificationToken` (
	`identifier` text NOT NULL,
	`token` text NOT NULL,
	`expires` integer NOT NULL,
	PRIMARY KEY(`identifier`, `token`)
);
