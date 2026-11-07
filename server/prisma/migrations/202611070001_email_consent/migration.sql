ALTER TABLE `admission_enquiries`
    ADD COLUMN `requestKey` VARCHAR(64) NULL,
    ADD COLUMN `payloadHash` VARCHAR(64) NULL,
    ADD COLUMN `fingerprint` VARCHAR(64) NULL;
CREATE UNIQUE INDEX `admission_enquiries_requestKey_key` ON `admission_enquiries`(`requestKey`);
CREATE UNIQUE INDEX `admission_enquiries_fingerprint_key` ON `admission_enquiries`(`fingerprint`);

CREATE TABLE `email_messages` (
    `id` VARCHAR(191) NOT NULL,
    `dedupeKey` VARCHAR(64) NOT NULL,
    `payloadHash` VARCHAR(64) NOT NULL,
    `kind` VARCHAR(40) NOT NULL,
    `to` VARCHAR(191) NOT NULL,
    `cc` JSON NOT NULL,
    `subject` VARCHAR(255) NOT NULL,
    `html` LONGTEXT NOT NULL,
    `text` LONGTEXT NOT NULL,
    `replyTo` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'SENDING', 'SENT', 'FAILED', 'PARTIAL', 'UNKNOWN') NOT NULL DEFAULT 'PENDING',
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `nextAttemptAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lockedAt` DATETIME(3) NULL,
    `lockToken` VARCHAR(36) NULL,
    `lastError` VARCHAR(500) NULL,
    `messageId` VARCHAR(255) NULL,
    `accepted` JSON NULL,
    `rejected` JSON NULL,
    `sentAt` DATETIME(3) NULL,
    `expiresAt` DATETIME(3) NULL,
    `userId` VARCHAR(191) NULL,
    `enquiryId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `email_messages_dedupeKey_key`(`dedupeKey`),
    INDEX `email_messages_status_nextAttemptAt_idx`(`status`, `nextAttemptAt`),
    INDEX `email_messages_status_lockedAt_idx`(`status`, `lockedAt`),
    INDEX `email_messages_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `email_messages_to_createdAt_idx`(`to`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `email_messages` ADD CONSTRAINT `email_messages_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `email_messages` ADD CONSTRAINT `email_messages_enquiryId_fkey`
    FOREIGN KEY (`enquiryId`) REFERENCES `admission_enquiries`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE `cookie_consents` (
    `id` VARCHAR(64) NOT NULL,
    `choice` ENUM('ACCEPTED', 'REJECTED') NOT NULL,
    `version` VARCHAR(40) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    INDEX `cookie_consents_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `cookie_consent_events` (
    `id` VARCHAR(191) NOT NULL,
    `consentId` VARCHAR(64) NOT NULL,
    `action` VARCHAR(12) NOT NULL,
    `choice` ENUM('ACCEPTED', 'REJECTED') NOT NULL,
    `version` VARCHAR(40) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `cookie_consent_events_consentId_createdAt_idx`(`consentId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `cookie_consent_events` ADD CONSTRAINT `cookie_consent_events_consentId_fkey`
    FOREIGN KEY (`consentId`) REFERENCES `cookie_consents`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE `rate_limit_buckets` (
    `id` VARCHAR(64) NOT NULL,
    `count` INTEGER NOT NULL DEFAULT 1,
    `expiresAt` DATETIME(3) NOT NULL,
    INDEX `rate_limit_buckets_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
