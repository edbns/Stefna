-- Create Story Time tables manually
-- Run this in your database to create the required tables

-- Create stories table
CREATE TABLE IF NOT EXISTS "public"."stories" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "preset" TEXT NOT NULL DEFAULT 'auto',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "story_text" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "stories_pkey" PRIMARY KEY ("id")
);

-- Create story_photos table
CREATE TABLE IF NOT EXISTS "public"."story_photos" (
    "id" TEXT NOT NULL,
    "story_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "image_url" TEXT NOT NULL,
    "video_url" TEXT,
    "prompt" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "story_photos_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "stories_user_id_created_at_idx" ON "public"."stories"("user_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "stories_status_idx" ON "public"."stories"("status");
CREATE INDEX IF NOT EXISTS "stories_preset_idx" ON "public"."stories"("preset");
CREATE INDEX IF NOT EXISTS "story_photos_story_id_order_idx" ON "public"."story_photos"("story_id", "order");

-- Add foreign key constraints
ALTER TABLE "public"."stories" ADD CONSTRAINT "stories_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."story_photos" ADD CONSTRAINT "story_photos_story_id_fkey" 
    FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Insert a migration record to mark these tables as created
INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count")
VALUES (
    '20250827174500_add_story_time_tables',
    'manual_story_tables_creation',
    CURRENT_TIMESTAMP,
    '20250827174500_add_story_time_tables',
    '["Manually created Story and StoryPhoto tables"]',
    NULL,
    CURRENT_TIMESTAMP,
    1
) ON CONFLICT DO NOTHING;
