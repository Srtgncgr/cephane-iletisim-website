/*
  Warnings:

  - You are about to drop the column `shippingAddress` on the `anonymousservicerequest` table. All the data in the column will be lost.
  - You are about to drop the column `shippingAddress` on the `servicerequest` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `anonymousservicerequest` DROP COLUMN `shippingAddress`,
    ADD COLUMN `address` TEXT NULL;

-- AlterTable
ALTER TABLE `servicerequest` DROP COLUMN `shippingAddress`;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `address` TEXT NULL;
