#!/bin/bash

# deploy-execute-cleanup.sh
# Script to actually execute the cleanup (drop old media_assets table)

echo "🧹 Executing actual cleanup - removing old media_assets table..."
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    echo "Please set it to your database connection string"
    exit 1
fi

echo "✅ DATABASE_URL is set"
echo ""

# Safety check - confirm before proceeding
echo "⚠️  WARNING: This will PERMANENTLY remove the old media_assets table"
echo "📊 Expected: All 72 items should already be migrated to new tables"
echo "🔄 This script will actually execute the cleanup"
echo ""

read -p "Are you absolutely sure you want to proceed? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Cleanup cancelled by user"
    exit 0
fi

echo ""
echo "🚀 Executing cleanup..."
echo ""

# Run the actual cleanup script
psql "$DATABASE_URL" -f sql/execute-cleanup.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Cleanup executed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Push changes to GitHub"
    echo "2. Test the new system thoroughly"
    echo "3. Deploy and test in production"
    echo ""
    echo "🔍 The old system has been completely removed"
    echo "✅ All data is now in dedicated tables"
    echo "🚀 System is clean and ready for production!"
else
    echo ""
    echo "❌ Cleanup failed. Please check the error messages above."
    exit 1
fi
