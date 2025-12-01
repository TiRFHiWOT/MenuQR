#!/bin/bash

# Update .env.local with database password
DB_PASSWORD="8D20vCMybvh1tjL9"

# Read current .env.local and update DATABASE_URL
sed -i "s|postgresql://postgres:\[YOUR-PASSWORD\]@|postgresql://postgres:${DB_PASSWORD}@|g" .env.local

echo "✅ Updated DATABASE_URL with your database password"
echo ""
echo "For the service role key:"
echo "1. In Supabase Dashboard, go to Settings > API Keys"
echo "2. Look for the 'backend_api' key (it starts with 'sb_secret_')"
echo "3. Click on it to reveal the full key"
echo "4. Or look for 'service_role' key in the 'Legacy anon, service_role API keys' section"
echo "5. Copy the full key and update SUPABASE_SERVICE_ROLE_KEY in .env.local"
echo ""

