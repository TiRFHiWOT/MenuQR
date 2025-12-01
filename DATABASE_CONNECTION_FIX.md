# Database Connection Issue - How to Fix

## The Problem

The error "Can't reach database server" means Prisma can't connect to your Supabase database.

## Solution: Get the Correct Connection String

1. **Go to Supabase Dashboard:**

   - Visit: https://supabase.com/dashboard/project/oiuxuhykupjymytokqps/settings/database

2. **Get the Connection String:**

   - Scroll to "Connection string" section
   - Select "URI" format (not "JDBC" or "Golang")
   - Copy the connection string
   - It should look like:
     ```
     postgresql://postgres.oiuxuhykupjymytokqps:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
     ```
     OR
     ```
     postgresql://postgres:[YOUR-PASSWORD]@db.oiuxuhykupjymytokqps.supabase.co:5432/postgres
     ```

3. **Update Your .env Files:**

   Edit both `.env` and `.env.local`:

   ```bash
   # Replace the DATABASE_URL line with the connection string from Supabase
   DATABASE_URL="postgresql://postgres:8D20vCMybvh1tjL9@[HOST]:[PORT]/postgres?sslmode=require"
   ```

   Make sure to:

   - Replace `[HOST]` with the host from Supabase
   - Replace `[PORT]` with the port (usually 5432 or 6543)
   - Keep your password: `8D20vCMybvh1tjL9`
   - Keep `?sslmode=require` at the end

4. **Test the Connection:**

   ```bash
   node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$connect().then(() => console.log('✅ Connected!')).catch(e => console.log('❌ Error:', e.message));"
   ```

5. **Restart Your Dev Server:**
   - Press `Ctrl+C` to stop
   - Run `npm run dev` again

## Alternative: Use Transaction Mode (Pooler)

If direct connection doesn't work, try the transaction mode pooler:

1. In Supabase Dashboard > Database Settings
2. Look for "Connection pooling" section
3. Use the "Transaction" mode connection string
4. It will use port 6543 instead of 5432

## Common Issues

- **"Network is unreachable"**: Your network might be blocking the connection
- **"Tenant or user not found"**: Wrong username format in connection string
- **"Password authentication failed"**: Wrong password
- **"Connection timeout"**: Firewall or network issue

## Quick Test

After updating, test with:

```bash
./fix-database-connection.sh
```

This will test both connection methods and tell you which one works.
