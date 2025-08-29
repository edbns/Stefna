#!/bin/bash

# 🔍 Schema Drift Detection Script for Stefna
# This script detects differences between your current database and Prisma schema

# Set your direct Neon database URL (no pooler)
DIRECT_DATABASE_URL="${DIRECT_DATABASE_URL:-$DATABASE_URL}"

echo "🔍 Detecting schema drift..."
echo "Source DB: $DIRECT_DATABASE_URL"
echo "Target Schema: prisma/schema.prisma"

# Check if Prisma schema exists
if [ ! -f "prisma/schema.prisma" ]; then
    echo "❌ Prisma schema not found at prisma/schema.prisma"
    exit 1
fi

# Generate drift SQL (no apply yet)
echo "📝 Generating drift SQL..."
npx prisma migrate diff \
  --from-url "$DIRECT_DATABASE_URL" \
  --to-schema-datamodel prisma/schema.prisma \
  --script > drift.sql

if [ $? -eq 0 ]; then
    echo "✅ Drift SQL generated: drift.sql"
    echo "📊 Drift file size: $(du -h drift.sql | cut -f1)"
    
    # Show what changes would be made
    echo ""
    echo "📋 Summary of changes that would be made:"
    echo "=========================================="
    
    if [ -s drift.sql ]; then
        echo "The following changes were detected:"
        cat drift.sql
    else
        echo "✅ No schema drift detected! Database matches Prisma schema."
    fi
else
    echo "❌ Failed to generate drift SQL"
    exit 1
fi

echo ""
echo "🔍 Next steps:"
echo "1. Review drift.sql carefully"
echo "2. Look for any DROP COLUMN/DROP TABLE that would lose data"
echo "3. If you renamed fields/tables, use @map() in schema.prisma"
echo "4. Create a migration from the drift.sql"
echo "5. Test in staging before applying to production"
