#!/bin/bash

# deploy-cleanup-old-system.sh
# Script to safely clean up the old system after successful migration

echo "🧹 Starting old system cleanup process..."
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    echo "Please set it to your database connection string"
    echo "Example: export DATABASE_URL='postgresql://user:pass@host:port/db'"
    exit 1
fi

echo "✅ DATABASE_URL is set"
echo ""

# Safety check - confirm before proceeding
echo "⚠️  IMPORTANT: This will remove the old media_assets table"
echo "📊 Expected: All 72 items should already be migrated to new tables"
echo "🔄 This script will verify migration before cleanup"
echo ""

read -p "Are you sure you want to proceed with cleanup? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Cleanup cancelled by user"
    exit 0
fi

echo ""
echo "🔍 Running verification before cleanup..."
echo ""

# Run the verification script
echo "📊 Executing verification script..."
echo ""

psql "$DATABASE_URL" -f sql/cleanup-old-system.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Verification completed successfully!"
    echo ""
    echo "📋 Review the results above to confirm:"
    echo "1. All new tables have data"
    echo "2. Total count = 72 items"
    echo "3. Old table has 0 remaining items"
    echo ""
    
    read -p "Do the verification results look correct? (yes/no): " verify_confirm
    
    if [ "$verify_confirm" == "yes" ]; then
        echo ""
        echo "🚀 Proceeding with cleanup..."
        echo ""
        
        # Create a temporary cleanup script with DROP commands uncommented
        echo "-- Temporary cleanup script with DROP commands enabled" > temp_cleanup.sql
        echo "DROP TABLE IF EXISTS media_assets;" >> temp_cleanup.sql
        echo "SELECT '=== CLEANUP COMPLETE ===' as status;" >> temp_cleanup.sql
        echo "SELECT 'Old media_assets table has been removed' as result;" >> temp_cleanup.sql
        echo "SELECT 'All data is now in dedicated tables' as result;" >> temp_cleanup.sql
        echo "SELECT 'System is clean and ready for production' as result;" >> temp_cleanup.sql
        
        # Execute the cleanup
        psql "$DATABASE_URL" -f temp_cleanup.sql
        
        # Clean up temporary file
        rm temp_cleanup.sql
        
        echo ""
        echo "🎉 Cleanup completed successfully!"
        echo ""
        echo "📋 Next steps:"
        echo "1. Test the new system thoroughly"
        echo "2. Push changes to GitHub"
        echo "3. Deploy and test in production"
        echo ""
        echo "🔍 The old system has been completely removed"
        echo "✅ All data is now in dedicated tables"
        echo "🚀 System is clean and ready for production!"
        
    else
        echo ""
        echo "❌ Cleanup cancelled - verification results were not satisfactory"
        echo "Please investigate the migration before proceeding with cleanup"
        exit 1
    fi
    
else
    echo ""
    echo "❌ Verification failed. Please check the error messages above."
    echo "Do not proceed with cleanup until verification passes."
    exit 1
fi
