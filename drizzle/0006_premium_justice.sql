ALTER TABLE `donation_ranks` ADD `stripe_product_id` text;--> statement-breakpoint
ALTER TABLE `donation_ranks` ADD `stripe_price_monthly` text;--> statement-breakpoint
ALTER TABLE `donation_ranks` ADD `stripe_price_quarterly` text;--> statement-breakpoint
ALTER TABLE `donation_ranks` ADD `stripe_price_semiannual` text;--> statement-breakpoint
ALTER TABLE `donation_ranks` ADD `stripe_price_yearly` text;--> statement-breakpoint
ALTER TABLE `donations` ADD `receipt_number` text;--> statement-breakpoint
ALTER TABLE `donations` ADD `payment_id` text;--> statement-breakpoint
ALTER TABLE `donations` ADD `subscription_id` text;--> statement-breakpoint
ALTER TABLE `donations` ADD `rank_id` text;--> statement-breakpoint
ALTER TABLE `donations` ADD `days` integer;--> statement-breakpoint
ALTER TABLE `donations` ADD `payment_type` text DEFAULT 'one_time';--> statement-breakpoint
ALTER TABLE `donations` ADD `status` text DEFAULT 'completed' NOT NULL;--> statement-breakpoint
ALTER TABLE `donations` ADD `stripe_invoice_id` text;--> statement-breakpoint
ALTER TABLE `donations` ADD `stripe_invoice_url` text;--> statement-breakpoint
ALTER TABLE `donations` ADD `stripe_price_id` text;