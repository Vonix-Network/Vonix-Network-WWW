CREATE TABLE `achievements` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`icon` text,
	`category` text NOT NULL,
	`xp_reward` integer DEFAULT 0 NOT NULL,
	`requirement` text NOT NULL,
	`hidden` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `api_keys` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`key` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `api_keys_name_unique` ON `api_keys` (`name`);--> statement-breakpoint
CREATE TABLE `daily_streaks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`current_streak` integer DEFAULT 0 NOT NULL,
	`longest_streak` integer DEFAULT 0 NOT NULL,
	`last_login_date` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `daily_streaks_user_id_unique` ON `daily_streaks` (`user_id`);--> statement-breakpoint
CREATE TABLE `forum_votes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`post_id` integer,
	`reply_id` integer,
	`user_id` integer NOT NULL,
	`vote_type` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `forum_posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reply_id`) REFERENCES `forum_replies`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `group_post_comments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`post_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`content` text NOT NULL,
	`likes_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `group_posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `group_post_likes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`post_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`post_id`) REFERENCES `group_posts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `group_posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`group_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`content` text NOT NULL,
	`image_url` text,
	`likes_count` integer DEFAULT 0 NOT NULL,
	`comments_count` integer DEFAULT 0 NOT NULL,
	`pinned` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `level_rewards` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`level` integer NOT NULL,
	`title` text,
	`badge` text,
	`description` text,
	`reward_type` text,
	`reward_value` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `level_rewards_level_unique` ON `level_rewards` (`level`);--> statement-breakpoint
CREATE TABLE `reported_content` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`content_type` text NOT NULL,
	`content_id` integer NOT NULL,
	`reporter_id` integer NOT NULL,
	`reason` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`reviewed_by` integer,
	`reviewed_at` integer,
	`review_notes` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`reporter_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `site_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`value` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `site_settings_key_unique` ON `site_settings` (`key`);--> statement-breakpoint
CREATE TABLE `social_comment_likes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`comment_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`comment_id`) REFERENCES `social_comments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_achievements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`achievement_id` text NOT NULL,
	`progress` integer DEFAULT 0 NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`completed_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`achievement_id`) REFERENCES `achievements`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_engagement` (
	`user_id` integer PRIMARY KEY NOT NULL,
	`total_points` integer DEFAULT 0 NOT NULL,
	`posts_created` integer DEFAULT 0 NOT NULL,
	`comments_created` integer DEFAULT 0 NOT NULL,
	`forum_posts_created` integer DEFAULT 0 NOT NULL,
	`forum_replies_created` integer DEFAULT 0 NOT NULL,
	`upvotes_received` integer DEFAULT 0 NOT NULL,
	`downvotes_received` integer DEFAULT 0 NOT NULL,
	`likes_received` integer DEFAULT 0 NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `xp_transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`amount` integer NOT NULL,
	`source` text NOT NULL,
	`source_id` integer,
	`description` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
DROP INDEX "api_keys_name_unique";--> statement-breakpoint
DROP INDEX "blog_posts_slug_unique";--> statement-breakpoint
DROP INDEX "chat_messages_discord_message_id_unique";--> statement-breakpoint
DROP INDEX "daily_streaks_user_id_unique";--> statement-breakpoint
DROP INDEX "forum_categories_slug_unique";--> statement-breakpoint
DROP INDEX "level_rewards_level_unique";--> statement-breakpoint
DROP INDEX "registration_codes_code_unique";--> statement-breakpoint
DROP INDEX "site_settings_key_unique";--> statement-breakpoint
DROP INDEX "users_username_unique";--> statement-breakpoint
DROP INDEX "users_minecraft_username_unique";--> statement-breakpoint
DROP INDEX "users_minecraft_uuid_unique";--> statement-breakpoint
ALTER TABLE `blog_posts` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
CREATE UNIQUE INDEX `blog_posts_slug_unique` ON `blog_posts` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `chat_messages_discord_message_id_unique` ON `chat_messages` (`discord_message_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `forum_categories_slug_unique` ON `forum_categories` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `registration_codes_code_unique` ON `registration_codes` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_minecraft_username_unique` ON `users` (`minecraft_username`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_minecraft_uuid_unique` ON `users` (`minecraft_uuid`);--> statement-breakpoint
ALTER TABLE `blog_posts` ALTER COLUMN "updated_at" TO "updated_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `chat_messages` ALTER COLUMN "timestamp" TO "timestamp" integer NOT NULL;--> statement-breakpoint
ALTER TABLE `chat_messages` ADD `created_at` integer DEFAULT (unixepoch()) NOT NULL;--> statement-breakpoint
ALTER TABLE `chat_messages` DROP COLUMN `server_id`;--> statement-breakpoint
ALTER TABLE `donation_ranks` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `donation_ranks` ALTER COLUMN "updated_at" TO "updated_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `donations` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `event_attendees` ALTER COLUMN "responded_at" TO "responded_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `events` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `forum_categories` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `forum_categories` ADD `create_permission` text DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE `forum_categories` ADD `reply_permission` text DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE `forum_categories` ADD `view_permission` text DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE `forum_posts` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `forum_posts` ALTER COLUMN "updated_at" TO "updated_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `forum_replies` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `forum_replies` ALTER COLUMN "updated_at" TO "updated_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `friendships` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `friendships` ALTER COLUMN "updated_at" TO "updated_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `group_members` ALTER COLUMN "joined_at" TO "joined_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `groups` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `notifications` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `private_messages` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `registration_codes` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `servers` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `servers` ALTER COLUMN "updated_at" TO "updated_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `settings` ALTER COLUMN "updated_at" TO "updated_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `social_comments` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `social_comments` ADD `parent_comment_id` integer;--> statement-breakpoint
ALTER TABLE `social_comments` ADD `likes_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `social_comments` ADD `updated_at` integer DEFAULT (unixepoch()) NOT NULL;--> statement-breakpoint
ALTER TABLE `social_likes` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `social_posts` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `social_posts` ALTER COLUMN "updated_at" TO "updated_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `social_posts` ADD `likes_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `social_posts` ADD `comments_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `stories` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `story_views` ALTER COLUMN "viewed_at" TO "viewed_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `users` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `users` ALTER COLUMN "updated_at" TO "updated_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `users` ADD `preferred_background` text;--> statement-breakpoint
ALTER TABLE `users` ADD `rank_expires_at` integer;--> statement-breakpoint
ALTER TABLE `users` ADD `xp` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `level` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `title` text;--> statement-breakpoint
ALTER TABLE `users` ALTER COLUMN "donation_rank_id" TO "donation_rank_id" text REFERENCES donation_ranks(id) ON DELETE set null ON UPDATE no action;