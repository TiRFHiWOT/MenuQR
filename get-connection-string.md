# How to Get the Correct Connection String

## Step-by-Step Instructions

1. **Open Supabase Dashboard:**
   - Go to: https://supabase.com/dashboard/project/oiuxuhykupjymytokqps/settings/database

2. **Find Connection String:**
   - Scroll down to "Connection string" section
   - You'll see different connection methods

3. **For Direct Connection (Port 5432):**
   - Look for "URI" format
   - It should show: `postgresql://postgres:[YOUR-PASSWORD]@db.oiuxuhykupjymytokqps.supabase.co:5432/postgres`
   - Copy this and replace `[YOUR-PASSWORD]` with: `8D20vCMybvh1tjL9`
   - Add `?sslmode=require` at the end

4. **For Connection Pooler (Port 6543) - RECOMMENDED:**
   - Look for "Connection pooling" section
   - Find "Transaction" mode
   - Copy the connection string shown there
   - It should already have the correct format

5. **Update Your Files:**
   - Open `.env` and `.env.local`
   - Replace the `DATABASE_URL` line with the connection string you copied
   - Make sure to keep `?sslmode=require` at the end

6. **Test:**
   ```bash
   node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$connect().then(() => console.log('✅ Works!')).catch(e => console.log('❌ Error:', e.message));"
   ```

## What to Look For

The connection string should look like one of these:

**Direct:**
```
postgresql://postgres:8D20vCMybvh1tjL9@db.oiuxuhykupjymytokqps.supabase.co:5432/postgres?sslmode=require
```

**Pooler (Transaction mode):**
```
postgresql://postgres.oiuxuhykupjymytokqps:8D20vCMybvh1tjL9@aws-0-us-west-1.pooler.supabase.com:6543/postgres?sslmode=require
```

**Important:** The exact format might be slightly different. Always copy it directly from Supabase dashboard!
