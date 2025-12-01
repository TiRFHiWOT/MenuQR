#!/bin/bash

# Script to update DATABASE_URL with the correct connection string from Supabase

echo "📋 Database Connection String Updater"
echo ""
echo "This script will help you update your DATABASE_URL."
echo ""
read -p "Paste the connection string from Supabase (or press Enter to skip): " CONNECTION_STRING

if [ -z "$CONNECTION_STRING" ]; then
    echo ""
    echo "To get the connection string:"
    echo "1. Go to: https://supabase.com/dashboard/project/oiuxuhykupjymytokqps/settings/database"
    echo "2. Copy the connection string from 'Connection string' section"
    echo "3. Make sure it includes your password: 8D20vCMybvh1tjL9"
    echo "4. Run this script again and paste it"
    exit 0
fi

# Remove quotes if present
CONNECTION_STRING=$(echo "$CONNECTION_STRING" | tr -d '"')

# Ensure it has sslmode=require
if [[ ! "$CONNECTION_STRING" == *"sslmode=require"* ]]; then
    if [[ "$CONNECTION_STRING" == *"?"* ]]; then
        CONNECTION_STRING="${CONNECTION_STRING}&sslmode=require"
    else
        CONNECTION_STRING="${CONNECTION_STRING}?sslmode=require"
    fi
fi

# Update .env
sed -i "s|DATABASE_URL=.*|DATABASE_URL=\"${CONNECTION_STRING}\"|g" .env

# Update .env.local
sed -i "s|DATABASE_URL=.*|DATABASE_URL=\"${CONNECTION_STRING}\"|g" .env.local

echo ""
echo "✅ Updated DATABASE_URL in both .env and .env.local"
echo ""
echo "Testing connection..."
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$connect().then(() => { console.log('✅ SUCCESS! Database connected!'); process.exit(0); }).catch(e => { console.log('❌ Error:', e.message.split('\n')[0]); process.exit(1); });" 2>&1

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Database connection is working! Restart your dev server."
else
    echo ""
    echo "⚠️  Connection still failing. Please verify:"
    echo "   - The connection string is correct"
    echo "   - Your password is: 8D20vCMybvh1tjL9"
    echo "   - The Supabase project is active"
fi

