# Quick Fix for Prisma OpenSSL Issue

## Option 1: Install OpenSSL 1.1 (Recommended)

Run this command in your terminal:

```bash
sudo apt-get update && sudo apt-get install -y libssl1.1
```

Then regenerate Prisma:

```bash
rm -rf node_modules/.prisma
npx prisma generate
npx prisma db push
```

## Option 2: Use the Fix Script

```bash
sudo bash fix-prisma.sh
```

This script will:

1. Install OpenSSL 1.1 compatibility libraries
2. Regenerate Prisma client
3. Test the database connection

## Option 3: Manual SQL (Works Immediately, No Fix Needed)

If you can't install libssl1.1, use the manual SQL approach:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Open `prisma/init.sql` from your project
3. Copy the entire SQL script
4. Paste and click **Run** in Supabase SQL Editor

This creates all tables without needing Prisma migrations!

## Why This Happens

- Your system has OpenSSL 3.0
- Prisma 5.22.0's binary engine needs OpenSSL 1.1
- Installing `libssl1.1` provides the compatibility layer

## After Fixing

Once Prisma works, you can:

```bash
# Start the development server
npm run dev

# Create your first admin user at:
# http://localhost:3000/auth/signup
```
