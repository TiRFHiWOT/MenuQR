# How to Get Supabase Connection String

Since Network Restrictions aren't the issue, let's find the connection string another way.

## Method 1: Supabase Dashboard - Project Settings

1. Go to: https://supabase.com/dashboard/project/oiuxuhykupjymytokqps
2. Click on **"Settings"** (gear icon in left sidebar, NOT Database Settings)
3. Click on **"API"** tab
4. Scroll down to find **"Database"** section
5. Look for **"Connection string"** or **"Connection pooling"**
6. Copy the connection string shown there

## Method 2: Supabase Dashboard - Database Settings (Different Section)

1. Go to: https://supabase.com/dashboard/project/oiuxuhykupjymytokqps/settings/database
2. Look for tabs at the top: **"General"**, **"Connection string"**, **"Connection pooling"**
3. Click on **"Connection string"** tab
4. You should see different connection string formats there

## Method 3: Use Connection Pooler (Recommended for External Connections)

The connection pooler is more reliable for external connections. Try this format:

**Transaction Mode (Recommended):**

```
postgresql://postgres.oiuxuhykupjymytokqps:8D20vCMybvh1tjL9@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
```

**Session Mode:**

```
postgresql://postgres.oiuxuhykupjymytokqps:8D20vCMybvh1tjL9@aws-0-us-west-1.pooler.supabase.com:6543/postgres?sslmode=require
```

## Method 4: Check Supabase CLI

If you have Supabase CLI installed:

```bash
supabase status
```

This will show the connection string.

## Method 5: Construct from Project Info

Based on your project reference `oiuxuhykupjymytokqps`:

**Direct Connection:**

```
postgresql://postgres:8D20vCMybvh1tjL9@db.oiuxuhykupjymytokqps.supabase.co:5432/postgres?sslmode=require
```

**Connection Pooler:**

```
postgresql://postgres.oiuxuhykupjymytokqps:8D20vCMybvh1tjL9@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
```

## What to Try Next

Since Network Restrictions aren't the issue, the problem might be:

1. **Wrong connection string format** - Try the pooler format above
2. **Database not initialized** - Tables might not exist yet
3. **Connection timeout** - Your network might be slow
4. **Supabase region issue** - The region might be different

Try updating your `.env` and `.env.local` with the pooler connection string and test again.
