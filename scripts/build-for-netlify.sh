#!/bin/bash

# Netlify Build Script - Handles esbuild platform issues
set -e

echo "🔧 [Netlify Build] Starting build process..."

# Clean Prisma artifacts
echo "🧹 [Netlify Build] Cleaning Prisma artifacts..."
rm -rf node_modules/.prisma
rm -rf prisma/generated

# Install dependencies
echo "📦 [Netlify Build] Installing dependencies..."
npm install

# Force install Linux esbuild binary
echo "🔧 [Netlify Build] Installing Linux esbuild binary..."
npm install --save-dev @esbuild/linux-x64 --force --platform=linux --arch=x64

# Generate Prisma client
echo "🗄️ [Netlify Build] Generating Prisma client..."
npx prisma generate

# Build the application
echo "🚀 [Netlify Build] Building application..."
npm run build

echo "✅ [Netlify Build] Build completed successfully!"
