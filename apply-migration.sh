#!/bin/bash

# 🚀 Apply Schema Script for Stefna
# This script safely applies schema changes from database-schema.sql to your database

# Set your database URL
DATABASE_URL="${DATABASE_URL:-$DIRECT_DATABASE_URL}"

echo "🚀 Applying database schema..."
echo "Database: $DATABASE_URL"
echo "Schema File: database-schema.sql"

# Check if database-schema.sql exists
if [ ! -f "database-schema.sql" ]; then
    echo "❌ database-schema.sql not found. Run from project root."
    exit 1
fi

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

echo ""
echo "⚠️  WARNING: This will modify your database schema!"
echo "Make sure you have:"
echo "1. ✅ Created a backup (run backup-database.sh first)"
echo "2. ✅ Reviewed database-schema.sql carefully"
echo "3. ✅ Tested in staging environment"
echo "4. ✅ Confirmed this is the right database"
echo ""

read -p "Are you sure you want to proceed? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Schema application cancelled."
    exit 0
fi

# Extract connection details from DATABASE_URL
if [[ $DATABASE_URL =~ postgres://([^:]+):([^@]+)@([^:]+):([0-9]+)/(.+) ]]; then
    DB_USER="${BASH_REMATCH[1]}"
    DB_PASS="${BASH_REMATCH[2]}"
    DB_HOST="${BASH_REMATCH[3]}"
    DB_PORT="${BASH_REMATCH[4]}"
    DB_NAME="${BASH_REMATCH[5]}"

    echo "🚀 Applying schema to database..."
    echo "   Host: $DB_HOST:$DB_PORT"
    echo "   Database: $DB_NAME"
    echo "   User: $DB_USER"

    # Apply the schema
    PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f database-schema.sql

    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Schema applied successfully!"
        echo ""
        echo "🎉 Database schema is now up to date!"
        echo ""
        echo "📋 What was applied:"
        echo "   - Tables and indexes from database-schema.sql"
        echo "   - Any new columns, constraints, or modifications"
        echo ""
        echo "🔍 Next steps:"
        echo "   1. Test your application with the new schema"
        echo "   2. Update any functions that depend on schema changes"
        echo "   3. Consider creating a new backup after verification"
    else
        echo "❌ Schema application failed!"
        echo "Check the error messages above and fix any issues."
        echo ""
        echo "💡 Common issues:"
        echo "   - Syntax errors in database-schema.sql"
        echo "   - Permission issues with your database user"
        echo "   - Network connectivity problems"
        exit 1
    fi
else
    echo "❌ Invalid DATABASE_URL format"
    echo "   Expected: postgres://user:pass@host:port/database"
    exit 1
fi
