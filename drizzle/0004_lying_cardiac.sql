ALTER TABLE `users` ADD `rank_paused` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `paused_remaining_days` integer;--> statement-breakpoint
ALTER TABLE `users` ADD `paused_at` integer;