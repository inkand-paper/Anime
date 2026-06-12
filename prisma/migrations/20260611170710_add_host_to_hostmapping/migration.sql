/*
  Warnings:

  - You are about to drop the `Anime` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `hostName` on the `HostMapping` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `HostMapping` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `HostMapping` table. All the data in the column will be lost.
  - You are about to drop the column `referredBy` on the `User` table. All the data in the column will be lost.
  - Added the required column `embedUrl` to the `HostMapping` table without a default value. This is not possible if the table is not empty.
  - Added the required column `host` to the `HostMapping` table without a default value. This is not possible if the table is not empty.
  - Made the column `email` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `referralCode` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Anime_titleEn_idx";

-- DropIndex
DROP INDEX "Profile_userId_idx";

-- DropIndex
DROP INDEX "Subscription_externalId_idx";

-- DropIndex
DROP INDEX "Subscription_userId_idx";

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN "cancelledAt" DATETIME;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Anime";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "WatchRoom" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inviteCode" TEXT NOT NULL,
    "animeId" TEXT NOT NULL,
    "episode" INTEGER NOT NULL DEFAULT 1,
    "currentTime" REAL NOT NULL DEFAULT 0,
    "isPlaying" BOOLEAN NOT NULL DEFAULT false,
    "hostId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WatchRoom_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WatchRoomMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WatchRoomMember_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "WatchRoom" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WatchRoomMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RateLimit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "resetAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_HostMapping" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "animeId" TEXT NOT NULL,
    "episode" INTEGER NOT NULL,
    "host" TEXT NOT NULL,
    "embedUrl" TEXT NOT NULL,
    "embedType" TEXT NOT NULL DEFAULT 'iframe',
    "dubbed" BOOLEAN NOT NULL DEFAULT true,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_HostMapping" ("animeId", "createdAt", "episode", "id", "updatedAt") SELECT "animeId", "createdAt", "episode", "id", "updatedAt" FROM "HostMapping";
DROP TABLE "HostMapping";
ALTER TABLE "new_HostMapping" RENAME TO "HostMapping";
CREATE INDEX "HostMapping_animeId_episode_idx" ON "HostMapping"("animeId", "episode");
CREATE UNIQUE INDEX "HostMapping_animeId_episode_host_key" ON "HostMapping"("animeId", "episode", "host");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "password" TEXT,
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "referralCode" TEXT NOT NULL,
    "referredById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("createdAt", "email", "emailVerified", "id", "image", "name", "password", "referralCode", "role", "updatedAt") SELECT "createdAt", "email", "emailVerified", "id", "image", "name", "password", "referralCode", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_referralCode_idx" ON "User"("referralCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "WatchRoom_inviteCode_key" ON "WatchRoom"("inviteCode");

-- CreateIndex
CREATE INDEX "WatchRoom_inviteCode_idx" ON "WatchRoom"("inviteCode");

-- CreateIndex
CREATE INDEX "WatchRoomMember_roomId_idx" ON "WatchRoomMember"("roomId");

-- CreateIndex
CREATE UNIQUE INDEX "WatchRoomMember_roomId_userId_key" ON "WatchRoomMember"("roomId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "RateLimit_key_key" ON "RateLimit"("key");

-- CreateIndex
CREATE INDEX "RateLimit_key_idx" ON "RateLimit"("key");

-- CreateIndex
CREATE INDEX "RateLimit_resetAt_idx" ON "RateLimit"("resetAt");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");
