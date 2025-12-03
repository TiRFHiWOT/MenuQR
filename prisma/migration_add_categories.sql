-- Migration: Add Category table and categoryId to MenuItem
-- Run this in Supabase SQL Editor if Category table doesn't exist

-- Create Category table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- Add categoryId column to MenuItem (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'MenuItem' AND column_name = 'categoryId'
    ) THEN
        ALTER TABLE "MenuItem" ADD COLUMN "categoryId" TEXT;
    END IF;
END $$;

-- Add foreign key constraints (if they don't exist)
DO $$ 
BEGIN
    -- Category to Shop foreign key
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Category_shopId_fkey'
    ) THEN
        ALTER TABLE "Category" 
        ADD CONSTRAINT "Category_shopId_fkey" 
        FOREIGN KEY ("shopId") REFERENCES "Shop"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- MenuItem to Category foreign key
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'MenuItem_categoryId_fkey'
    ) THEN
        ALTER TABLE "MenuItem" 
        ADD CONSTRAINT "MenuItem_categoryId_fkey" 
        FOREIGN KEY ("categoryId") REFERENCES "Category"("id") 
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

