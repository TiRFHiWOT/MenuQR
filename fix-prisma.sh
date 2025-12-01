#!/bin/bash

# Fix Prisma OpenSSL compatibility issue
# This script will install OpenSSL 1.1 compatibility libraries

echo "🔧 Fixing Prisma OpenSSL compatibility issue..."
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "This script needs sudo privileges. Please run:"
    echo "  sudo bash fix-prisma.sh"
    echo ""
    echo "Or run these commands manually:"
    echo "  sudo apt-get update"
    echo "  sudo apt-get install -y libssl1.1"
    exit 1
fi

echo "Updating package list..."
apt-get update

echo ""
echo "Installing OpenSSL 1.1 compatibility library..."
apt-get install -y libssl1.1

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ OpenSSL 1.1 installed successfully!"
    echo ""
    echo "Now regenerating Prisma client..."
    cd "$(dirname "$0")"
    rm -rf node_modules/.prisma
    npx prisma generate
    
    echo ""
    echo "Testing Prisma connection..."
    npx prisma db push --skip-generate
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Prisma is now working! Database schema has been pushed."
    else
        echo ""
        echo "⚠️  Prisma still has issues. Try the manual SQL approach:"
        echo "  1. Go to Supabase Dashboard → SQL Editor"
        echo "  2. Run the contents of prisma/init.sql"
    fi
else
    echo ""
    echo "❌ Installation failed. The package might not be available for your Ubuntu version."
    echo ""
    echo "Alternative: Use manual SQL (recommended)"
    echo "  1. Go to Supabase Dashboard → SQL Editor"
    echo "  2. Copy and run prisma/init.sql"
fi

