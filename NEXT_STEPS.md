# Next Steps - What to Run

## 🚀 Quick Start (Recommended - No Sudo Needed)

### Step 1: Set Up Database Tables

**Option A: Manual SQL (Easiest - Recommended)**

1. Go to: https://supabase.com/dashboard/project/oiuxuhykupjymytokqps/sql/new
2. Copy the entire contents of `prisma/init.sql`
3. Paste into the SQL Editor
4. Click **Run** (or press Ctrl+Enter)

**Option B: Fix Prisma First (Requires Sudo)**

```bash
sudo apt-get update && sudo apt-get install -y libssl1.1
rm -rf node_modules/.prisma
npx prisma generate
npx prisma db push
```

### Step 2: Set Up Supabase Storage

1. Go to: https://supabase.com/dashboard/project/oiuxuhykupjymytokqps/storage/buckets
2. Click **New bucket**
3. Name: `menu-images`
4. Toggle **Public bucket** to ON
5. Click **Create bucket**

### Step 3: Start the App

```bash
npm run dev
```

The app will be available at: http://localhost:3000

### Step 4: Create Your First Admin User

1. Visit: http://localhost:3000/auth/signup
2. Fill in:
   - Name: Your name
   - Email: Your email
   - Password: Choose a password
   - Role: **Admin**
3. Click **Sign up**
4. Log in at: http://localhost:3000/auth/login

## ✅ That's It!

After these steps, you can:

- Create shops (as Admin)
- Assign owners to shops
- Manage menu items (as Owner)
- Generate QR codes for tables
- View menus via QR code (as Customer)

## Troubleshooting

**If you get database errors:**

- Make sure you ran the SQL script in Step 1

**If you get storage errors:**

- Make sure the `menu-images` bucket exists and is public

**If Prisma still has issues:**

- Use Option A (Manual SQL) - it bypasses Prisma migrations entirely
