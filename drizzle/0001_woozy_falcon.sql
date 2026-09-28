ALTER TABLE `payments` ADD `reference` text;--> statement-breakpoint
ALTER TABLE `payments` ADD `mode` text;--> statement-breakpoint
ALTER TABLE `payments` ADD `amount_kobo` integer;--> statement-breakpoint
ALTER TABLE `payments` ADD `token_hash` text;--> statement-breakpoint
ALTER TABLE `payments` ADD `token_cipher` text;--> statement-breakpoint
ALTER TABLE `payments` ADD `token_expires_at` text;--> statement-breakpoint
ALTER TABLE `payments` ADD `paid_at` text;--> statement-breakpoint
CREATE UNIQUE INDEX `payments_reference_unique` ON `payments` (`reference`);