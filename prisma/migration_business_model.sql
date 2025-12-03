-- Migration: Convert Shop model to Business model with Branches
-- This migration transforms the existing Shop-based schema to Business-Branch model

-- Step 1: Create Business table (based on Shop)
CREATE TABLE IF NOT EXISTS "Business" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ownerId" TEXT NOT NULL,
    "qrCodeUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- Step 2: Create Branch table
CREATE TABLE IF NOT EXISTS "Branch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "businessId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- Step 3: Create QRScan table for analytics
CREATE TABLE IF NOT EXISTS "QRScan" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    CONSTRAINT "QRScan_pkey" PRIMARY KEY ("id")
);

-- Step 4: Migrate Shop data to Business
INSERT INTO "Business" ("id", "name", "description", "ownerId", "createdAt", "updatedAt")
SELECT 
    "id",
    "name",
    "location" as "description",
    "ownerId",
    "createdAt",
    "updatedAt"
FROM "Shop"
ON CONFLICT DO NOTHING;

-- Step 5: Create branches from shop locations (if location exists, create a branch)
INSERT INTO "Branch" ("id", "name", "address", "businessId", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text as "id",
    s."name" || ' - Main Branch' as "name",
    s."location" as "address",
    s."id" as "businessId",
    s."createdAt",
    s."updatedAt"
FROM "Shop" s
WHERE s."location" IS NOT NULL AND s."location" != '';

-- Step 6: Update Category table to use businessId
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "businessId" TEXT;
UPDATE "Category" c SET "businessId" = c."shopId" WHERE c."businessId" IS NULL;
ALTER TABLE "Category" DROP CONSTRAINT IF EXISTS "Category_shopId_fkey";
ALTER TABLE "Category" ADD CONSTRAINT "Category_businessId_fkey" 
    FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Category" DROP COLUMN IF EXISTS "shopId";

-- Step 7: Update MenuItem table to use businessId
ALTER TABLE "MenuItem" ADD COLUMN IF NOT EXISTS "businessId" TEXT;
UPDATE "MenuItem" m SET "businessId" = m."shopId" WHERE m."businessId" IS NULL;
ALTER TABLE "MenuItem" DROP CONSTRAINT IF EXISTS "MenuItem_shopId_fkey";
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_businessId_fkey" 
    FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MenuItem" DROP COLUMN IF EXISTS "shopId";

-- Step 8: Update User table relation
ALTER TABLE "Business" ADD CONSTRAINT "Business_ownerId_fkey" 
    FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 9: Add foreign keys for Branch and QRScan
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_businessId_fkey" 
    FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "QRScan" ADD CONSTRAINT "QRScan_businessId_fkey" 
    FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 10: Drop Table table (no longer needed)
DROP TABLE IF EXISTS "Table" CASCADE;

-- Step 11: Drop Shop table (replaced by Business)
DROP TABLE IF EXISTS "Shop" CASCADE;

-- Step 12: Add indexes for better performance
CREATE INDEX IF NOT EXISTS "Business_ownerId_idx" ON "Business"("ownerId");
CREATE INDEX IF NOT EXISTS "Branch_businessId_idx" ON "Branch"("businessId");
CREATE INDEX IF NOT EXISTS "QRScan_businessId_idx" ON "QRScan"("businessId");
CREATE INDEX IF NOT EXISTS "QRScan_scannedAt_idx" ON "QRScan"("scannedAt");
CREATE INDEX IF NOT EXISTS "Category_businessId_idx" ON "Category"("businessId");
CREATE INDEX IF NOT EXISTS "MenuItem_businessId_idx" ON "MenuItem"("businessId");

