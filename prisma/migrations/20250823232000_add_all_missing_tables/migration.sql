-- Add all missing tables for complete production database schema

-- 1. Add _extensions table
CREATE TABLE "public"."_extensions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "_extensions_pkey" PRIMARY KEY ("id")
);

-- Create unique index on name
CREATE UNIQUE INDEX "_extensions_name_key" ON "public"."_extensions"("name");

-- 2. Add user_settings table
CREATE TABLE "public"."user_settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "share_to_feed" BOOLEAN NOT NULL DEFAULT true,
    "allow_remix" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- Create unique index on user_id
CREATE UNIQUE INDEX "user_settings_user_id_key" ON "public"."user_settings"("user_id");

-- 3. Add credits_ledger table (CreditTransaction model)
CREATE TABLE "public"."credits_ledger" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credits_ledger_pkey" PRIMARY KEY ("id")
);

-- Create unique index on request_id
CREATE UNIQUE INDEX "credits_ledger_request_id_key" ON "public"."credits_ledger"("request_id");

-- Create indexes for credits_ledger
CREATE INDEX "credits_ledger_user_id_created_at_idx" ON "public"."credits_ledger"("user_id", "created_at" DESC);
CREATE INDEX "credits_ledger_user_id_status_created_at_idx" ON "public"."credits_ledger"("user_id", "status", "created_at" DESC);

-- 4. Add notifications table
CREATE TABLE "public"."notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- Create index for notifications
CREATE INDEX "notifications_user_id_read_created_at_idx" ON "public"."notifications"("user_id", "read", "created_at" DESC);

-- 5. Update media_assets table to match current schema
-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add final_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_assets' AND column_name = 'final_url') THEN
        ALTER TABLE "public"."media_assets" ADD COLUMN "final_url" TEXT;
    END IF;
    
    -- Add cloudinary_public_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_assets' AND column_name = 'cloudinary_public_id') THEN
        ALTER TABLE "public"."media_assets" ADD COLUMN "cloudinary_public_id" TEXT;
    END IF;
    
    -- Add media_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_assets' AND column_name = 'media_type') THEN
        ALTER TABLE "public"."media_assets" ADD COLUMN "media_type" TEXT;
    END IF;
    
    -- Add is_public column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_assets' AND column_name = 'is_public') THEN
        ALTER TABLE "public"."media_assets" ADD COLUMN "is_public" BOOLEAN DEFAULT false;
    END IF;
    
    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_assets' AND column_name = 'status') THEN
        ALTER TABLE "public"."media_assets" ADD COLUMN "status" TEXT DEFAULT 'ready';
    END IF;
    
    -- Add preset_key column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_assets' AND column_name = 'preset_key') THEN
        ALTER TABLE "public"."media_assets" ADD COLUMN "preset_key" TEXT;
    END IF;
    
    -- Add preset_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_assets' AND column_name = 'preset_id') THEN
        ALTER TABLE "public"."media_assets" ADD COLUMN "preset_id" TEXT;
    END IF;
    
    -- Add source_asset_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_assets' AND column_name = 'source_asset_id') THEN
        ALTER TABLE "public"."media_assets" ADD COLUMN "source_asset_id" TEXT;
    END IF;
    
    -- Add meta column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_assets' AND column_name = 'meta') THEN
        ALTER TABLE "public"."media_assets" ADD COLUMN "meta" JSONB;
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_assets' AND column_name = 'updated_at') THEN
        ALTER TABLE "public"."media_assets" ADD COLUMN "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Create additional indexes for media_assets if they don't exist
DO $$
BEGIN
    -- Add final_url index if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'media_assets' AND indexname = 'media_assets_final_url_idx') THEN
        CREATE INDEX "media_assets_final_url_idx" ON "public"."media_assets"("final_url");
    END IF;
    
    -- Add cloudinary_public_id index if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'media_assets' AND indexname = 'media_assets_cloudinary_public_id_idx') THEN
        CREATE INDEX "media_assets_cloudinary_public_id_idx" ON "public"."media_assets"("cloudinary_public_id");
    END IF;
    
    -- Add status index if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'media_assets' AND indexname = 'media_assets_status_idx') THEN
        CREATE INDEX "media_assets_status_idx" ON "public"."media_assets"("status");
    END IF;
END $$;

-- 6. Update users table to match current schema
-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add avatar_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'avatar_url') THEN
        ALTER TABLE "public"."users" ADD COLUMN "avatar_url" TEXT;
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'updated_at') THEN
        ALTER TABLE "public"."users" ADD COLUMN "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- 7. Add foreign key constraints
-- Add user_settings foreign key
ALTER TABLE "public"."user_settings" ADD CONSTRAINT "user_settings_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add credits_ledger foreign key
ALTER TABLE "public"."credits_ledger" ADD CONSTRAINT "credits_ledger_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add notifications foreign key
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 8. Insert default extensions if they don't exist
INSERT INTO "public"."_extensions" ("id", "name", "enabled") VALUES
    ('ext_1', 'default', true)
ON CONFLICT ("name") DO NOTHING;

-- 9. Update existing tables to ensure they have the correct structure
-- This ensures all tables are properly synchronized with the current schema
