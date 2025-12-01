# MenuQR Setup Instructions

## ✅ Completed Steps

1. ✅ Environment variables configured (.env.local and .env)
2. ✅ Dependencies installed
3. ✅ Prisma client generated

## 🔧 Next Steps

### Option 1: Run SQL Manually (Recommended for Supabase)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/oiuxuhykupjymytokqps
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `prisma/init.sql`
4. Click **Run** to execute the SQL

This will create all the necessary tables in your database.

### Option 2: Try Prisma Migration Again

If you want to use Prisma migrations, try:

```bash
npx prisma migrate dev --name init
```

If you get connection errors, use Option 1 instead.

## 📦 Set Up Supabase Storage

1. Go to Supabase Dashboard → **Storage**
2. Click **New bucket**
3. Name it: `menu-images`
4. Set it to **Public** (toggle on)
5. Click **Create bucket**

### Storage Policies

After creating the bucket, set up policies:

1. Go to **Storage** → **Policies** → `menu-images`
2. Click **New Policy**
3. Policy name: "Allow authenticated uploads"
4. Allowed operation: **INSERT**
5. Target roles: **authenticated**
6. Policy definition:
   ```sql
   bucket_id = 'menu-images'
   ```

## 🚀 Start the Application

After setting up the database and storage:

```bash
npm run dev
```

The app will be available at http://localhost:3000

## 👤 Create Your First Admin User

1. Visit http://localhost:3000/auth/signup
2. Sign up with role "Admin"
3. Log in and start creating shops!

## 📝 Environment Variables Summary

Your `.env.local` should have:

- ✅ DATABASE_URL (with password)
- ✅ NEXTAUTH_URL
- ✅ NEXTAUTH_SECRET
- ✅ NEXT_PUBLIC_SUPABASE_URL
- ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
- ✅ SUPABASE_SERVICE_ROLE_KEY

All are configured! 🎉
