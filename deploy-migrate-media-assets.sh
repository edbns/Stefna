#!/bin/bash

# deploy-migrate-media-assets.sh
# Script to safely migrate all media from media_assets to new dedicated tables

echo "🚀 Starting media assets migration to new dedicated tables..."
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
echo "⚠️  IMPORTANT: This will migrate ALL media from media_assets to new tables"
echo "📊 Expected migration: 72 media items"
echo "   - Ghibli Reaction: ~37 items"
echo "   - Emotion Mask: ~20 items"
echo "   - Professional Presets: ~17 items"
echo "   - Custom Prompt: ~19 items"
echo ""

read -p "Are you sure you want to proceed? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Migration cancelled by user"
    exit 0
fi

echo ""
echo "🔄 Starting migration process..."
echo ""

# Run the migration
echo "📊 Executing migration script..."
echo ""

psql "$DATABASE_URL" -f sql/migrate-media-assets-to-new-tables.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Review the migration results above"
    echo "2. Verify all media items were migrated correctly"
    echo "3. Test the new system with migrated media"
    echo "4. Update UI components to use new services"
    echo "5. Clean up old system (optional)"
    echo ""
    echo "🔍 To verify migration, check:"
    echo "   - ghibli_reaction_media table"
    echo "   - emotion_mask_media table"
    echo "   - presets_media table"
    echo "   - custom_prompt_media table"
    echo ""
    echo "⚠️  IMPORTANT: Do NOT delete old tables until UI is fully updated!"
else
    echo ""
    echo "❌ Migration failed. Please check the error messages above."
    echo "The backup table 'media_assets_backup' was created for safety."
    exit 1
fi
