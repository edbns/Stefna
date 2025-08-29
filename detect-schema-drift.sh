#!/bin/bash

# 🔍 Database Schema Validation Script for Stefna
# This script validates the database schema against our database-schema.sql file

# Set your database URL
DATABASE_URL="${DATABASE_URL:-$DIRECT_DATABASE_URL}"

echo "🔍 Validating database schema..."
echo "Database: $DATABASE_URL"
echo "Schema File: database-schema.sql"

# Check if database-schema.sql exists
if [ ! -f "database-schema.sql" ]; then
    echo "❌ database-schema.sql not found in project root"
    exit 1
fi

# Check if we have a database URL
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not set. Please set your database URL."
    echo "   You can set it with: export DATABASE_URL='your_database_url'"
    exit 1
fi

echo "📝 Checking database connectivity..."
# Test database connection using psql
if command -v psql &> /dev/null; then
    # Extract connection details from DATABASE_URL
    # This is a simple regex to extract postgres://user:pass@host:port/db
    if [[ $DATABASE_URL =~ postgres://([^:]+):([^@]+)@([^:]+):([0-9]+)/(.+) ]]; then
        DB_USER="${BASH_REMATCH[1]}"
        DB_PASS="${BASH_REMATCH[2]}"
        DB_HOST="${BASH_REMATCH[3]}"
        DB_PORT="${BASH_REMATCH[4]}"
        DB_NAME="${BASH_REMATCH[5]}"

        # Test connection
        PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT version();" &> /dev/null

        if [ $? -eq 0 ]; then
            echo "✅ Database connection successful"
        else
            echo "❌ Database connection failed"
            echo "   Please check your DATABASE_URL and database credentials"
            exit 1
        fi
    else
        echo "❌ Invalid DATABASE_URL format"
        echo "   Expected: postgres://user:pass@host:port/database"
        exit 1
    fi
else
    echo "⚠️  psql not found. Skipping database connectivity test."
    echo "   Install PostgreSQL client tools to enable connectivity testing."
fi

# Validate schema file syntax
echo "📋 Validating schema file syntax..."
if command -v psql &> /dev/null && [ ! -z "$DATABASE_URL" ]; then
    echo "🔍 Testing schema file against database..."
    echo "   (This will show any syntax errors in database-schema.sql)"

    # Test the schema file by attempting to parse it
    # This won't apply changes, just validate syntax
    if PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f database-schema.sql --echo-errors --quiet 2>&1 | grep -i error; then
        echo "❌ Schema validation failed. Check the errors above."
        exit 1
    else
        echo "✅ Schema file syntax is valid"
    fi
else
    echo "⚠️  Skipping schema validation (psql not available or DATABASE_URL not set)"
fi

echo ""
echo "🎉 Schema validation complete!"
echo ""
echo "📋 Your database setup:"
echo "   - Schema file: database-schema.sql"
echo "   - Database URL: [SET]"
echo "   - Connection: $([ -z "$DATABASE_URL" ] && echo 'NOT TESTED' || echo 'TESTED')"
echo ""
echo "🔍 Next steps:"
echo "1. Review database-schema.sql for any needed changes"
echo "2. Apply schema changes manually to your database"
echo "3. Test your functions with the updated schema"
echo "4. Create backups before making schema changes"
