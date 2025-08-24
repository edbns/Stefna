#!/bin/bash

# Production Database Seeding Script
# This script seeds the production database with basic test data

echo "🌱 Seeding Production Database..."

# Check if NETLIFY_DATABASE_URL is set
if [ -z "$NETLIFY_DATABASE_URL" ]; then
    echo "❌ Error: NETLIFY_DATABASE_URL environment variable is not set"
    echo "Please set it to your production Neon database URL"
    exit 1
fi

# Run the seeding script
echo "📊 Running seed data script..."
psql "$NETLIFY_DATABASE_URL" -f sql/seed-production-data.sql

if [ $? -eq 0 ]; then
    echo "✅ Production database seeded successfully!"
    echo "🎯 Your app should now work with basic test data"
else
    echo "❌ Failed to seed production database"
    exit 1
fi
