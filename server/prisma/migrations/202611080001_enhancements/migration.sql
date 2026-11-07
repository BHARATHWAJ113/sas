-- AlterTable
ALTER TABLE `announcements` ADD COLUMN `announcementType` VARCHAR(24) NOT NULL DEFAULT 'NOTICE',
    ADD COLUMN `ctaLabel` VARCHAR(80) NULL,
    ADD COLUMN `ctaLabelTa` VARCHAR(120) NULL,
    ADD COLUMN `ctaPath` VARCHAR(255) NULL,
    ADD COLUMN `footerMessage` VARCHAR(500) NULL,
    ADD COLUMN `footerMessageTa` VARCHAR(500) NULL,
    ADD COLUMN `imageId` VARCHAR(191) NULL,
    ADD COLUMN `priority` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `showPopup` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `wishes` TEXT NULL,
    ADD COLUMN `wishesTa` TEXT NULL;

-- AlterTable
ALTER TABLE `admission_enquiries` ADD COLUMN `metadata` JSON NULL,
    ADD COLUMN `metadataExpiresAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `email_messages` ADD COLUMN `attachmentId` VARCHAR(191) NULL,
    ADD COLUMN `bcc` JSON NULL;

-- AlterTable
ALTER TABLE `cookie_consents` ADD COLUMN `analytics` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `maps` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `cookie_consent_events` ADD COLUMN `analytics` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `maps` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `visitor_records` (
    `id` VARCHAR(191) NOT NULL,
    `requestKey` VARCHAR(64) NOT NULL,
    `path` VARCHAR(300) NOT NULL,
    `consentId` VARCHAR(64) NOT NULL,
    `metadata` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `visitor_records_requestKey_key`(`requestKey`),
    INDEX `visitor_records_createdAt_idx`(`createdAt`),
    INDEX `visitor_records_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `announcements_showPopup_status_publishedAt_priority_idx` ON `announcements`(`showPopup`, `status`, `publishedAt`, `priority`);

-- CreateIndex
CREATE INDEX `admission_enquiries_metadataExpiresAt_idx` ON `admission_enquiries`(`metadataExpiresAt`);

-- AddForeignKey
ALTER TABLE `announcements` ADD CONSTRAINT `announcements_imageId_fkey` FOREIGN KEY (`imageId`) REFERENCES `media`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `email_messages` ADD CONSTRAINT `email_messages_attachmentId_fkey` FOREIGN KEY (`attachmentId`) REFERENCES `media`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
