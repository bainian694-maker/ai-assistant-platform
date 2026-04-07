CREATE TABLE `api_key_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`provider` varchar(64) NOT NULL,
	`apiKey` text NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `api_key_configs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `code_executions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`language` varchar(64) NOT NULL,
	`code` text NOT NULL,
	`result` text,
	`error` text,
	`executionTime` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `code_executions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversation_favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`chatMessageId` int NOT NULL,
	`title` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conversation_favorites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `file_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileType` varchar(64) NOT NULL,
	`fileSize` int NOT NULL,
	`fileUrl` text NOT NULL,
	`status` enum('uploaded','processing','completed','failed') NOT NULL DEFAULT 'uploaded',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `file_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `image_generations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`prompt` text NOT NULL,
	`imageUrl` text NOT NULL,
	`model` varchar(64) NOT NULL DEFAULT 'dall-e-3',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `image_generations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_tool_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tool` varchar(64) NOT NULL,
	`isEnabled` boolean NOT NULL DEFAULT true,
	`settings` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_tool_preferences_id` PRIMARY KEY(`id`)
);
