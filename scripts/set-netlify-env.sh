#!/bin/bash

# Script to set all required VITE environment variables in Netlify
# Run this script to get the commands you need to run in Netlify

echo "🔧 [Netlify Environment Setup] Required VITE Variables:"
echo ""
echo "📋 Copy these commands to Netlify Environment Variables:"
echo ""

# Core app variables
echo "# Core App Variables"
echo "VITE_APP_ENV=production"
echo "VITE_DEBUG_MODE=false"
echo "VITE_NO_DB_MODE=false"
echo ""

# API and function variables
echo "# API and Function Variables"
echo "VITE_API_BASE_URL=https://your-site.netlify.app/.netlify/functions"
echo "VITE_FUNCTION_APP_KEY=your-function-app-key"
echo ""

# Feature flags
echo "# Feature Flags"
echo "VITE_ENABLE_STORY_MODE=true"
echo "VITE_ENABLE_PRESET_ROTATION=true"
echo "VITE_ENABLE_ADVANCED_PRESETS=true"
echo ""

# Cloudinary variables
echo "# Cloudinary Variables"
echo "VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name"
echo "VITE_CLD_UNSIGNED_PRESET=your-unsigned-preset"
echo ""

# AI/ML variables
echo "# AI/ML Variables"
echo "VITE_AIML_API_KEY=your-aiml-api-key"
echo ""

# Database variables (for frontend reference only)
echo "# Database Variables (Frontend Reference)"
echo "VITE_NEON_DATABASE_URL=postgresql://user:pass@host/db"
echo ""

echo "🚀 [Netlify Environment Setup] Instructions:"
echo "1. Go to Netlify → Site Settings → Environment Variables"
echo "2. Add each variable above with its corresponding value"
echo "3. Make sure to replace placeholder values with actual values"
echo "4. Redeploy the site after setting variables"
echo ""
echo "⚠️  IMPORTANT: VITE_ variables are public and visible in the browser!"
echo "   Only use them for non-sensitive configuration."
