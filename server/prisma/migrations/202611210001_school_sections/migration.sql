-- AlterTable
ALTER TABLE `media` ADD COLUMN `description` TEXT NULL,
    ADD COLUMN `descriptionTa` TEXT NULL,
    ADD COLUMN `eventDate` DATETIME(3) NULL,
    ADD COLUMN `hasVariants` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `fees` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `titleTa` VARCHAR(255) NOT NULL DEFAULT '',
    `standard` VARCHAR(10) NOT NULL,
    `academicYear` VARCHAR(9) NOT NULL,
    `category` VARCHAR(120) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `frequency` VARCHAR(80) NOT NULL,
    `installments` INTEGER NOT NULL DEFAULT 1,
    `sourceRef` VARCHAR(500) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `fees_status_academicYear_standard_sortOrder_idx`(`status`, `academicYear`, `standard`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `honours` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `nameTa` VARCHAR(160) NOT NULL DEFAULT '',
    `title` VARCHAR(255) NOT NULL,
    `titleTa` VARCHAR(255) NOT NULL DEFAULT '',
    `academicYear` VARCHAR(9) NOT NULL,
    `standard` VARCHAR(10) NOT NULL,
    `category` VARCHAR(120) NOT NULL,
    `description` TEXT NOT NULL,
    `descriptionTa` TEXT NOT NULL,
    `imageId` VARCHAR(191) NULL,
    `sourceRef` VARCHAR(500) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `honours_status_academicYear_sortOrder_idx`(`status`, `academicYear`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `staff_members` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `nameTa` VARCHAR(160) NOT NULL DEFAULT '',
    `designation` VARCHAR(160) NOT NULL,
    `designationTa` VARCHAR(200) NOT NULL DEFAULT '',
    `department` VARCHAR(120) NOT NULL,
    `category` VARCHAR(120) NOT NULL,
    `description` TEXT NOT NULL,
    `descriptionTa` TEXT NOT NULL,
    `imageId` VARCHAR(191) NULL,
    `sourceRef` VARCHAR(500) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `staff_members_status_department_sortOrder_idx`(`status`, `department`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `toppers` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `nameTa` VARCHAR(160) NOT NULL DEFAULT '',
    `standard` VARCHAR(10) NOT NULL,
    `academicYear` VARCHAR(9) NOT NULL,
    `category` VARCHAR(120) NOT NULL,
    `marks` DECIMAL(8, 2) NULL,
    `maximumMarks` DECIMAL(8, 2) NULL,
    `percentage` DECIMAL(5, 2) NULL,
    `rank` INTEGER NULL,
    `imageId` VARCHAR(191) NULL,
    `sourceRef` VARCHAR(500) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `toppers_status_academicYear_standard_sortOrder_idx`(`status`, `academicYear`, `standard`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `honours` ADD CONSTRAINT `honours_imageId_fkey` FOREIGN KEY (`imageId`) REFERENCES `media`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staff_members` ADD CONSTRAINT `staff_members_imageId_fkey` FOREIGN KEY (`imageId`) REFERENCES `media`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `toppers` ADD CONSTRAINT `toppers_imageId_fkey` FOREIGN KEY (`imageId`) REFERENCES `media`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
