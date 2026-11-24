CREATE TABLE `home_slides` (
  `id` VARCHAR(191) NOT NULL, `kind` ENUM('IMAGE','VIDEO') NOT NULL DEFAULT 'IMAGE',
  `alt` VARCHAR(255) NOT NULL, `altTa` VARCHAR(255) NULL, `altHi` VARCHAR(255) NULL,
  `mediaId` VARCHAR(191) NULL, `asset` VARCHAR(255) NULL, `videoUrl` VARCHAR(1000) NULL,
  `posterId` VARCHAR(191) NULL, `duration` INTEGER NOT NULL DEFAULT 7, `sortOrder` INTEGER NOT NULL DEFAULT 0,
  `status` ENUM('DRAFT','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `updatedAt` DATETIME(3) NOT NULL,
  INDEX `home_slides_status_sortOrder_idx`(`status`, `sortOrder`), PRIMARY KEY (`id`),
  CONSTRAINT `home_slides_mediaId_fkey` FOREIGN KEY (`mediaId`) REFERENCES `media`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `home_slides_posterId_fkey` FOREIGN KEY (`posterId`) REFERENCES `media`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `principal_desks` (
  `id` VARCHAR(191) NOT NULL, `title` VARCHAR(255) NOT NULL, `titleTa` VARCHAR(255) NULL, `titleHi` VARCHAR(255) NULL,
  `name` VARCHAR(160) NOT NULL, `nameTa` VARCHAR(160) NULL, `nameHi` VARCHAR(160) NULL,
  `designation` VARCHAR(200) NOT NULL, `designationTa` VARCHAR(200) NULL, `designationHi` VARCHAR(200) NULL,
  `message` LONGTEXT NOT NULL, `messageTa` LONGTEXT NULL, `messageHi` LONGTEXT NULL,
  `imageId` VARCHAR(191) NULL, `imageAsset` VARCHAR(255) NULL,
  `status` ENUM('DRAFT','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `updatedAt` DATETIME(3) NOT NULL,
  INDEX `principal_desks_status_updatedAt_idx`(`status`, `updatedAt`), PRIMARY KEY (`id`),
  CONSTRAINT `principal_desks_imageId_fkey` FOREIGN KEY (`imageId`) REFERENCES `media`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `leader_profiles` (
  `id` VARCHAR(191) NOT NULL, `name` VARCHAR(160) NOT NULL, `nameTa` VARCHAR(160) NULL, `nameHi` VARCHAR(160) NULL,
  `designation` VARCHAR(200) NOT NULL, `designationTa` VARCHAR(200) NULL, `designationHi` VARCHAR(200) NULL,
  `tenure` VARCHAR(80) NULL, `legacy` TEXT NOT NULL, `legacyTa` TEXT NULL, `legacyHi` TEXT NULL,
  `quote` TEXT NULL, `quoteTa` TEXT NULL, `quoteHi` TEXT NULL, `imageId` VARCHAR(191) NULL, `imageAsset` VARCHAR(255) NULL,
  `sortOrder` INTEGER NOT NULL DEFAULT 0, `status` ENUM('DRAFT','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `updatedAt` DATETIME(3) NOT NULL,
  INDEX `leader_profiles_status_sortOrder_idx`(`status`, `sortOrder`), PRIMARY KEY (`id`),
  CONSTRAINT `leader_profiles_imageId_fkey` FOREIGN KEY (`imageId`) REFERENCES `media`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
