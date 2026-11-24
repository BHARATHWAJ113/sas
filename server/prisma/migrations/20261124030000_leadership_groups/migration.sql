CREATE TABLE `leadership_groups` (
  `id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(160) NOT NULL,
  `titleTa` VARCHAR(160) NULL,
  `titleHi` VARCHAR(160) NULL,
  `sortOrder` INTEGER NOT NULL DEFAULT 0,
  `status` ENUM('DRAFT','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `leadership_groups_status_sortOrder_idx`(`status`, `sortOrder`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `leadership_groups` (`id`, `title`, `titleTa`, `titleHi`, `sortOrder`, `status`, `updatedAt`) VALUES
  ('leadership-foundations', 'Foundations & Early Leadership', 'அடித்தளம் மற்றும் தொடக்ககால தலைமை', 'नींव और आरंभिक नेतृत्व', 10, 'PUBLISHED', CURRENT_TIMESTAMP(3)),
  ('leadership-growth', 'Growth & Contemporary Leadership', 'வளர்ச்சி மற்றும் தற்கால தலைமை', 'विकास और समकालीन नेतृत्व', 20, 'PUBLISHED', CURRENT_TIMESTAMP(3));

ALTER TABLE `leader_profiles` ADD COLUMN `groupId` VARCHAR(191) NULL;

UPDATE `leader_profiles`
SET `groupId` = CASE WHEN `sortOrder` <= 40 THEN 'leadership-foundations' ELSE 'leadership-growth' END;

CREATE INDEX `leader_profiles_groupId_status_sortOrder_idx` ON `leader_profiles`(`groupId`, `status`, `sortOrder`);

ALTER TABLE `leader_profiles`
  ADD CONSTRAINT `leader_profiles_groupId_fkey`
  FOREIGN KEY (`groupId`) REFERENCES `leadership_groups`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
