#!/bin/bash

# Netlify Build Script - Handles Prisma and build process
set -e

echo "🔧 [Netlify Build] Starting build process..."

# Clean Prisma artifacts completely
echo "🧹 [Netlify Build] Cleaning Prisma artifacts..."
rm -rf node_modules/.prisma 
rm -rf node_modules/@prisma/client
rm -rf prisma/generated
rm -rf .prisma

# Install dependencies (this will run postinstall with correct env vars)
echo "📦 [Netlify Build] Installing dependencies..."
npm install

# Double-check: Generate Prisma client with explicit binary engine
echo "🗄️ [Netlify Build] Generating Prisma client with explicit settings..."
export PRISMA_CLIENT_ENGINE_TYPE="binary"
export PRISMA_GENERATE_DATAPROXY="false"
export PRISMA_CLI_QUERY_ENGINE_TYPE="binary"
npx prisma generate

# Verify the generated client
echo "🔍 [Netlify Build] Verifying Prisma client..."
if [ -f "node_modules/@prisma/client/index.js" ]; then
  echo "✅ Prisma client generated successfully"
  # Check if it's a binary engine client
  if grep -q "binary" "node_modules/@prisma/client/index.js" 2>/dev/null || ! grep -q "data-proxy" "node_modules/@prisma/client/index.js" 2>/dev/null; then
    echo "✅ Appears to be binary engine client"
  else
    echo "⚠️  Warning: Client may be Data Proxy type"
  fi
else
  echo "❌ Prisma client not found!"
  exit 1
fi

# Build the application
echo "🚀 [Netlify Build] Building application..."
npm run build

echo "✅ [Netlify Build] Build completed successfully!"
