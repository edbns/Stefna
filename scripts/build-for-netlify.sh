#!/bin/bash

# Netlify Build Script - Handles Prisma and build process
set -e

echo "🔧 [Netlify Build] Starting build process..."

# SCORCHED EARTH: Clean Prisma artifacts completely
echo "🧹 [Netlify Build] SCORCHED EARTH: Cleaning ALL Prisma artifacts..."
rm -rf node_modules/.prisma 
rm -rf node_modules/@prisma/client
rm -rf prisma/generated
rm -rf .prisma
rm -rf node_modules/prisma

# Force clean install to remove any cached packages
echo "📦 [Netlify Build] Force clean install of dependencies..."
npm ci --force

# Generate Prisma client with explicit library engine
echo "🗄️ [Netlify Build] Generating Prisma client with explicit library engine..."
export PRISMA_CLIENT_ENGINE_TYPE="library"
export PRISMA_GENERATE_DATAPROXY="false"
export PRISMA_CLI_QUERY_ENGINE_TYPE="library"
npx prisma generate --schema=./prisma/schema.prisma

# Verify the generated client
echo "🔍 [Netlify Build] Verifying Prisma client..."
if [ -f "node_modules/@prisma/client/index.js" ]; then
  echo "✅ Prisma client generated successfully"
  
  # Check if it's a library engine client (not Data Proxy)
  if grep -q "library" "node_modules/@prisma/client/index.js" 2>/dev/null || ! grep -q "data-proxy" "node_modules/@prisma/client/index.js" 2>/dev/null; then
    echo "✅ Appears to be library engine client (not Data Proxy)"
  else
    echo "⚠️  Warning: Client may be Data Proxy type"
  fi
  
  # Check for any Accelerate/Data Proxy references
  if grep -q "accelerate\|data-proxy" "node_modules/@prisma/client/index.js" 2>/dev/null; then
    echo "❌ WARNING: Data Proxy/Accelerate references found in generated client!"
    echo "This will cause P6001 errors. Regenerating..."
    npx prisma generate --schema=./prisma/schema.prisma --force
  fi
else
  echo "❌ Prisma client not found!"
  exit 1
fi

# Build the application
echo "🚀 [Netlify Build] Building application..."
npm run build

echo "✅ [Netlify Build] Build completed successfully!"
