/*
  Warnings:

  - You are about to drop the column `dubbed` on the `HostMapping` table. All the data in the column will be lost.
  - You are about to drop the column `embedUrl` on the `HostMapping` table. All the data in the column will be lost.
  - You are about to drop the column `host` on the `HostMapping` table. All the data in the column will be lost.
  - Added the required column `hostName` to the `HostMapping` table without a default value. This is not possible if the table is not empty.
  - Added the required column `url` to the `HostMapping` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Anime" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titleEn" TEXT NOT NULL,
    "titleJp" TEXT,
    "titleCn" TEXT,
    "description" TEXT,
    "image" TEXT,
    "banner" TEXT,
    "year" TEXT,
    "rating" REAL,
    "episodes" INTEGER,
    "tags" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_HostMapping" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "animeId" TEXT NOT NULL,
    "episode" INTEGER NOT NULL,
    "hostName" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'iframe',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HostMapping_animeId_fkey" FOREIGN KEY ("animeId") REFERENCES "Anime" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_HostMapping" ("animeId", "createdAt", "episode", "id", "updatedAt") SELECT "animeId", "createdAt", "episode", "id", "updatedAt" FROM "HostMapping";
DROP TABLE "HostMapping";
ALTER TABLE "new_HostMapping" RENAME TO "HostMapping";
CREATE INDEX "HostMapping_animeId_episode_idx" ON "HostMapping"("animeId", "episode");
CREATE UNIQUE INDEX "HostMapping_animeId_episode_hostName_key" ON "HostMapping"("animeId", "episode", "hostName");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Anime_titleEn_idx" ON "Anime"("titleEn");
