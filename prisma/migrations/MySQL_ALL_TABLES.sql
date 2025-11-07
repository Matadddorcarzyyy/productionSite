-- MySQL версия - все таблицы для базы данных

-- Создать таблицу users
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50),
  `role` ENUM('PATIENT', 'CLINIC_ADMIN', 'DOCTOR', 'SUPER_ADMIN') NOT NULL DEFAULT 'PATIENT',
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_key` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Создать таблицу patients
CREATE TABLE IF NOT EXISTS `patients` (
  `id` VARCHAR(36) NOT NULL,
  `userId` VARCHAR(36) NOT NULL,
  `firstName` VARCHAR(255) NOT NULL,
  `lastName` VARCHAR(255) NOT NULL,
  `birthDate` DATETIME(3),
  `notes` TEXT,
  PRIMARY KEY (`id`),
  UNIQUE KEY `patients_userId_key` (`userId`),
  CONSTRAINT `patients_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Создать таблицу clinics
CREATE TABLE IF NOT EXISTS `clinics` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `address` VARCHAR(500) NOT NULL,
  `latitude` DOUBLE NOT NULL,
  `longitude` DOUBLE NOT NULL,
  `phone` VARCHAR(50) NOT NULL,
  `email` VARCHAR(255),
  `logoUrl` VARCHAR(500),
  `isVerified` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Создать таблицу clinic_admins
CREATE TABLE IF NOT EXISTS `clinic_admins` (
  `id` VARCHAR(36) NOT NULL,
  `userId` VARCHAR(36) NOT NULL,
  `clinicId` VARCHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `clinic_admins_userId_clinicId_key` (`userId`, `clinicId`),
  CONSTRAINT `clinic_admins_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `clinic_admins_clinicId_fkey` FOREIGN KEY (`clinicId`) REFERENCES `clinics` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Создать таблицу specializations
CREATE TABLE IF NOT EXISTS `specializations` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `icon` VARCHAR(50),
  PRIMARY KEY (`id`),
  UNIQUE KEY `specializations_name_key` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Создать таблицу doctors
CREATE TABLE IF NOT EXISTS `doctors` (
  `id` VARCHAR(36) NOT NULL,
  `userId` VARCHAR(36) NOT NULL,
  `clinicId` VARCHAR(36) NOT NULL,
  `firstName` VARCHAR(255) NOT NULL,
  `lastName` VARCHAR(255) NOT NULL,
  `photoUrl` VARCHAR(500),
  `bio` TEXT,
  `rating` DOUBLE NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `doctors_userId_key` (`userId`),
  CONSTRAINT `doctors_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `doctors_clinicId_fkey` FOREIGN KEY (`clinicId`) REFERENCES `clinics` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Создать таблицу doctor_specializations
CREATE TABLE IF NOT EXISTS `doctor_specializations` (
  `id` VARCHAR(36) NOT NULL,
  `doctorId` VARCHAR(36) NOT NULL,
  `specializationId` VARCHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `doctor_specializations_doctorId_specializationId_key` (`doctorId`, `specializationId`),
  CONSTRAINT `doctor_specializations_doctorId_fkey` FOREIGN KEY (`doctorId`) REFERENCES `doctors` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `doctor_specializations_specializationId_fkey` FOREIGN KEY (`specializationId`) REFERENCES `specializations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Создать таблицу schedules
CREATE TABLE IF NOT EXISTS `schedules` (
  `id` VARCHAR(36) NOT NULL,
  `doctorId` VARCHAR(36) NOT NULL,
  `dayOfWeek` INT NOT NULL,
  `startTime` VARCHAR(10) NOT NULL,
  `endTime` VARCHAR(10) NOT NULL,
  `breakStart` VARCHAR(10),
  `breakEnd` VARCHAR(10),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `schedules_doctorId_fkey` FOREIGN KEY (`doctorId`) REFERENCES `doctors` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Создать таблицу availabilities
CREATE TABLE IF NOT EXISTS `availabilities` (
  `id` VARCHAR(36) NOT NULL,
  `doctorId` VARCHAR(36) NOT NULL,
  `date` DATETIME(3) NOT NULL,
  `startTime` VARCHAR(10) NOT NULL,
  `endTime` VARCHAR(10) NOT NULL,
  `breakStart` VARCHAR(10),
  `breakEnd` VARCHAR(10),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `availabilities_doctorId_date_key` (`doctorId`, `date`),
  CONSTRAINT `availabilities_doctorId_fkey` FOREIGN KEY (`doctorId`) REFERENCES `doctors` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Создать таблицу appointments
CREATE TABLE IF NOT EXISTS `appointments` (
  `id` VARCHAR(36) NOT NULL,
  `patientId` VARCHAR(36) NOT NULL,
  `doctorId` VARCHAR(36) NOT NULL,
  `clinicId` VARCHAR(36) NOT NULL,
  `dateTime` DATETIME(3) NOT NULL,
  `duration` INT NOT NULL DEFAULT 30,
  `status` ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW') NOT NULL DEFAULT 'PENDING',
  `notes` TEXT,
  `adminNotes` TEXT,
  `smsSent` BOOLEAN NOT NULL DEFAULT false,
  `smsCode` VARCHAR(10),
  `confirmed` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `appointments_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `patients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `appointments_doctorId_fkey` FOREIGN KEY (`doctorId`) REFERENCES `doctors` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `appointments_clinicId_fkey` FOREIGN KEY (`clinicId`) REFERENCES `clinics` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Создать таблицу reviews
CREATE TABLE IF NOT EXISTS `reviews` (
  `id` VARCHAR(36) NOT NULL,
  `patientId` VARCHAR(36) NOT NULL,
  `doctorId` VARCHAR(36) NOT NULL,
  `clinicId` VARCHAR(36) NOT NULL,
  `rating` INT NOT NULL,
  `comment` TEXT,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `reviews_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `patients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `reviews_doctorId_fkey` FOREIGN KEY (`doctorId`) REFERENCES `doctors` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `reviews_clinicId_fkey` FOREIGN KEY (`clinicId`) REFERENCES `clinics` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Создать таблицу site_content
CREATE TABLE IF NOT EXISTS `site_content` (
  `id` VARCHAR(36) NOT NULL,
  `key` VARCHAR(255) NOT NULL,
  `language` VARCHAR(10) NOT NULL DEFAULT 'ro',
  `value` TEXT NOT NULL,
  `description` TEXT,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `site_content_key_language_key` (`key`, `language`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

