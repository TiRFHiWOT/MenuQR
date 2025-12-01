# Installing OpenSSL 1.1 Compatibility Libraries

## Quick Install

Run this command in your terminal:

```bash
sudo apt-get update && sudo apt-get install -y libssl1.1
```

Or use the provided script:

```bash
./install-openssl.sh
```

## What This Does

This installs the OpenSSL 1.1.0 compatibility libraries that Prisma's binary engines need. Your system will have both OpenSSL 3.0 (for modern apps) and OpenSSL 1.1 (for Prisma) available.

## After Installation

Once installed, try running Prisma migrations again:

```bash
npx prisma migrate dev --name init
```

Or push the schema directly:

```bash
npx prisma db push
```

## If Installation Fails

If `libssl1.1` is not available for your Ubuntu version, you have these options:

### Option A: Use Manual SQL (Recommended)

- Run `prisma/init.sql` in Supabase SQL Editor
- This bypasses Prisma migrations entirely
- Works on any system

### Option B: Try Alternative Package Names

Some systems may have the package under a different name:

```bash
sudo apt-get install -y libssl1.1.1
# or
sudo apt-get install -y libssl1.1.0
```

### Option C: Add Ubuntu Old Releases Repository

If you're on Ubuntu 22.04+ and libssl1.1 isn't available:

```bash
echo "deb http://old-releases.ubuntu.com/ubuntu/ focal main" | sudo tee /etc/apt/sources.list.d/focal.list
sudo apt-get update
sudo apt-get install -y libssl1.1
```

### Option D: Use Docker

Run Prisma commands in a Docker container with compatible libraries.

## Verify Installation

After installation, verify it worked:

```bash
ls -la /lib/x86_64-linux-gnu/libssl.so.1.1
```

If the file exists, the installation was successful!
