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

# Install dependencies
echo "📦 [Netlify Build] Installing dependencies..."
npm install

# Generate Prisma client with explicit binary engine
echo "🗄️ [Netlify Build] Generating Prisma client..."
export PRISMA_CLIENT_ENGINE_TYPE="binary"
export PRISMA_GENERATE_DATAPROXY="false"
npx prisma generate

# Build the application
echo "🚀 [Netlify Build] Building application..."
npm run build

echo "✅ [Netlify Build] Build completed successfully!"
