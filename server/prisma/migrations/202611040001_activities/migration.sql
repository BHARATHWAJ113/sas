CREATE TABLE `activity_categories` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(80) NOT NULL,
    `title` VARCHAR(120) NOT NULL,
    `titleTa` VARCHAR(160) NOT NULL,
    `icon` VARCHAR(24) NOT NULL DEFAULT 'sparkles',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `activity_categories_slug_key`(`slug`),
    INDEX `activity_categories_status_sortOrder_idx`(`status`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `activities` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(160) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `titleTa` VARCHAR(255) NOT NULL,
    `summary` TEXT NOT NULL,
    `summaryTa` TEXT NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `imageId` VARCHAR(191) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `isDemo` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `activities_slug_key`(`slug`),
    INDEX `activities_categoryId_status_sortOrder_idx`(`categoryId`, `status`, `sortOrder`),
    INDEX `activities_status_sortOrder_idx`(`status`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `activities` ADD CONSTRAINT `activities_categoryId_fkey`
    FOREIGN KEY (`categoryId`) REFERENCES `activity_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `activities` ADD CONSTRAINT `activities_imageId_fkey`
    FOREIGN KEY (`imageId`) REFERENCES `media`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
