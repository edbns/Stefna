-- Add stability_job_id column to neo_glitch_media table
ALTER TABLE "public"."neo_glitch_media" ADD COLUMN "stability_job_id" TEXT;

-- Create index on stability_job_id
CREATE INDEX "neo_glitch_media_stability_job_id_idx" ON "public"."neo_glitch_media"("stability_job_id");
