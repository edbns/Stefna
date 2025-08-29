#!/bin/bash

# 🔍 Test Feed URLs Script
# This script checks what URLs are actually in the feed tables

# Set your database URL
DATABASE_URL="${DATABASE_URL:-$DIRECT_DATABASE_URL}"

echo "🔍 Testing feed URLs in database..."
echo "Database: $DATABASE_URL"

# Check if we have a database URL
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not set. Please set your database URL."
    echo "   You can set it with: export DATABASE_URL='your_database_url'"
    exit 1
fi

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ psql not found. Please install PostgreSQL client tools."
    exit 1
fi

echo "📊 Running feed URL test queries..."

# Run the test queries
PGPASSWORD=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p') \
psql "$DATABASE_URL" -f test-feed-data.sql

echo ""
echo "✅ Feed URL test complete!"
echo ""
echo "🔍 Look for:"
echo "   - Items with NULL or empty image_url"
echo "   - Items with valid URLs"
echo "   - Total count of completed items"
