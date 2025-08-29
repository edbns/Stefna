#!/bin/bash

# 🗄️ Database Backup Script for Stefna
# This script creates a backup of your production database before schema changes

# Set your direct Neon database URL (no pooler)
DIRECT_DATABASE_URL="${DIRECT_DATABASE_URL:-$DATABASE_URL}"

# Create backup directory
BACKUP_DIR="backups"
mkdir -p "$BACKUP_DIR"

# Generate backup filename with timestamp
BACKUP_FILE="$BACKUP_DIR/backup_$(date +%F_%H-%M-%S).sql"

echo "🗄️ Creating database backup..."
echo "Source: $DIRECT_DATABASE_URL"
echo "Backup file: $BACKUP_FILE"

# Create the backup
pg_dump "$DIRECT_DATABASE_URL" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Backup created successfully: $BACKUP_FILE"
    echo "📊 Backup size: $(du -h "$BACKUP_FILE" | cut -f1)"
else
    echo "❌ Backup failed!"
    exit 1
fi

echo "🔒 Backup completed. Safe to proceed with schema changes."
