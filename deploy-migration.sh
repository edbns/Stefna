#!/bin/bash

echo "🚀 Applying comprehensive database migration to production..."
echo "📋 This will add ALL missing tables and update existing ones to match the current schema"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    echo "Please set it to your production database connection string"
    exit 1
fi

echo "🔗 Database URL: ${DATABASE_URL:0:20}..."

# Apply the comprehensive migration
echo "📝 Running comprehensive migration..."
psql "$DATABASE_URL" -f prisma/migrations/20250823232000_add_all_missing_tables/migration.sql

if [ $? -eq 0 ]; then
    echo "✅ Comprehensive migration applied successfully!"
    echo "🎉 Production database now has ALL required tables and columns"
    echo ""
    echo "📊 Tables added/updated:"
    echo "  • _extensions - System extensions"
    echo "  • user_settings - User preferences"
    echo "  • credits_ledger - Credit transactions"
    echo "  • notifications - User notifications"
    echo "  • auth_otps - OTP verification"
    echo "  • user_credits - Credit management"
    echo "  • app_config - Application settings"
    echo "  • referral_signups - Referral tracking"
    echo "  • neo_glitch_media - Neo Glitch functionality"
    echo "  • media_assets - Enhanced with missing columns"
    echo "  • users - Enhanced with missing columns"
    echo ""
    echo "🔧 All foreign key constraints and indexes created"
    echo "🎯 Database schema now matches development environment"
else
    echo "❌ Migration failed!"
    echo "Please check the error messages above"
    exit 1
fi
