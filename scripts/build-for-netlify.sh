#!/bin/bash

# Netlify Build Script - Handles Prisma and build process
set -euo pipefail

echo "🔧 [Netlify Build] Starting build process..."

# SURGICAL FIX: Nuke any shipped Prisma client
echo "🧹 [Netlify Build] Nuking any shipped Prisma client..."
rm -rf node_modules/.prisma node_modules/@prisma/client .prisma

# Fresh install to ensure clean state
echo "📦 [Netlify Build] Fresh install..."
npm ci

# Generate Prisma client (Node-API)
echo "🗄️ [Netlify Build] Generate Prisma client (Node-API)..."
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
