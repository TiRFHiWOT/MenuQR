# How to Find the Connection String in Supabase

## The Connection String is NOT on the Settings Page

The Database Settings page you're looking at doesn't show the connection string. You need to go to a different page.

## Step-by-Step Instructions

### Option 1: Connection String Page (Easiest)

1. **In the left sidebar**, look for "Settings" under "CONFIGURATION"
2. **Click on "Settings"** (you're already there)
3. **Look at the top of the page** - there might be tabs like "General", "Database", "API", etc.
4. **Click on "API" tab** (or look for "Connection string" in the navigation)
5. You should see the connection string there

### Option 2: Project Settings > API

1. **Click on "Settings" in the top navigation** (not the Database Settings)
2. **Look for "API" or "Database"** in the settings menu
3. **Find "Connection string"** section
4. Copy the connection string shown there

### Option 3: Construct It Manually

Based on your project, the connection string should be:

**Direct Connection:**

```
postgresql://postgres:8D20vCMybvh1tjL9@db.oiuxuhykupjymytokqps.supabase.co:5432/postgres?sslmode=require
```

**Connection Pooler (Transaction Mode - Recommended):**

```
postgresql://postgres.oiuxuhykupjymytokqps:8D20vCMybvh1tjL9@aws-0-us-west-1.pooler.supabase.com:6543/postgres?sslmode=require
```

## Important: Check Network Restrictions

I see there's a "Network Restrictions" section on your Settings page. This might be blocking your connection!

1. **Scroll down** on the Database Settings page
2. **Find "Network Restrictions"** section
3. **Check if there are any restrictions** listed
4. If it says "Your database can be accessed by all IP addresses" - that's good
5. If there are restrictions, you may need to:
   - Add your IP address, OR
   - Temporarily remove restrictions to test

## Quick Test

Try updating your `.env` files with the pooler connection string (Option 3 above), then restart your server and test again.
