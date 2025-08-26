#!/bin/bash

# Deploy New Generation Tables (NeoGlitch Architecture)
# This script creates new tables alongside existing ones for zero-risk migration

echo "🚀 Deploying new generation tables (NeoGlitch architecture)..."

# Check if we're in the right directory
if [ ! -f "sql/create-new-generation-tables.sql" ]; then
    echo "❌ Error: sql/create-new-generation-tables.sql not found in current directory"
    exit 1
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable not set"
    echo "Please set DATABASE_URL to your production database connection string"
    exit 1
fi

echo "📊 Current database URL: ${DATABASE_URL:0:50}..."

# Run the new tables creation script
echo "🚀 Creating new generation tables..."
psql "$DATABASE_URL" -f sql/create-new-generation-tables.sql

if [ $? -eq 0 ]; then
    echo "✅ New generation tables created successfully!"
    echo ""
    echo "🎯 Migration Status:"
    echo "   ✅ New tables created alongside existing system"
    echo "   ✅ No data loss - old system untouched"
    echo "   ✅ Ready for gradual user migration"
    echo ""
    echo "🚀 Next Steps:"
    echo "   1. Create new generation functions"
    echo "   2. Test with small user group"
    echo "   3. Gradually migrate users"
    echo "   4. Monitor performance"
    echo "   5. Complete migration when stable"
    echo ""
    echo "🎉 Database setup complete!"
else
    echo "❌ Failed to create new generation tables!"
    echo "Please check the error messages above and try again"
    exit 1
fi
