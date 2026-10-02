CREATE TABLE `categories` (
	`slug` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `skill_agents` (
	`skill_id` text NOT NULL,
	`agent` text NOT NULL,
	`evidence` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`install_instructions` text DEFAULT '' NOT NULL,
	PRIMARY KEY(`skill_id`, `agent`),
	FOREIGN KEY (`skill_id`) REFERENCES `skills`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `skills` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`short_description` text NOT NULL,
	`full_description` text DEFAULT '' NOT NULL,
	`who_its_for` text DEFAULT '' NOT NULL,
	`category_slug` text NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`creator_name` text DEFAULT '' NOT NULL,
	`creator_url` text DEFAULT '' NOT NULL,
	`source_url` text DEFAULT '' NOT NULL,
	`repo_url` text DEFAULT '' NOT NULL,
	`repo_subpath` text DEFAULT '' NOT NULL,
	`pinned_ref` text DEFAULT '' NOT NULL,
	`license_spdx` text DEFAULT '' NOT NULL,
	`license_url` text DEFAULT '' NOT NULL,
	`attribution` text DEFAULT '' NOT NULL,
	`distribution` text DEFAULT 'link_only' NOT NULL,
	`redistribution_note` text DEFAULT '' NOT NULL,
	`version` text DEFAULT '' NOT NULL,
	`install_instructions` text DEFAULT '' NOT NULL,
	`verification` text DEFAULT 'community' NOT NULL,
	`last_tested_at` text DEFAULT '' NOT NULL,
	`review_notes` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`is_sample` integer DEFAULT false NOT NULL,
	`added_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`category_slug`) REFERENCES `categories`(`slug`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `skills_slug_unique` ON `skills` (`slug`);--> statement-breakpoint
CREATE INDEX `skills_category_idx` ON `skills` (`category_slug`);--> statement-breakpoint
CREATE INDEX `skills_status_idx` ON `skills` (`status`);