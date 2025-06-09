/*
  Warnings:

  - You are about to drop the column `deviceType` on the `servicerequest` table. All the data in the column will be lost.
  - You are about to drop the column `problem` on the `servicerequest` table. All the data in the column will be lost.
  - You are about to alter the column `status` on the `servicerequest` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(2))` to `Enum(EnumId(2))`.
  - You are about to drop the column `note` on the `statusupdate` table. All the data in the column will be lost.
  - The values [PENDING] on the enum `StatusUpdate_status` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `email` to the `ServiceRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `ServiceRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `ServiceRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `problemCategory` to the `ServiceRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `problemDescription` to the `ServiceRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `StatusUpdate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedBy` to the `StatusUpdate` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `servicerequest` DROP FOREIGN KEY `ServiceRequest_userId_fkey`;

-- DropIndex
DROP INDEX `ServiceRequest_userId_fkey` ON `servicerequest`;

-- AlterTable
ALTER TABLE `servicerequest` DROP COLUMN `deviceType`,
    DROP COLUMN `problem`,
    ADD COLUMN `additionalNotes` TEXT NULL,
    ADD COLUMN `email` VARCHAR(191) NOT NULL,
    ADD COLUMN `name` VARCHAR(191) NOT NULL,
    ADD COLUMN `phone` VARCHAR(191) NOT NULL,
    ADD COLUMN `problemCategory` VARCHAR(191) NOT NULL,
    ADD COLUMN `problemDescription` TEXT NOT NULL,
    ADD COLUMN `purchaseDate` DATETIME(3) NULL,
    ADD COLUMN `serialNumber` VARCHAR(191) NULL,
    MODIFY `userId` VARCHAR(191) NULL,
    MODIFY `status` ENUM('RECEIVED', 'APPROVED', 'IN_PROGRESS', 'WAITING_PART', 'COMPLETED', 'DELIVERED', 'REJECTED') NOT NULL DEFAULT 'RECEIVED';

-- AlterTable
ALTER TABLE `statusupdate` DROP COLUMN `note`,
    ADD COLUMN `description` TEXT NOT NULL,
    ADD COLUMN `updatedBy` VARCHAR(191) NOT NULL,
    MODIFY `status` ENUM('RECEIVED', 'APPROVED', 'IN_PROGRESS', 'WAITING_PART', 'COMPLETED', 'DELIVERED', 'REJECTED') NOT NULL;

-- AddForeignKey
ALTER TABLE `ServiceRequest` ADD CONSTRAINT `ServiceRequest_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
