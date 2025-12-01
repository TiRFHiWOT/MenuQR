# ⚠️ URGENT: Fix Prisma OpenSSL Issue

Your app is running but crashing because Prisma can't load its engine. You need to install OpenSSL 1.1 compatibility libraries.

## Quick Fix (Run This Now)

Open a **new terminal window** and run:

```bash
sudo apt-get update && sudo apt-get install -y libssl1.1
```

Then **restart your dev server**:

1. Stop the current server (Ctrl+C in the terminal running `npm run dev`)
2. Run: `npm run dev`

## What's Happening

The error shows:

```
Unable to require(`libquery_engine-debian-openssl-1.1.x.so.node`)
/lib/x86_64-linux-gnu/libssl.so.1.1: version `OPENSSL_1_1_0' not found
```

This means Prisma's binary engine needs OpenSSL 1.1.0, but your system only has OpenSSL 3.0.

## After Installing libssl1.1

Once you install it and restart the server, the app should work! You'll be able to:

- Sign up users ✅
- Log in ✅
- Create shops ✅
- Manage menus ✅

## If Installation Fails

If `libssl1.1` isn't available for your Ubuntu version, you can:

1. **Check your Ubuntu version:**

   ```bash
   lsb_release -a
   ```

2. **Try alternative package names:**

   ```bash
   sudo apt-get install -y libssl1.1.1
   # or
   sudo apt-get install -y libssl1.1.0
   ```

3. **Or add old releases repository:**
   ```bash
   echo "deb http://old-releases.ubuntu.com/ubuntu/ focal main" | sudo tee /etc/apt/sources.list.d/focal.list
   sudo apt-get update
   sudo apt-get install -y libssl1.1
   ```

## Verify It Worked

After installing and restarting, try signing up at:
http://localhost:3001/auth/signup

If it works without errors, you're all set! 🎉
