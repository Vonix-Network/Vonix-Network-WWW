ALTER TABLE `users` ADD `square_customer_id` text;--> statement-breakpoint
ALTER TABLE `users` ADD `donor_rank` text;--> statement-breakpoint
CREATE UNIQUE INDEX `users_square_customer_id_unique` ON `users` (`square_customer_id`);