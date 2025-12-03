# Migration: Add Categories Support

## Issue

You're getting errors like:

- "Could not find the table 'public.Category' in the schema cache"
- "Could not find the 'categoryId' column of 'MenuItem' in the schema cache"

This means the Category table and categoryId column haven't been added to your Supabase database yet.

## Solution: Run Migration SQL

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**

### Step 2: Run the Migration

1. Open the file `prisma/migration_add_categories.sql` in this project
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click **Run** (or press Ctrl+Enter)

This migration will:

- Create the `Category` table (if it doesn't exist)
- Add the `categoryId` column to `MenuItem` table (if it doesn't exist)
- Add the necessary foreign key constraints

### Step 3: Verify

After running the migration, you should be able to:

- Create categories in the owner portal
- Assign categories to menu items
- See categories in the customer menu

## Alternative: Full Schema Reset (If Migration Fails)

If the migration doesn't work, you can run the complete schema:

1. Go to Supabase SQL Editor
2. Copy the entire contents of `prisma/init.sql`
3. Paste and run

**Note:** This will only work if you haven't created any data yet, or if you're okay with losing existing data. The migration approach above is safer as it only adds what's missing.

## After Migration

Once the migration is complete:

1. Refresh your application
2. Try creating a category in the owner portal
3. Try assigning a category to a menu item

Everything should work now! 🎉

