#!/bin/bash

# Fix Prisma binary compatibility by copying OpenSSL 3.0 binary
# This works around the OpenSSL 1.1 requirement

cd "$(dirname "$0")"

echo "🔧 Fixing Prisma binary compatibility..."

# Copy the OpenSSL 3.0 binary to where Prisma expects 1.1.x
if [ -f "node_modules/.prisma/client/libquery_engine-debian-openssl-3.0.x.so.node" ]; then
    cp node_modules/.prisma/client/libquery_engine-debian-openssl-3.0.x.so.node \
       node_modules/.prisma/client/libquery_engine-debian-openssl-1.1.x.so.node
    
    echo "✅ Copied OpenSSL 3.0 binary to 1.1.x location"
    echo ""
    echo "Testing Prisma connection..."
    
    node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$connect().then(() => { console.log('✅ Prisma works!'); process.exit(0); }).catch(e => { console.log('❌ Still broken:', e.message.split('\n')[0]); process.exit(1); });" 2>&1
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "🎉 Prisma is now working! Restart your dev server."
    else
        echo ""
        echo "⚠️  Prisma still has issues. You may need to install libssl1.1:"
        echo "   sudo apt-get install -y libssl1.1"
    fi
else
    echo "❌ OpenSSL 3.0 binary not found. Regenerating Prisma..."
    npx prisma generate
    bash "$0"
fi

