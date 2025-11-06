ALTER TABLE `users` ADD `stripe_customer_id` text;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `users_stripe_customer_id_unique` ON `users` (`stripe_customer_id`);--> statement-breakpoint
