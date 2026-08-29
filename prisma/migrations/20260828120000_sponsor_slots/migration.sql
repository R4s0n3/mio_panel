CREATE TABLE `SponsorSlot` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `basePrice` INTEGER NOT NULL,
  `minIncrement` INTEGER NOT NULL,
  `enabled` BOOLEAN NOT NULL DEFAULT true,
  `sortOrder` INTEGER NOT NULL DEFAULT 0,
  `currentBidId` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `SponsorSlot_currentBidId_key`(`currentBidId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `SponsorBid` (
  `id` VARCHAR(191) NOT NULL,
  `slotId` VARCHAR(191) NOT NULL,
  `advertiserName` VARCHAR(191) NOT NULL,
  `advertiserEmail` VARCHAR(191) NOT NULL,
  `websiteUrl` VARCHAR(191) NOT NULL,
  `logoUrl` VARCHAR(191) NOT NULL,
  `amount` INTEGER NOT NULL,
  `status` ENUM('PENDING', 'ACTIVE', 'OUTBID', 'CANCELLED', 'REMOVED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
  `stripeSessionId` VARCHAR(191) NULL,
  `stripePaymentIntentId` VARCHAR(191) NULL,
  `paidAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `SponsorBid_stripeSessionId_key`(`stripeSessionId`),
  UNIQUE INDEX `SponsorBid_stripePaymentIntentId_key`(`stripePaymentIntentId`),
  INDEX `SponsorBid_slotId_status_idx`(`slotId`, `status`),
  INDEX `SponsorBid_createdAt_idx`(`createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `SponsorBid` ADD CONSTRAINT `SponsorBid_slotId_fkey`
  FOREIGN KEY (`slotId`) REFERENCES `SponsorSlot`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `SponsorSlot` ADD CONSTRAINT `SponsorSlot_currentBidId_fkey`
  FOREIGN KEY (`currentBidId`) REFERENCES `SponsorBid`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO `SponsorSlot`
  (`id`, `name`, `description`, `basePrice`, `minIncrement`, `enabled`, `sortOrder`, `createdAt`, `updatedAt`)
VALUES
  ('sponsor_home_hero', 'Main character', 'The loudest logo spot on the page.', 5000, 2500, true, 10, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('sponsor_home_signal', 'Signal boost', 'A crisp spot for a brand worth noticing.', 3000, 1500, true, 20, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('sponsor_home_indie', 'Indie corner', 'Small spot, big supporter energy.', 2000, 1000, true, 30, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
