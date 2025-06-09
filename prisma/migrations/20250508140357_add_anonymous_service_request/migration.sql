/*
  Warnings:

  - You are about to drop the column `additionalNotes` on the `servicerequest` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `servicerequest` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `servicerequest` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `servicerequest` table. All the data in the column will be lost.
  - You are about to drop the column `problemCategory` on the `servicerequest` table. All the data in the column will be lost.
  - You are about to drop the column `problemDescription` on the `servicerequest` table. All the data in the column will be lost.
  - You are about to drop the column `purchaseDate` on the `servicerequest` table. All the data in the column will be lost.
  - You are about to drop the column `serialNumber` on the `servicerequest` table. All the data in the column will be lost.
  - You are about to alter the column `status` on the `servicerequest` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(2))` to `Enum(EnumId(3))`.
  - You are about to drop the column `description` on the `statusupdate` table. All the data in the column will be lost.
  - You are about to drop the column `updatedBy` on the `statusupdate` table. All the data in the column will be lost.
  - The values [RECEIVED,WAITING_PART,DELIVERED] on the enum `AnonymousServiceRequest_status` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `deviceType` to the `ServiceRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `problem` to the `ServiceRequest` table without a default value. This is not possible if the table is not empty.
  - Made the column `userId` on table `servicerequest` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `servicerequest` DROP FOREIGN KEY `ServiceRequest_userId_fkey`;

-- DropIndex
DROP INDEX `ServiceRequest_userId_fkey` ON `servicerequest`;

-- AlterTable
ALTER TABLE `servicerequest` DROP COLUMN `additionalNotes`,
    DROP COLUMN `email`,
    DROP COLUMN `name`,
    DROP COLUMN `phone`,
    DROP COLUMN `problemCategory`,
    DROP COLUMN `problemDescription`,
    DROP COLUMN `purchaseDate`,
    DROP COLUMN `serialNumber`,
    ADD COLUMN `deviceType` VARCHAR(191) NOT NULL,
    ADD COLUMN `problem` TEXT NOT NULL,
    MODIFY `userId` VARCHAR(191) NOT NULL,
    MODIFY `status` ENUM('PENDING', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `statusupdate` DROP COLUMN `description`,
    DROP COLUMN `updatedBy`,
    ADD COLUMN `note` TEXT NULL,
    MODIFY `status` ENUM('PENDING', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED') NOT NULL;

-- CreateTable
CREATE TABLE `AnonymousServiceRequest` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `deviceType` VARCHAR(191) NOT NULL,
    `brand` VARCHAR(191) NOT NULL,
    `model` VARCHAR(191) NOT NULL,
    `serialNumber` VARCHAR(191) NULL,
    `purchaseDate` DATETIME(3) NULL,
    `problemCategory` VARCHAR(191) NOT NULL,
    `problem` TEXT NOT NULL,
    `additionalNotes` TEXT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `trackingCode` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AnonymousServiceRequest_trackingCode_key`(`trackingCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ServiceRequest` ADD CONSTRAINT `ServiceRequest_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
