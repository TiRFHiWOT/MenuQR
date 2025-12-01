#!/bin/bash

# Script to install OpenSSL 1.1 compatibility libraries
# Run this script with: bash install-openssl.sh
# You may need to enter your sudo password

echo "Installing OpenSSL 1.1 compatibility libraries..."
echo ""

# Update package list
sudo apt-get update

# Install OpenSSL 1.1 compatibility library
sudo apt-get install -y libssl1.1

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ OpenSSL 1.1 compatibility libraries installed successfully!"
    echo ""
    echo "Now try running Prisma migrations:"
    echo "  npx prisma migrate dev --name init"
    echo ""
    echo "Or push the schema directly:"
    echo "  npx prisma db push"
else
    echo ""
    echo "❌ Installation failed. You may need to:"
    echo "1. Check if libssl1.1 is available for your Ubuntu version"
    echo "2. Try alternative solutions (see CONNECTION_ISSUE_EXPLANATION.md)"
    echo ""
fi

