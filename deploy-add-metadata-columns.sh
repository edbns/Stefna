#!/bin/bash

# Deploy script to add metadata columns to dedicated media tables
# This script should be run on the production database

echo "🚀 Starting metadata columns deployment..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set"
    echo "Please set it to your production database connection string"
    exit 1
fi

echo "✅ DATABASE_URL is set"
echo "🔗 Connecting to: $(echo $DATABASE_URL | sed 's/:[^:]*@/@***:***@/')"

# Execute the SQL migration
echo "📝 Executing SQL migration to add metadata columns..."

psql "$DATABASE_URL" -f sql/add-metadata-columns.sql

if [ $? -eq 0 ]; then
    echo "✅ Metadata columns added successfully!"
    echo "🎉 The feed should now work without errors!"
else
    echo "❌ Failed to add metadata columns"
    echo "Please check the database connection and permissions"
    exit 1
fi

echo "🏁 Deployment complete!"
