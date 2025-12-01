# MenuQR

A QR code-based menu system for restaurants and cafes. Built with Next.js 14, Supabase, and Prisma.

## Features

- **Admin Dashboard**: Manage shops and assign owners
- **Owner Dashboard**: Manage menu items, tables, and generate QR codes
- **Customer View**: Scan QR code to view menu on any device
- **Image Upload**: Upload menu item images to Supabase Storage
- **Role-Based Access**: Secure authentication with NextAuth.js

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase PostgreSQL with Prisma ORM
- **Storage**: Supabase Storage for menu images
- **Authentication**: NextAuth.js with email/password
- **UI**: Tailwind CSS
- **QR Codes**: qrcode package

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Run database migrations: `npx prisma migrate dev`
5. Start the development server: `npm run dev`

## Environment Variables

- `DATABASE_URL` - Supabase PostgreSQL connection string
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `NEXTAUTH_SECRET` - NextAuth.js secret
- `NEXTAUTH_URL` - Application URL (e.g., http://localhost:3000)

## Project Structure

```
/app
  /admin          # Admin dashboard routes
  /owner          # Owner dashboard routes
  /shop           # Public customer menu view
  /api            # API routes
  /auth           # Authentication pages
/lib              # Utilities, Prisma client, NextAuth config
/prisma           # Prisma schema and migrations
```

## License

MIT
