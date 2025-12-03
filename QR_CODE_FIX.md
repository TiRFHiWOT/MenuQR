# QR Code Base URL Fix

## Issue

QR codes are still using `localhost:3000` even after setting `NEXT_PUBLIC_BASE_URL=http://192.168.1.100:3000` in `.env.local`.

## Solution

### 1. Restart the Development Server

After changing `.env.local`, you **must restart** the Next.js development server:

```bash
# Stop the current server (Ctrl+C)
# Then restart it
npm run dev
```

### 2. Regenerate Existing QR Codes

QR codes that were already generated and stored in the database still have the old `localhost:3000` URL. You need to regenerate them:

1. Go to the business detail page
2. Click the **"Regenerate"** button next to the QR code
3. This will generate a new QR code with the correct base URL from `NEXT_PUBLIC_BASE_URL`

### 3. Verify the Base URL

The code now prioritizes `NEXT_PUBLIC_BASE_URL` from the environment. You can verify it's being read correctly by checking the server console logs (in development mode, it will log the base URL being used).

### 4. For New Businesses

New businesses created after setting `NEXT_PUBLIC_BASE_URL` will automatically use the correct URL.

## Important Notes

- `NEXT_PUBLIC_*` environment variables are embedded at build/start time
- You must restart the server for changes to take effect
- Existing QR codes in the database need to be regenerated
- The "Regenerate" button on the business detail page will create a new QR code with the current base URL
