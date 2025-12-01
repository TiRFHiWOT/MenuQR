# Setup Verification Checklist

## ✅ Completed Steps

- [x] Environment variables configured
- [x] Dependencies installed
- [x] Prisma client generated
- [x] Database tables created (SQL script run)
- [x] Storage bucket created (`menu-images`)

## 🧪 Test Your Setup

### 1. Check Database Tables

Go to Supabase Dashboard → Table Editor. You should see:

- `User` table
- `Shop` table
- `Table` table
- `MenuItem` table

### 2. Check Storage Bucket

Go to Supabase Dashboard → Storage → Buckets. You should see:

- `menu-images` bucket (Public)

### 3. Start the App

The app should now be running at: http://localhost:3000

### 4. Create Your First Admin User

1. Visit: http://localhost:3000/auth/signup
2. Fill in:
   - Name: Your name
   - Email: Your email
   - Password: Choose a secure password
   - Role: **Admin**
3. Click **Sign up**
4. You'll be redirected to login page
5. Log in with your credentials

### 5. Test Admin Features

After logging in as Admin:

- You should see the Admin dashboard at `/admin/shops`
- Click "Create Shop" to create your first shop
- Assign an owner (you'll need to create an Owner user first, or assign yourself)

### 6. Test Owner Features

1. Sign up a new user with role "Owner" (or change your existing user's role in the database)
2. Log in as Owner
3. You should see your assigned shops at `/owner/shops`
4. Click on a shop → "Manage Menu" to add menu items
5. Click "Tables & QR" to add tables and generate QR codes

### 7. Test Customer View

1. As Owner, go to Tables & QR page
2. Add a table (e.g., Table 1)
3. A QR code will be generated
4. Click the QR code or copy the URL
5. Open the URL in a new tab (or scan with your phone)
6. You should see the public menu view

## 🐛 Troubleshooting

**If you get "Table not found" errors:**

- Make sure you ran the SQL script completely
- Check Supabase Table Editor to verify tables exist

**If you get storage errors:**

- Verify `menu-images` bucket exists and is Public
- Check bucket policies allow uploads

**If login doesn't work:**

- Check that the User table has your user record
- Verify password was hashed correctly (should be a long string)

**If you can't access admin/owner pages:**

- Make sure your user's role is set to "ADMIN" or "OWNER" (not lowercase)
- Check the database: `SELECT * FROM "User" WHERE email = 'your-email@example.com';`

## 🎉 You're Ready!

Once you've verified these steps, your MenuQR MVP is fully functional!
