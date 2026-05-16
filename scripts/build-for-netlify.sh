#!/bin/bash

# Netlify Build Script - Handles Prisma and build process
set -euo pipefail

echo "🔧 [Netlify Build] Starting build process..."

# Prisma completely removed - no need to clean
echo "🗄️ [Netlify Build] Prisma completely removed - using raw SQL with pg"

# Fresh install to ensure clean state (including dev dependencies for esbuild)
echo "📦 [Netlify Build] Fresh install..."
npm ci --include=dev

# Prisma completely removed - using raw SQL with pg
echo "🗄️ [Netlify Build] Prisma completely removed - using raw SQL with pg"
echo "✅ Build can proceed without any Prisma dependencies"

# Build the application
echo "🚀 [Netlify Build] Building application..."
npm run build

bash scripts/prune-dist-for-deploy.sh

echo "✅ [Netlify Build] Build completed successfully!"
