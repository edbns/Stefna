#!/bin/bash

# deploy-analyze-media-assets.sh
# Script to analyze the media_assets table and understand migration needs

echo "🔍 Analyzing media_assets table for migration planning..."
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

# Run the analysis
echo "📊 Running comprehensive media_assets analysis..."
echo ""

psql "$DATABASE_URL" -f sql/analyze-media-assets-table.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Analysis completed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Review the analysis results above"
    echo "2. Identify which media can be migrated to new tables"
    echo "3. Create migration script based on findings"
    echo "4. Test migration on small subset first"
    echo "5. Execute full migration"
else
    echo ""
    echo "❌ Analysis failed. Please check your database connection and try again."
    exit 1
fi
