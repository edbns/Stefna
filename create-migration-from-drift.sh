#!/bin/bash

# 📝 Create Migration from Drift Script for Stefna
# This script converts the detected drift into a proper Prisma migration

# Check if drift.sql exists
if [ ! -f "drift.sql" ]; then
    echo "❌ drift.sql not found. Run detect-schema-drift.sh first."
    exit 1
fi

# Check if drift.sql has content
if [ ! -s "drift.sql" ]; then
    echo "✅ No drift detected. Database is already in sync with Prisma schema."
    exit 0
fi

# Generate migration name with timestamp
MIGRATION_NAME="sync_schema_$(date +%Y%m%d_%H%M%S)"
MIGRATION_DIR="prisma/migrations/$MIGRATION_NAME"

echo "📝 Creating migration from drift..."
echo "Migration name: $MIGRATION_NAME"
echo "Migration directory: $MIGRATION_DIR"

# Create migration directory
mkdir -p "$MIGRATION_DIR"

# Move drift.sql to migration.sql
mv drift.sql "$MIGRATION_DIR/migration.sql"

# Create migration.toml file
cat > "$MIGRATION_DIR/migration.toml" << EOF
# This is an empty migration.
EOF

echo "✅ Migration created: $MIGRATION_DIR"
echo "📁 Files created:"
echo "  - $MIGRATION_DIR/migration.sql"
echo "  - $MIGRATION_DIR/migration.toml"

echo ""
echo "🔍 Next steps:"
echo "1. Review the migration: $MIGRATION_DIR/migration.sql"
echo "2. Look for any DROP statements that might lose data"
echo "3. Test the migration in staging first"
echo "4. Apply to production when ready"
echo ""
echo "To apply the migration:"
echo "  npx prisma migrate deploy"
