#!/bin/bash

# Script to set the service role key
# Usage: ./set-service-key.sh "your-service-role-key-here"

if [ -z "$1" ]; then
  echo "Usage: ./set-service-key.sh \"your-service-role-key\""
  echo ""
  echo "To find your service role key:"
  echo "1. Go to Supabase Dashboard > Settings > API Keys"
  echo "2. Look for 'backend_api' key (sb_secret_...) or 'service_role' key"
  echo "3. Click to reveal it, then run this script with the full key"
  exit 1
fi

SERVICE_KEY="$1"

# Update .env.local
sed -i "s|SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=\"${SERVICE_KEY}\"|g" .env.local

echo "✅ Updated SUPABASE_SERVICE_ROLE_KEY in .env.local"
echo ""
echo "Your .env.local is now complete! You can run:"
echo "  npm install"
echo "  npx prisma migrate dev --name init"
echo "  npm run dev"

