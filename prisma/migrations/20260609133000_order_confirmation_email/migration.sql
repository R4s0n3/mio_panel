-- AlterTable
ALTER TABLE `Order`
    ADD COLUMN `customerEmail` VARCHAR(191) NULL,
    ADD COLUMN `confirmationEmailSentAt` DATETIME(3) NULL;
