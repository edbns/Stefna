-- Fix media_assets table schema to match current Prisma schema
-- This addresses the UUID error and column mismatches

-- 1. Add missing columns to media_assets table
DO $$ 
BEGIN
    -- Add user_id column if it doesn't exist (to replace owner_id)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_assets' AND column_name = 'user_id') THEN
        ALTER TABLE "public"."media_assets" ADD COLUMN "user_id" TEXT;
    END IF;
    
    -- Copy data from owner_id to user_id if user_id is empty
    UPDATE "public"."media_assets" SET "user_id" = "owner_id" WHERE "user_id" IS NULL;
    
    -- Make user_id NOT NULL after data is copied
    ALTER TABLE "public"."media_assets" ALTER COLUMN "user_id" SET NOT NULL;
    
    -- Add missing columns that our schema expects
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_assets' AND column_name = 'cloudinary_public_id') THEN
        ALTER TABLE "public"."media_assets" ADD COLUMN "cloudinary_public_id" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_assets' AND column_name = 'media_type') THEN
        ALTER TABLE "public"."media_assets" ADD COLUMN "media_type" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_assets' AND column_name = 'status') THEN
        ALTER TABLE "public"."media_assets" ADD COLUMN "status" TEXT DEFAULT 'pending';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_assets' AND column_name = 'preset_key') THEN
        ALTER TABLE "public"."media_assets" ADD COLUMN "preset_key" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_assets' AND column_name = 'source_asset_id') THEN
        ALTER TABLE "public"."media_assets" ADD COLUMN "source_asset_id" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_assets' AND column_name = 'allow_remix') THEN
        ALTER TABLE "public"."media_assets" ADD COLUMN "allow_remix" BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_assets' AND column_name = 'env') THEN
        ALTER TABLE "public"."media_assets" ADD COLUMN "env" TEXT DEFAULT 'production';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_assets' AND column_name = 'visibility') THEN
        ALTER TABLE "public"."media_assets" ADD COLUMN "visibility" TEXT DEFAULT 'private';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_assets' AND column_name = 'folder') THEN
        ALTER TABLE "public"."media_assets" ADD COLUMN "folder" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_assets' AND column_name = 'bytes') THEN
        ALTER TABLE "public"."media_assets" ADD COLUMN "bytes" INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_assets' AND column_name = 'width') THEN
        ALTER TABLE "public"."media_assets" ADD COLUMN "width" INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_assets' AND column_name = 'height') THEN
        ALTER TABLE "public"."media_assets" ADD COLUMN "height" INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_assets' AND column_name = 'duration') THEN
        ALTER TABLE "public"."media_assets" ADD COLUMN "duration" INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_assets' AND column_name = 'negative_prompt') THEN
        ALTER TABLE "public"."media_assets" ADD COLUMN "negative_prompt" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_assets' AND column_name = 'model') THEN
        ALTER TABLE "public"."media_assets" ADD COLUMN "model" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_assets' AND column_name = 'mode') THEN
        ALTER TABLE "public"."media_assets" ADD COLUMN "mode" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_assets' AND column_name = 'meta') THEN
        ALTER TABLE "public"."media_assets" ADD COLUMN "meta" JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_assets' AND column_name = 'updated_at') THEN
        ALTER TABLE "public"."media_assets" ADD COLUMN "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- 2. Fix foreign key constraints
DO $$
BEGIN
    -- Drop old foreign key if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'media_assets' AND constraint_name = 'media_assets_owner_id_fkey') THEN
        ALTER TABLE "public"."media_assets" DROP CONSTRAINT "media_assets_owner_id_fkey";
    END IF;
    
    -- Add new foreign key for user_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'media_assets' AND constraint_name = 'media_assets_user_id_fkey') THEN
        ALTER TABLE "public"."media_assets" ADD CONSTRAINT "media_assets_user_id_fkey" 
            FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- 3. Fix indexes
DO $$
BEGIN
    -- Drop old indexes that reference owner_id
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'media_assets' AND indexname = 'media_assets_owner_id_created_at_idx') THEN
        DROP INDEX "media_assets_owner_id_created_at_idx";
    END IF;
    
    -- Create new indexes for user_id
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'media_assets' AND indexname = 'media_assets_user_id_created_at_idx') THEN
        CREATE INDEX "media_assets_user_id_created_at_idx" ON "public"."media_assets"("user_id", "created_at" DESC);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'media_assets' AND indexname = 'media_assets_visibility_created_at_idx') THEN
        CREATE INDEX "media_assets_visibility_created_at_idx" ON "public"."media_assets"("visibility", "created_at" DESC);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'media_assets' AND indexname = 'media_assets_public_id_idx') THEN
        CREATE INDEX "media_assets_public_id_idx" ON "public"."media_assets"("public_id");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'media_assets' AND indexname = 'media_assets_status_idx') THEN
        CREATE INDEX "media_assets_status_idx" ON "public"."media_assets"("status");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'media_assets' AND indexname = 'media_assets_cloudinary_public_id_idx') THEN
        CREATE INDEX "media_assets_cloudinary_public_id_idx" ON "public"."media_assets"("cloudinary_public_id");
    END IF;
END $$;

-- 4. Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'media_assets' 
ORDER BY ordinal_position;

-- 5. Show current indexes
SELECT 
    indexname, 
    indexdef
FROM pg_indexes 
WHERE tablename = 'media_assets';
