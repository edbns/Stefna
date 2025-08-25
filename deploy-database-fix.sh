#!/bin/bash

# Deploy Database Schema Fix for media_assets table
# This fixes the UUID error and column mismatches

echo "🔧 Deploying database schema fix for media_assets table..."

# Check if we're in the right directory
if [ ! -f "database-fix-media-assets-schema.sql" ]; then
    echo "❌ Error: database-fix-media-assets-schema.sql not found in current directory"
    exit 1
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable not set"
    echo "Please set DATABASE_URL to your production database connection string"
    exit 1
fi

echo "📊 Current database URL: ${DATABASE_URL:0:50}..."

# Run the database fix
echo "🚀 Executing database schema fix..."
psql "$DATABASE_URL" -f database-fix-media-assets-schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Database schema fix completed successfully!"
    echo "🎯 The media_assets table should now work with Emotion Mask, Professional Presets, and Custom Prompt"
else
    echo "❌ Database schema fix failed!"
    echo "Please check the error messages above and try again"
    exit 1
fi

echo "🎉 Database fix deployment complete!"
echo "📝 Next steps:"
echo "   1. Test Emotion Mask generation"
echo "   2. Test Professional Presets (25) generation"
echo "   3. Test Custom Prompt generation"
echo "   4. All should now work without database errors"
