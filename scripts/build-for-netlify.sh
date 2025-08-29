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

# Prisma client not needed at runtime - using pg directly
echo "🗄️ [Netlify Build] Prisma client not needed at runtime - using pg directly"
echo "✅ Build can proceed without Prisma generation"

# Build the application
echo "🚀 [Netlify Build] Building application..."
npm run build

echo "✅ [Netlify Build] Build completed successfully!"
