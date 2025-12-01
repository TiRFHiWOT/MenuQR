#!/bin/bash

# Fix database connection by trying different Supabase connection formats

cd "$(dirname "$0")"

echo "🔧 Fixing database connection..."

# Get current DATABASE_URL
CURRENT_URL=$(grep DATABASE_URL .env | cut -d'=' -f2- | tr -d '"')

echo "Current URL format: ${CURRENT_URL:0:50}..."

# Try format 1: Direct connection (current)
echo ""
echo "Testing direct connection..."
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$connect().then(() => { console.log('✅ Direct connection works!'); process.exit(0); }).catch(e => { console.log('❌ Direct failed'); process.exit(1); });" 2>&1 | grep -E "(✅|❌)" && exit 0

# Try format 2: Connection pooler
echo ""
echo "Trying connection pooler format..."
sed -i 's|db.oiuxuhykupjymytokqps.supabase.co:5432|aws-0-us-west-1.pooler.supabase.com:6543|g' .env
sed -i 's|postgres:8D20vCMybvh1tjL9@|postgres.oiuxuhykupjymytokqps:8D20vCMybvh1tjL9@|g' .env

node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$connect().then(() => { console.log('✅ Pooler connection works!'); process.exit(0); }).catch(e => { console.log('❌ Pooler failed'); process.exit(1); });" 2>&1 | grep -E "(✅|❌)"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database connection fixed! Using connection pooler."
    echo "Restart your dev server."
else
    echo ""
    echo "⚠️  Both connection methods failed."
    echo "Please check:"
    echo "1. Your Supabase project is active"
    echo "2. Database password is correct"
    echo "3. Network connectivity"
    echo ""
    echo "You can get the correct connection string from:"
    echo "Supabase Dashboard > Settings > Database > Connection string"
fi

