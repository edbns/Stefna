#!/bin/bash

# 🚀 Apply Migration Script for Stefna
# This script safely applies Prisma migrations to your database

# Set your direct Neon database URL (no pooler)
DIRECT_DATABASE_URL="${DIRECT_DATABASE_URL:-$DATABASE_URL}"

echo "🚀 Applying Prisma migration..."
echo "Database: $DIRECT_DATABASE_URL"

# Check if we're in the right directory
if [ ! -d "prisma/migrations" ]; then
    echo "❌ prisma/migrations directory not found. Run from project root."
    exit 1
fi

# Check if there are pending migrations
echo "📋 Checking for pending migrations..."
npx prisma migrate status --schema=prisma/schema.prisma

echo ""
echo "⚠️  WARNING: This will modify your database schema!"
echo "Make sure you have:"
echo "1. ✅ Created a backup (run backup-database.sh first)"
echo "2. ✅ Reviewed the migration SQL"
echo "3. ✅ Tested in staging environment"
echo "4. ✅ Confirmed this is the right database"
echo ""

read -p "Are you sure you want to proceed? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Migration cancelled."
    exit 0
fi

echo "🚀 Applying migration..."
npx prisma migrate deploy --schema=prisma/schema.prisma

if [ $? -eq 0 ]; then
    echo "✅ Migration applied successfully!"
    
    # Show final status
    echo ""
    echo "📊 Final migration status:"
    npx prisma migrate status --schema=prisma/schema.prisma
    
    echo ""
    echo "🎉 Database schema is now in sync with Prisma schema!"
else
    echo "❌ Migration failed!"
    echo "Check the error messages above and fix any issues."
    exit 1
fi
