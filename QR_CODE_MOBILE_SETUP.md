# QR Code Mobile Setup

## Issue

QR codes generated with `localhost:3000` don't work on mobile devices because mobile devices can't access `localhost` on your computer.

## Solution

### For Development (Mobile Testing)

1. Find your computer's local network IP address:

   ```bash
   # On Linux/Mac
   ip addr show | grep "inet " | grep -v 127.0.0.1

   # On Windows
   ipconfig
   ```

   Look for something like `192.168.1.x` or `10.0.0.x`

2. Set the `NEXT_PUBLIC_BASE_URL` environment variable in your `.env.local`:

   ```env
   NEXT_PUBLIC_BASE_URL=http://192.168.1.100:3000
   ```

   Replace `192.168.1.100` with your actual IP address.

3. Make sure your Next.js dev server is accessible on your network:

   ```bash
   npm run dev
   ```

   The server should already be running on `0.0.0.0` (all interfaces) as configured in `package.json`.

4. Make sure your phone is on the same Wi-Fi network as your computer.

5. Scan the QR code with your phone - it should now work!

### For Production

Set `NEXT_PUBLIC_BASE_URL` to your production domain:

```env
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

## How It Works

The QR code generation now:

1. First checks `NEXT_PUBLIC_BASE_URL` environment variable
2. Falls back to `NEXTAUTH_URL` if available
3. Tries to detect from request headers as a last resort
4. Uses `localhost:3000` only as a final fallback

The QR code URL format is: `{BASE_URL}/business/{businessId}`

This ensures QR codes work on mobile devices when properly configured.
