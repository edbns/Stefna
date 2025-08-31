# Database Directory Structure

This directory contains all database-related files for the Stefna application.

## Directory Structure

```
database/
├── schema/
│   └── database-schema.sql          # Complete database schema
├── migrations/
│   ├── migrate-to-privacy-first.sql # Privacy-first migration
│   ├── add-fal-job-id.sql          # FAL.ai job tracking migration
│   └── drop-aiml-job-id.sql        # Remove AIML job tracking
└── fixes/
    ├── debug-feed-issue.sql        # Feed debugging queries
    ├── fix-all-database-issues.sql # Comprehensive database fixes
    ├── fix-credits-table.sql       # Credit system fixes
    ├── fix-image-url-constraints.sql # Image URL constraint fixes
    ├── fix-run-id-constraints.sql  # Run ID constraint fixes
    └── fix-share-to-feed-default.sql # Privacy defaults fix
```

## Usage

### Initial Setup
```bash
# Run the complete schema
psql -f database/schema/database-schema.sql
```

### Migrations
Run migrations in order:
```bash
# 1. Privacy-first migration
psql -f database/migrations/migrate-to-privacy-first.sql

# 2. FAL.ai migration
psql -f database/migrations/add-fal-job-id.sql

# 3. Clean up old AIML references
psql -f database/migrations/drop-aiml-job-id.sql
```

### Fixes
Run specific fixes as needed:
```bash
# Comprehensive fix for all database issues
psql -f database/fixes/fix-all-database-issues.sql

# Individual fixes
psql -f database/fixes/fix-credits-table.sql
psql -f database/fixes/fix-share-to-feed-default.sql
```

## Database Architecture

- **Privacy-First**: User content is private by default (`share_to_feed = FALSE`)
- **Raw SQL**: Direct PostgreSQL queries (no ORM)
- **Connection Pooling**: Optimized database connections
- **Type Safety**: TypeScript interfaces for all database results

## Tables Overview

- `users` - User accounts
- `user_settings` - User preferences (privacy settings)
- `user_credits` - Credit balances and limits
- `auth_otps` - OTP authentication
- `credits_ledger` - Credit transaction history
- Various media tables (custom_prompt_media, emotion_mask_media, etc.)
- `story` & `story_photo` - Story time feature
- `video_jobs` & `ai_generations` - Video generation tracking
