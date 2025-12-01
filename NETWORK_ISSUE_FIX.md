# Network Connection Issue - Solutions

## The Problem

The error "Network is unreachable" means your system cannot connect to Supabase's database server. This is usually a network/firewall issue, not a password or configuration problem.

## Solutions

### Solution 1: Use Supabase Connection Pooler (Recommended)

Supabase provides a connection pooler that's more reliable for external connections:

1. **Go to Supabase Dashboard:**

   - https://supabase.com/dashboard/project/oiuxuhykupjymytokqps/settings/database

2. **Find "Connection Pooling" section:**

   - Look for "Connection string" with "Transaction" or "Session" mode
   - Copy the connection string

3. **Update your `.env` and `.env.local`:**
   - Replace `DATABASE_URL` with the pooler connection string
   - It should use port `6543` instead of `5432`
   - Format: `postgresql://postgres.oiuxuhykupjymytokqps:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres?sslmode=require`

### Solution 2: Check Network/Firewall

If you're behind a firewall or VPN:

1. **Check if port 5432 is blocked:**

   ```bash
   telnet db.oiuxuhykupjymytokqps.supabase.co 5432
   ```

2. **Try using a VPN** if your network blocks database connections

3. **Check Supabase IP allowlist:**
   - Go to Supabase Dashboard > Settings > Database
   - Check if there's an IP allowlist that needs your IP added

### Solution 3: Use Supabase's REST API (Temporary Workaround)

If direct database connection doesn't work, you could use Supabase's REST API instead of Prisma, but this requires significant code changes.

### Solution 4: Check Supabase Project Status

1. Go to: https://supabase.com/dashboard/project/oiuxuhykupjymytokqps
2. Make sure the project is **Active** (not paused)
3. Check if there are any warnings or errors

## Quick Test

After updating to use the pooler, test with:

```bash
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$connect().then(() => console.log('✅ Connected!')).catch(e => console.log('❌ Error:', e.message));"
```

## Most Likely Solution

**Use the Connection Pooler** - This is the most common solution for "Network is unreachable" errors with Supabase. The pooler is specifically designed for external connections and is more reliable than direct database connections.
