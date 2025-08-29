#!/bin/bash

# 📝 Create Schema Backup Script for Stefna
# This script creates a timestamped backup of the current schema state

# Set your database URL
DATABASE_URL="${DATABASE_URL:-$DIRECT_DATABASE_URL}"

echo "📝 Creating database schema backup..."

# Check if we have a database URL
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not set. Please set your database URL."
    echo "   You can set it with: export DATABASE_URL='your_database_url'"
    exit 1
fi

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ psql not found. Please install PostgreSQL client tools."
    echo "   On macOS: brew install postgresql"
    echo "   On Ubuntu: sudo apt-get install postgresql-client"
    exit 1
fi

# Generate backup name with timestamp
BACKUP_NAME="schema_backup_$(date +%Y%m%d_%H%M%S)"
BACKUP_DIR="backups"

echo "📋 Creating schema backup..."
echo "Backup name: $BACKUP_NAME"
echo "Backup directory: $BACKUP_DIR/"

# Create backups directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Extract connection details from DATABASE_URL
if [[ $DATABASE_URL =~ postgres://([^:]+):([^@]+)@([^:]+):([0-9]+)/(.+) ]]; then
    DB_USER="${BASH_REMATCH[1]}"
    DB_PASS="${BASH_REMATCH[2]}"
    DB_HOST="${BASH_REMATCH[3]}"
    DB_PORT="${BASH_REMATCH[4]}"
    DB_NAME="${BASH_REMATCH[5]}"

    # Create schema dump
    SCHEMA_FILE="$BACKUP_DIR/${BACKUP_NAME}_schema.sql"
    echo "📄 Dumping schema to: $SCHEMA_FILE"

    PGPASSWORD="$DB_PASS" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" --schema-only --no-owner --no-privileges > "$SCHEMA_FILE"

    if [ $? -eq 0 ]; then
        echo "✅ Schema dump created successfully"

        # Create a metadata file
        METADATA_FILE="$BACKUP_DIR/${BACKUP_NAME}_metadata.txt"
        cat > "$METADATA_FILE" << EOF
# Schema Backup Metadata
# Created: $(date)
# Database: $DB_NAME
# Host: $DB_HOST:$DB_PORT
# User: $DB_USER
#
# Current schema file: database-schema.sql
# To compare: diff database-schema.sql $SCHEMA_FILE
#
# To restore this schema:
# PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f $SCHEMA_FILE
EOF

        echo "📋 Metadata file created: $METADATA_FILE"

        # Show file sizes
        echo ""
        echo "📊 Backup details:"
        echo "   Schema file: $(du -h "$SCHEMA_FILE" | cut -f1)"
        echo "   Metadata file: $(du -h "$METADATA_FILE" | cut -f1)"

        echo ""
        echo "✅ Backup created successfully!"
        echo ""
        echo "📁 Files created:"
        echo "   - $SCHEMA_FILE (schema dump)"
        echo "   - $METADATA_FILE (backup information)"
        echo ""
        echo "🔍 Next steps:"
        echo "1. Review the schema dump for any important data"
        echo "2. Compare with database-schema.sql if needed"
        echo "3. Store this backup safely before making schema changes"
        echo "4. Use this backup to restore if something goes wrong"
    else
        echo "❌ Failed to create schema dump"
        echo "Check your database connection and permissions"
        exit 1
    fi
else
    echo "❌ Invalid DATABASE_URL format"
    echo "   Expected: postgres://user:pass@host:port/database"
    exit 1
fi
