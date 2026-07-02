/*
  Warnings:

  - You are about to drop the column `desc` on the `Service` table. All the data in the column will be lost.
  - You are about to drop the column `points` on the `Service` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Service` table. All the data in the column will be lost.
  - Added the required column `intro` to the `Service` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Service` table without a default value. This is not possible if the table is not empty.
  - Added the required column `navLabel` to the `Service` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shortDescription` to the `Service` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `Service` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "ServiceOffering" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "keywords" TEXT NOT NULL DEFAULT '[]',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Service" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "navLabel" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "intro" TEXT NOT NULL,
    "keywords" TEXT NOT NULL DEFAULT '[]',
    "scope" TEXT NOT NULL DEFAULT '[]',
    "deliverables" TEXT NOT NULL DEFAULT '[]',
    "sustainability" TEXT NOT NULL DEFAULT '',
    "relatedSlugs" TEXT NOT NULL DEFAULT '[]',
    "statValue" TEXT NOT NULL DEFAULT '',
    "statLabel" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Service" ("code", "createdAt", "id", "order", "statLabel", "statValue", "updatedAt") SELECT "code", "createdAt", "id", "order", "statLabel", "statValue", "updatedAt" FROM "Service";
DROP TABLE "Service";
ALTER TABLE "new_Service" RENAME TO "Service";
CREATE UNIQUE INDEX "Service_slug_key" ON "Service"("slug");
CREATE UNIQUE INDEX "Service_code_key" ON "Service"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ServiceOffering_slug_key" ON "ServiceOffering"("slug");
