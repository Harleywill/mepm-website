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
    "published" BOOLEAN NOT NULL DEFAULT true,
    "icon" TEXT NOT NULL DEFAULT 'Zap',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Service" ("code", "createdAt", "deliverables", "id", "intro", "keywords", "name", "navLabel", "order", "published", "relatedSlugs", "scope", "shortDescription", "slug", "statLabel", "statValue", "sustainability", "updatedAt") SELECT "code", "createdAt", "deliverables", "id", "intro", "keywords", "name", "navLabel", "order", "published", "relatedSlugs", "scope", "shortDescription", "slug", "statLabel", "statValue", "sustainability", "updatedAt" FROM "Service";
DROP TABLE "Service";
ALTER TABLE "new_Service" RENAME TO "Service";
CREATE UNIQUE INDEX "Service_slug_key" ON "Service"("slug");
CREATE UNIQUE INDEX "Service_code_key" ON "Service"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
