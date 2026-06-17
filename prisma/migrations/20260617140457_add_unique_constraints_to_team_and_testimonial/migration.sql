-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Service" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "desc" TEXT NOT NULL,
    "points" TEXT NOT NULL DEFAULT '',
    "statValue" TEXT NOT NULL DEFAULT '',
    "statLabel" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Service" ("code", "createdAt", "desc", "id", "order", "points", "statLabel", "statValue", "title", "updatedAt") SELECT "code", "createdAt", "desc", "id", "order", "points", "statLabel", "statValue", "title", "updatedAt" FROM "Service";
DROP TABLE "Service";
ALTER TABLE "new_Service" RENAME TO "Service";
CREATE UNIQUE INDEX "Service_code_key" ON "Service"("code");
CREATE TABLE "new_Team" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "discipline" TEXT NOT NULL,
    "bio" TEXT NOT NULL DEFAULT '',
    "photo" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Team" ("bio", "createdAt", "discipline", "id", "name", "order", "photo", "role", "updatedAt") SELECT "bio", "createdAt", "discipline", "id", "name", "order", "photo", "role", "updatedAt" FROM "Team";
DROP TABLE "Team";
ALTER TABLE "new_Team" RENAME TO "Team";
CREATE UNIQUE INDEX "Team_name_key" ON "Team"("name");
CREATE TABLE "new_Testimonial" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quote" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "company" TEXT,
    "logo" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Testimonial" ("author", "company", "createdAt", "id", "logo", "order", "quote", "updatedAt") SELECT "author", "company", "createdAt", "id", "logo", "order", "quote", "updatedAt" FROM "Testimonial";
DROP TABLE "Testimonial";
ALTER TABLE "new_Testimonial" RENAME TO "Testimonial";
CREATE UNIQUE INDEX "Testimonial_author_key" ON "Testimonial"("author");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
