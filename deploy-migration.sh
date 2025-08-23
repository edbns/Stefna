#!/bin/bash

echo "🚀 Applying database migration to production..."
echo "📋 This will add missing tables: auth_otps, user_credits, app_config, referral_signups, neo_glitch_media"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    echo "Please set it to your production database connection string"
    exit 1
fi

echo "🔗 Database URL: ${DATABASE_URL:0:20}..."

# Apply the migration
echo "📝 Running migration..."
psql "$DATABASE_URL" -f prisma/migrations/20250823231500_add_missing_tables/migration.sql

if [ $? -eq 0 ]; then
    echo "✅ Migration applied successfully!"
    echo "🎉 Production database now has all required tables"
    echo ""
    echo "📊 Tables added:"
    echo "  • auth_otps - for OTP verification"
    echo "  • user_credits - for credit management"
    echo "  • app_config - for application settings"
    echo "  • referral_signups - for referral tracking"
    echo "  • neo_glitch_media - for Neo Glitch functionality"
else
    echo "❌ Migration failed!"
    echo "Please check the error messages above"
    exit 1
fi
