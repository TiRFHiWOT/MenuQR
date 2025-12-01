#!/bin/bash

# MenuQR Environment Setup Script
# This script helps you set up your .env.local file

echo "Setting up MenuQR environment variables..."
echo ""

# Supabase credentials (you provided)
SUPABASE_URL="https://oiuxuhykupjymytokqps.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pdXh1aHlrdXBqeW15dG9rcXBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NzczNDEsImV4cCI6MjA4MDE1MzM0MX0.QMYnOzySUQnhj2X88LNRbM-nPAhsvY9VM-TpEkl4mRA"

# Generate NextAuth secret
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Create .env.local file
cat > .env.local << EOF
# Database
# TODO: Get your database password from Supabase Project Settings > Database
# Replace [YOUR-PASSWORD] with your actual database password
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.oiuxuhykupjymytokqps.supabase.co:5432/postgres"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="${NEXTAUTH_SECRET}"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="${SUPABASE_URL}"
NEXT_PUBLIC_SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY}"
# TODO: Get this from Supabase Project Settings > API > service_role key
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
EOF

echo "✅ Created .env.local file!"
echo ""
echo "⚠️  IMPORTANT: You still need to:"
echo "1. Get your database password from Supabase and replace [YOUR-PASSWORD] in DATABASE_URL"
echo "2. Get your service_role key from Supabase Project Settings > API and replace 'your-service-role-key-here'"
echo ""
echo "To get these values:"
echo "  - Go to https://supabase.com/dashboard/project/oiuxuhykupjymytokqps"
echo "  - Database password: Settings > Database > Database password"
echo "  - Service role key: Settings > API > service_role (secret) key"
echo ""

