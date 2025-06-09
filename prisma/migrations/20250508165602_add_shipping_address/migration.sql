-- AlterTable
ALTER TABLE `anonymousservicerequest` ADD COLUMN `shippingAddress` TEXT NULL;

-- AlterTable
ALTER TABLE `servicerequest` ADD COLUMN `shippingAddress` TEXT NULL;
