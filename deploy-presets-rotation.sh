#!/bin/bash

# Deploy Presets Rotation System (25 presets, 6 per week)
# This sets up the rotating preset system for professional presets

echo "🎭 Deploying presets rotation system (25 presets, 6 per week)..."

# Check if we're in the right directory
if [ ! -f "sql/update-presets-table-for-rotation.sql" ]; then
    echo "❌ Error: sql/update-presets-table-for-rotation.sql not found in current directory"
    exit 1
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable not set"
    echo "Please set DATABASE_URL to your production database connection string"
    exit 1
fi

echo "📊 Current database URL: ${DATABASE_URL:0:50}..."

# Run the presets rotation setup script
echo "🎭 Setting up presets rotation system..."
psql "$DATABASE_URL" -f sql/update-presets-table-for-rotation.sql

if [ $? -eq 0 ]; then
    echo "✅ Presets rotation system setup complete!"
    echo ""
    echo "🎯 What was created:"
    echo "   ✅ 25 professional presets configured"
    echo "   ✅ 6 presets rotate per week"
    echo "   ✅ presets_config table for preset management"
    echo "   ✅ get_current_week_presets() function"
    echo "   ✅ get_all_presets() function"
    echo ""
    echo "🔄 Preset Rotation Schedule:"
    echo "   Week 1: cinematic, portrait, landscape, street, vintage, black_white"
    echo "   Week 2: artistic, fashion, documentary, minimalist, dramatic, soft"
    echo "   Week 3: bold, elegant, dynamic, serene, mysterious, vibrant"
    echo "   Week 4: subtle, powerful, delicate, intense, tranquil, striking"
    echo "   Week 5: timeless"
    echo ""
    echo "🎉 Presets rotation system ready!"
else
    echo "❌ Failed to setup presets rotation system!"
    echo "Please check the error messages above and try again"
    exit 1
fi
