#!/bin/bash

# Grant Starter Credits Script
# This script grants 30 starter credits to your user account

echo "🎯 Granting Starter Credits..."
echo "================================"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    echo "Please set your database connection string and try again"
    exit 1
fi

echo "✅ Database connection configured"
echo "🔍 Running credit grant script..."

# Run the SQL script
psql "$DATABASE_URL" -f sql/grant-starter-credits.sql

if [ $? -eq 0 ]; then
    echo "✅ Credits granted successfully!"
    echo "💰 You should now have 30 credits available"
    echo "🚀 Try generating an image again"
else
    echo "❌ Failed to grant credits"
    echo "Please check the database connection and try again"
    exit 1
fi
