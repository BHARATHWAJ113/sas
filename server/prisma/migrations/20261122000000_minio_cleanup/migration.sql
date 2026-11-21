CREATE TABLE `storage_deletions` (
  `filename` VARCHAR(255) NOT NULL,
  `hasVariants` BOOLEAN NOT NULL DEFAULT false,
  `notBefore` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `storage_deletions_notBefore_idx` (`notBefore`),
  PRIMARY KEY (`filename`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
